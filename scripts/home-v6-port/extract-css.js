const fs = require('fs');
const path = require('path');

const htmlFile = 'K:\\H DRIVE\\Quantum Climb\\APPS\\FUZO_V3\\docs\\fuzo-v6.html';
const outFile = 'c:\\Users\\mmu\\Projects\\fuzo-next\\src\\app\\(main)\\home.css';

const html = fs.readFileSync(htmlFile, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  let css = styleMatch[1];
  
  // Scope generic body and html styles
  css = css.replace(/body\s*\{/g, '.v6-page {');
  css = css.replace(/html\s*\{/g, '.v6-page-wrapper {'); // Optional, might not be needed
  
  // Remove nav styles to not conflict with SiteHeader
  // The nav styles start around line 64 and go until Hero
  css = css.replace(/nav\s*\{[\s\S]*?\}/g, '/* nav omitted */');
  css = css.replace(/nav\.on\s*\{[\s\S]*?\}/g, '/* nav.on omitted */');
  css = css.replace(/\.nav-logo\s*\{[\s\S]*?\}/g, '/* .nav-logo omitted */');
  css = css.replace(/\.nav-logo img\s*\{[\s\S]*?\}/g, '/* .nav-logo img omitted */');
  css = css.replace(/\.nav-links\s*\{[\s\S]*?\}/g, '/* .nav-links omitted */');
  css = css.replace(/\.nav-links a\s*\{[\s\S]*?\}/g, '/* .nav-links a omitted */');
  css = css.replace(/\.nav-links a:hover\s*\{[\s\S]*?\}/g, '/* .nav-links a:hover omitted */');
  css = css.replace(/\.nav-cta\s*\{[\s\S]*?\}/g, '/* .nav-cta omitted */');
  css = css.replace(/\.nav-cta:hover\s*\{[\s\S]*?\}/g, '/* .nav-cta:hover omitted */');
  
  fs.writeFileSync(outFile, css);
  console.log('CSS extracted and scoped successfully.');
} else {
  console.log('No <style> block found.');
}
