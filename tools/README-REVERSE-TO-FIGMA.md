# React to Figma Reverse Engineering Tool

This tool automatically converts your React/TypeScript components into Figma-compatible JSON structures, enabling you to visualize and design your application directly in Figma.

## 🎯 What It Does

- **Parses React/TSX files** using Babel AST
- **Extracts component structure** (JSX hierarchy, props, classes)
- **Interprets Tailwind classes** to Figma properties (layout, spacing, colors, typography)
- **Generates Figma JSON** conforming to Figma REST API format
- **Exports individual pages** and combined project file

## 📦 Installation

Install required dependencies:

```bash
npm install --save-dev @babel/parser @babel/traverse fast-glob
```

## 🚀 Usage

### Process Single Page

```bash
node tools/reverseToFigma.mjs src/components/home/components/LandingPage.tsx
```

### Process All Pages

```bash
node tools/reverseToFigma.mjs --all
```

This processes all 9 main pages:
- Landing Page (Home)
- Dashboard
- Feed
- Scout
- Bites
- Chat
- Plate
- Trims
- Snap

### Custom Glob Pattern

```bash
node tools/reverseToFigma.mjs "src/components/**/*.tsx"
```

## 📂 Output Structure

```
figma_exports/
├── LandingPage.json          # Individual page exports
├── Dashboard.json
├── Feed.json
├── Scout.json
├── Bites.json
├── Chat.json
├── Plate.json
├── Trims.json
├── Snap.json
├── full_project.json         # Combined export with all pages
└── _index.txt                # List of exported files
```

## 🎨 How It Works

### 1. JSX Parsing

Uses `@babel/parser` to convert React components to AST:

```tsx
// Input React Component
export default function Hero() {
  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-orange-500 rounded-xl">
      <h1 className="text-4xl font-bold">Welcome to FUZO</h1>
      <button className="px-6 py-3 bg-white rounded-full">Get Started</button>
    </div>
  );
}
```

### 2. Tailwind Class Interpretation

Maps Tailwind utilities to Figma properties:

| Tailwind | Figma Property |
|----------|----------------|
| `flex` | `layoutMode: "HORIZONTAL"` |
| `flex-col` | `flexDirection: "COLUMN"` |
| `gap-6` | `itemSpacing: 24` |
| `p-8` | `padding: 32` |
| `bg-orange-500` | `fills: [{ color: #FF6B35 }]` |
| `rounded-xl` | `cornerRadius: 16` |
| `text-4xl` | `fontSize: 36` |
| `font-bold` | `fontWeight: 700` |

### 3. Figma Node Generation

Creates Figma-compatible node tree:

```json
{
  "id": "1:0",
  "type": "FRAME",
  "name": "Hero",
  "layoutMode": "VERTICAL",
  "primaryAxisAlignItems": "CENTER",
  "itemSpacing": 24,
  "paddingTop": 32,
  "paddingRight": 32,
  "paddingBottom": 32,
  "paddingLeft": 32,
  "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 0.42, "b": 0.21 } }],
  "cornerRadius": 16,
  "children": [
    {
      "id": "2:0",
      "type": "TEXT",
      "name": "H1",
      "characters": "Welcome to FUZO",
      "fontSize": 36,
      "fontWeight": 700
    },
    {
      "id": "3:0",
      "type": "FRAME",
      "name": "BUTTON",
      "layoutMode": "HORIZONTAL",
      "paddingTop": 12,
      "paddingRight": 24,
      "paddingBottom": 12,
      "paddingLeft": 24,
      "children": [
        {
          "id": "4:0",
          "type": "TEXT",
          "characters": "Get Started"
        }
      ]
    }
  ]
}
```

## 🔄 Import into Figma

### Method 1: Figma REST API (Recommended)

Use Figma's REST API to create a new file:

```bash
# Set your Figma personal access token
export FIGMA_TOKEN="your-personal-access-token"

# Upload to Figma
curl -X POST "https://api.figma.com/v1/files" \
  -H "X-Figma-Token: $FIGMA_TOKEN" \
  -H "Content-Type: application/json" \
  -d @figma_exports/LandingPage.json
```

### Method 2: Figma Plugin

Create a custom Figma plugin to import the JSON:

