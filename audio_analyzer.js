class AudioAnalyzer {
    constructor(fftSize = 256) {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.sourceNode = null;
        this.fftSize = fftSize;
        
        // BPM / Audio State
        this.lastBeatTime = 0;
        this.beatThreshold = 0.4; 
        this.detectedBPM = 0;
        this.beatIntervals = [];
        this.smoothBPM = 60;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
        return this.audioContext;
    }

    // Helper for microphone (some visualizers might use mic, some use file)
    async connectMicrophone() {
        this.init();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.sourceNode.connect(this.analyser);
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            return false;
        }
    }

    connectBufferSource(buffer, onendedCallback = null) {
        this.init();
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            if (this.sourceNode.stop) this.sourceNode.stop();
        }

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = buffer;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        if (onendedCallback) {
            this.sourceNode.onended = onendedCallback;
        }
        this.sourceNode.start(0);
        return this.sourceNode;
    }

    // Standard slices, pass custom depending on visualizer
    getAudioData(slices = { bass: [0, 10], mid: [10, 80], high: [80, 200] }) {
        if (!this.analyser) return { bass: 0, mid: 0, high: 0 };
        this.analyser.getByteFrequencyData(this.dataArray);

        // Don't use standard Array slice methods, need a loop for Uint8Array for efficiency
        let bassSum = 0, midSum = 0, highSum = 0;
        
        const bassEnd = Math.min(slices.bass[1], this.dataArray.length);
        const midEnd = Math.min(slices.mid[1], this.dataArray.length);
        const highEnd = Math.min(slices.high[1], this.dataArray.length);

        for (let i = slices.bass[0]; i < bassEnd; i++) bassSum += this.dataArray[i];
        for (let i = slices.mid[0]; i < midEnd; i++) midSum += this.dataArray[i];
        for (let i = slices.high[0]; i < highEnd; i++) highSum += this.dataArray[i];

        const bassCount = Math.max(1, bassEnd - slices.bass[0]);
        const midCount = Math.max(1, midEnd - slices.mid[0]);
        const highCount = Math.max(1, highEnd - slices.high[0]);

        return {
            bass: (bassSum / bassCount) / 255,
            mid: (midSum / midCount) / 255,
            high: (highSum / highCount) / 255
        };
    }

    // Detects beat based on high level (custom logic pulled from visualizers)
    detectBeat(highLevel, nowMs) {
        let isBeat = false;
        if (highLevel > this.beatThreshold && highLevel > 0.3) {
            if (nowMs - this.lastBeatTime > 200) {
                const interval = nowMs - this.lastBeatTime;
                this.lastBeatTime = nowMs;

                // Typical BPM tracking logic from visualizers
                if (interval > 300 && interval < 2000) { 
                    this.beatIntervals.push(interval);
                    if (this.beatIntervals.length > 8) this.beatIntervals.shift();

                    const avgInterval = this.beatIntervals.reduce((a, b) => a + b) / this.beatIntervals.length;
                    this.detectedBPM = 60000 / avgInterval; // nowMs is in milliseconds!
                    isBeat = true;
                }
            }
        }
        return isBeat;
    }
}
