const fs = require('fs');
const content = fs.readFileSync('prompt.txt', 'utf-8');
const lines = content.split('\n');
let jsxStart = -1;
let jsxCode = '';
let capture = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '```jsx' && lines[i-1].includes('Full Component Source')) {
    capture = true;
    continue;
  }
  if (capture && lines[i].trim() === '```') {
    break;
  }
  if (capture) {
    jsxCode += lines[i] + '\n';
  }
}
fs.writeFileSync('components/ui/CodeSlots.tsx', jsxCode);

let cssStart = -1;
let cssCode = '';
let captureCss = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '```css') {
    captureCss = true;
    continue;
  }
  if (captureCss && lines[i].trim() === '```') {
    break;
  }
  if (captureCss) {
    cssCode += lines[i] + '\n';
  }
}
fs.writeFileSync('components/ui/CodeSlots.css', cssCode);