```typescript
// plugin.ts
async function importFromJSON() {
  const json = await figma.ui.postMessage({ type: 'get-json' });
  const data = JSON.parse(json);
  
  function createNode(nodeData: any, parent: any) {
    let node;
    
    if (nodeData.type === 'FRAME') {
      node = figma.createFrame();
      node.layoutMode = nodeData.layoutMode;
      node.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
      node.counterAxisAlignItems = nodeData.counterAxisAlignItems;
      node.itemSpacing = nodeData.itemSpacing;
      node.paddingTop = nodeData.paddingTop;
      node.paddingRight = nodeData.paddingRight;
      node.paddingBottom = nodeData.paddingBottom;
      node.paddingLeft = nodeData.paddingLeft;
      node.cornerRadius = nodeData.cornerRadius;
      if (nodeData.fills) node.fills = nodeData.fills;
    } else if (nodeData.type === 'TEXT') {
      node = figma.createText();
      node.characters = nodeData.characters;
      node.fontSize = nodeData.fontSize;
      node.fontName = nodeData.fontName;
    } else if (nodeData.type === 'RECTANGLE') {
      node = figma.createRectangle();
      node.cornerRadius = nodeData.cornerRadius;
      if (nodeData.fills) node.fills = nodeData.fills;
    }
    
    if (node) {
      node.name = nodeData.name;
      parent.appendChild(node);
      
      if (nodeData.children) {
        for (const child of nodeData.children) {
          createNode(child, node);
        }
      }
    }
    
    return node;
  }
  
  const canvas = figma.currentPage;
  const rootFrame = data.document.children[0].children[0];
  createNode(rootFrame, canvas);
  
  figma.closePlugin('Import complete!');
}

importFromJSON();
```

### Method 3: Manual Import

1. Copy JSON content from `figma_exports/LandingPage.json`
2. Use a Figma plugin like "JSON to Figma" or "Figma to Code"
3. Paste the JSON and let the plugin reconstruct the design

## 🎨 FUZO Design Tokens

The tool automatically maps FUZO brand colors:

```javascript
const FUZO_COLORS = {
  "orange-500": "#FF6B35",    // Primary brand orange
  "yellow-400": "#FFD74A",    // Brand yellow
  "navy-900": "#0B1F3A",      // Dark navy blue
  "gray-50 to 900": "..."     // Neutral grays
};
```

Typography mapping:

```javascript
- Headings: Fredoka (Semi Bold 600)
- Body: Urbanist (Regular 400)
- Code: Cousine (Regular 400)
```

## 📋 Supported Features

### Layout
- ✅ Flexbox (horizontal/vertical)
- ✅ Auto-layout (gap, padding)
- ✅ Alignment (justify, items)
- ⚠️ Grid (converted to nested frames)

### Styling
- ✅ Background colors
- ✅ Border radius
- ✅ Padding (all sides)
- ✅ Margin (ignored - not in Figma auto-layout)

### Typography
- ✅ Font size (text-xs to text-5xl)
- ✅ Font weight (light to bold)
- ✅ Font family mapping
- ✅ Line height

### Components
- ✅ Buttons → Frame with text
- ✅ Inputs → Frame with placeholder
- ✅ Images → Rectangle placeholders
- ✅ Text elements → Text nodes
- ✅ Containers → Frames

### Not Yet Supported
- ❌ Shadows
- ❌ Borders (stroke)
- ❌ Transform (rotate, scale)
- ❌ Opacity
- ❌ Absolute positioning
- ❌ Z-index

## 🔧 Customization

### Add Custom Color Mappings

Edit `FUZO_COLORS` in `reverseToFigma.mjs`:

```javascript
const FUZO_COLORS = {
  "custom-blue": { r: 0.2, g: 0.4, b: 0.8 },
  // ... add more
};
```

### Change Default Font

Edit `DEFAULT_FONT`:

```javascript
const DEFAULT_FONT = { 
  family: "Fredoka", 
  size: 16, 
  weight: 600, 
  lineHeight: 1.5 
};
```

### Adjust Frame Size

Edit `PAGE_FRAME_SIZE`:

```javascript
const PAGE_FRAME_SIZE = { width: 1920, height: 1080 };
```

## 🐛 Troubleshooting

### "No root JSX found"
- Ensure your component has a default export
- Check that the component returns JSX

### "Parse error"
- Verify your TSX syntax is valid
- Ensure all TypeScript features are supported by Babel

### Missing styles
- Add Tailwind class mappings to `interpretTailwindClasses()`
- Check console warnings for unsupported classes

### Incorrect layout
- Verify auto-layout direction (flex-row vs flex-col)
- Check padding/spacing values match expectations

## 📚 Example Output

See `figma_exports/` directory after running:

```bash
node tools/reverseToFigma.mjs --all
```

You'll get:
- 9 individual page JSON files
- 1 combined `full_project.json` with all pages
- `_index.txt` listing all exports

## 🚀 Next Steps

1. **Run the tool** on your pages
2. **Review JSON output** in `figma_exports/`
3. **Import to Figma** using REST API or plugin
4. **Refine designs** in Figma
5. **Extract design tokens** back to code

## 🤝 Contributing

To extend the tool:

1. Add Tailwind class mappings in `interpretTailwindClasses()`
2. Enhance node builders in `createFrameNode()`, `createTextNode()`
3. Improve JSX parsing in `convertJSXElementToFigma()`
4. Add support for new component types

## 📄 License

MIT License - Part of the FUZO project

---

**Made with ❤️ for the FUZO Design System**
