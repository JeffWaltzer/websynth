const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

const checkVariables = [
  'audioContext', 'analyser', 'dataArray', 'sourceNode', 
  'detectedBPM', 'lastBeatTime', 'beatThreshold', 'smoothBPM'
];

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  
  if (content.includes('const audio = new AudioAnalyzer')) {
    let foundBug = false;
    checkVariables.forEach(v => {
      // Look for stray variables that aren't prefixed with "audio."
      const regex = new RegExp(`(?<!audio\.)\b${v}\b`);
      if (regex.test(content)) {
        console.log(`Potential bug in ${file}: Found unbound variable '${v}'`);
        foundBug = true;
      }
    });
    if (!foundBug) {
      console.log(`${file} looks clean!`);
    }
  }
});
