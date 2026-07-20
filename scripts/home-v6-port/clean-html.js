const fs = require('fs');
const path = require('path');

const htmlFile = 'K:\\H DRIVE\\Quantum Climb\\APPS\\FUZO_V3\\docs\\fuzo-v6.html';
const outFile = 'c:\\Users\\mmu\\Projects\\fuzo-next\\scripts\\home-v6-port\\fuzo-v6-clean.html';

const html = fs.readFileSync(htmlFile, 'utf8');

// Remove base64 image data to make the file readable
const cleanHtml = html.replace(/src="data:image\/[^;]+;base64,[^"]+"/g, 'src="[BASE64_REMOVED]"');

fs.writeFileSync(outFile, cleanHtml);
console.log('Cleaned HTML saved successfully.');
