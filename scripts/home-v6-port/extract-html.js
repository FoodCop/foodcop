const fs = require('fs');

const htmlFile = 'K:\\H DRIVE\\Quantum Climb\\APPS\\FUZO_V3\\docs\\fuzo-v6.html';
const outFile = 'c:\\Users\\mmu\\Projects\\fuzo-next\\scripts\\home-v6-port\\fuzo-v6-skeleton.html';

const html = fs.readFileSync(htmlFile, 'utf8');

let cleanHtml = html.replace(/<style>[\s\S]*?<\/style>/gi, '');
cleanHtml = cleanHtml.replace(/<img[^>]*>/gi, '<img src="/placeholder.png" alt="img" />');
cleanHtml = cleanHtml.replace(/<svg[\s\S]*?<\/svg>/gi, '<svg>removed</svg>');
cleanHtml = cleanHtml.replace(/url\(['"]?data:image[^)]+\)/gi, "url('/placeholder.png')");

// Extract just the body content
const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyMatch) {
  fs.writeFileSync(outFile, bodyMatch[1]);
  console.log('Skeleton saved.');
} else {
  fs.writeFileSync(outFile, cleanHtml);
  console.log('Skeleton saved (full html).');
}
