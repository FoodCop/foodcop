const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/bites/BitesView.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { from: /'..\/..\/..\/shared\/utils\/taxonomy'/g, to: "'@/lib/utils/taxonomy'" },
  { from: /'..\/..\/..\/shared\/ui\/Badge'/g, to: "'@/components/ui/Badge'" },
  { from: /'..\/..\/..\/shared\/ui\/StudioStepper'/g, to: "'@/components/ui/StudioStepper'" },
  { from: /'..\/..\/..\/shared\/ui\/Skeleton'/g, to: "'@/components/ui/Skeleton'" },
  { from: /'..\/..\/..\/shared\/lib\/studioHelpers'/g, to: "'@/lib/utils/studioHelpers'" },
  { from: /'..\/..\/..\/shared\/ui\/NeuralReveal'/g, to: "'@/components/ui/NeuralReveal'" },
  { from: /'..\/constants\/filters'/g, to: "'./constants/filters'" },
  { from: /'..\/..\/feed'/g, to: "'./feedStub'" },
  { from: /'..\/..\/..\/shared\/ui\/UgcFilterBar'/g, to: "'@/components/ui/UgcFilterBar'" },
  { from: /'..\/constants\/fallbackRecipes'/g, to: "'./constants/fallbackRecipes'" },
  { from: /'..\/lib\/bitesHelpers'/g, to: "'./lib/bitesHelpers'" },
  { from: /'..\/types\/bites'/g, to: "'./types/bites'" },
  { from: /'..\/..\/..\/services\/geminiService'/g, to: "'@/lib/services/geminiService'" },
  { from: /'..\/..\/..\/services\/metaService'/g, to: "'@/lib/services/metaService'" },
  { from: /'..\/..\/..\/shared\/utils\/async'/g, to: "'@/lib/utils/async'" },
  { from: /'..\/..\/..\/services\/supabaseClient'/g, to: "'./supabaseStub'" },
  { from: /'..\/..\/..\/shared\/types\/appItem'/g, to: "'./types/bites'" },
  { from: /'..\/..\/chat\/types\/chatUi'/g, to: "'./types/bites'" },
  { from: /'..\/..\/..\/shared\/types\/ui'/g, to: "'./types/bites'" },
  { from: /'..\/..\/..\/services\/youtubeService'/g, to: "'@/lib/services/youtubeService'" },
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(file, content, 'utf8');
console.log('Patched BitesView.tsx');
