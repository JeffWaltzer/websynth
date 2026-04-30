// Unit tests for AudioAnalyzer class using Mocha and Chai

describe('AudioAnalyzer', function() {
    let analyzer;

    beforeEach(function() {
        // Reset state before each test
        analyzer = new AudioAnalyzer(256);
        
        // Mock the window AudioContext and related objects
        window.AudioContext = window.AudioContext || function() {
            this.createAnalyser = function() {
                return {
                    frequencyBinCount: 128,
                    getByteFrequencyData: function(array) {
                        // Fill array with dummy data (0-255)
                        for(let i=0; i<array.length; i++) {
                            array[i] = i; // simple ramp data
                        }
                    }
                };
            };
            this.createMediaStreamSource = function() { return { connect: () => {} }; };
            this.createBufferSource = function() { return { connect: () => {}, start: () => {}, stop: () => {}, disconnect: () => {} }; };
            this.destination = {};
        };
    });

    it('should initialize correctly with default fftSize', function() {
        expect(analyzer.fftSize).to.equal(256);
        expect(analyzer.beatThreshold).to.equal(0.4);
    });

    it('should create an audio context and analyser on init()', function() {
        expect(analyzer.audioContext).to.be.null;
        analyzer.init();
        expect(analyzer.audioContext).to.not.be.null;
        expect(analyzer.analyser).to.not.be.null;
        expect(analyzer.dataArray).to.be.instanceof(Uint8Array);
    });

    it('should correctly slice and compute audio frequency data', function() {
        analyzer.init();
        
        // Use custom small slices so we can verify the math
        const slices = { 
            bass: [0, 5],   // indices 0,1,2,3,4
            mid: [5, 10],   // indices 5,6,7,8,9
            high: [10, 15]  // indices 10,11,12,13,14
        };
        
        const data = analyzer.getAudioData(slices);
        
        // Our mock fills the array with its index: arr[i] = i
        // Bass sum = 0+1+2+3+4 = 10. Avg = 10/5 = 2. Expected output = 2/255
        expect(data.bass).to.be.closeTo(2 / 255, 0.001);
        
        // Mid sum = 5+6+7+8+9 = 35. Avg = 35/5 = 7. Expected output = 7/255
        expect(data.mid).to.be.closeTo(7 / 255, 0.001);
        
        // High sum = 10+11+12+13+14 = 60. Avg = 60/5 = 12. Expected output = 12/255
        expect(data.high).to.be.closeTo(12 / 255, 0.001);
    });

    it('should detect a beat when the high level exceeds the threshold and interval is valid', function() {
        const time1 = 1000;
        const time2 = 1500; // 500ms interval => 120 BPM
        
        analyzer.beatThreshold = 0.4;
        
        // First beat (no previous beat time so it might not trigger immediately or just set time)
        // Actually, our code sets isBeat = true only if (now - lastBeatTime > 200) AND we enter the block.
        // Wait, the code says:
        // if (nowMs - this.lastBeatTime > 200) { 
        //     interval = ...
        //     this.lastBeatTime = nowMs;
        //     if (interval > 300 && interval < 2000) ... isBeat = true;
        // }
        // Since lastBeatTime is 0 initially:
        const firstBeat = analyzer.detectBeat(0.5, time1); // interval = 1000. 1000 > 300, so it WILL be a beat!
        expect(firstBeat).to.be.true;
        expect(analyzer.lastBeatTime).to.equal(1000);
        expect(analyzer.detectedBPM).to.equal(60000 / 1000); // 60 BPM

        // Send a low level, shouldn't be a beat
        const noBeat = analyzer.detectBeat(0.1, time1 + 100);
        expect(noBeat).to.be.false;

        // Second beat 500ms later (120 BPM)
        const secondBeat = analyzer.detectBeat(0.6, time2);
        expect(secondBeat).to.be.true;
        
        // Now intervals array has [1000, 500], avg = 750, bpm = 60000 / 750 = 80
        expect(analyzer.detectedBPM).to.equal(80);
    });
    
    it('should ignore beats that happen too quickly (debouncing)', function() {
        const time1 = 1000;
        const time2 = 1100; // only 100ms later
        
        analyzer.detectBeat(0.6, time1);
        const doubleBeat = analyzer.detectBeat(0.6, time2);
        
        expect(doubleBeat).to.be.false; // Should be debounced
    });
});
