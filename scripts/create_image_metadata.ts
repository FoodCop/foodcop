import fs from 'fs';
import path from 'path';
import { MASTERBOT_PERSONAS, type MasterbotPersona } from './data/masterbotPersonas';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
  process.exit(1);
}

const MASTERSET_DIR = 'K:/H DRIVE/Quantum Climb/APPS/Fuzo_Doc_Backup/data';
const IMAGES_DIR = path.resolve(__dirname, '../public/generated-images');
const OUTPUT_FILE = path.join(IMAGES_DIR, 'masterbot_image_metadata.json');

interface MasterSetRow {
  title: string;
  categoryName?: string;
  categories?: string[];
  city?: string;
  placeId: string;
  location?: { lat: number; lng: number };
}

interface ImageMetadata {
  filename: string;
  image_url: string;
  persona_name: string;
  persona_slug: string;
  source: 'RESTAURANT' | 'DISCOVERY';
  restaurant_name: string | null;
  cuisine: string;
  dish_name: string;
  dish_description: string;
  ingredients: string[];
  flavor_profile: {
    sweet: number;
    sour: number;
    salty: number;
    spicy: number;
    umami: number;
  };
}

function loadCityRows(cityFiles: string[]): MasterSetRow[] {
  const rows: MasterSetRow[] = [];
  for (const city of cityFiles) {
    const p = path.join(MASTERSET_DIR, `MasterSet_${city}.json`);
    if (!fs.existsSync(p)) continue;
    const cityRows: MasterSetRow[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
    rows.push(...cityRows);
  }
  return rows;
}

async function generateDishMetadata(
  title: string,
  category: string,
  cuisines: string[],
  personaName: string
): Promise<{
  dish_name: string;
  dish_description: string;
  ingredients: string[];
  flavor_profile: { sweet: number; sour: number; salty: number; spicy: number; umami: number };
}> {
  console.log(`  Calling OpenAI to generate recipe metadata for: ${title}...`);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional culinary assistant. Generate recipe metadata as JSON matching this schema:
{
  "dish_name": "Name of the dish (e.g. Otoro Tuna Nigiri)",
  "dish_description": "Mouthwatering 1-sentence description of the dish focusing on flavor and texture",
  "ingredients": ["3-5 main ingredients needed for the recipe"],
  "flavor_profile": {
    "sweet": 0 to 5,
    "sour": 0 to 5,
    "salty": 0 to 5,
    "spicy": 0 to 5,
    "umami": 0 to 5
  }
}`
          },
          {
            role: "user",
            content: `Restaurant/Context: "${title}"
Category: "${category}"
Cuisines: ${cuisines.join(', ')}
Persona: ${personaName}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`GPT error: ${JSON.stringify(data)}`);
    }
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("  Error generating metadata, using fallback:", err);
    return {
      dish_name: `${cuisines[0] || 'Signature'} Gourmet Dish`,
      dish_description: `A delicious local specialty featuring fresh ingredients cooked to perfection.`,
      ingredients: ["Fresh local ingredients", "Spices", "Chef's secret sauce"],
      flavor_profile: { sweet: 2, sour: 1, salty: 2, spicy: 1, umami: 4 }
    };
  }
}

async function run() {
  console.log("Creating metadata mapping for Masterbot images...");

  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png') && f !== 'test_gpt_image_2.png');
  console.log(`Found ${files.length} images to label.`);

  const metadataList: ImageMetadata[] = [];

  // Pre-load all matched restaurants for all personas to map placeId back easily
  const placeToPersonaMap = new Map<string, { persona: MasterbotPersona; row: MasterSetRow }>();
  for (const persona of MASTERBOT_PERSONAS) {
    const cityRows = loadCityRows(persona.cityFiles);
    const matched = cityRows
      .filter((r) => {
        const haystack = `${r.categoryName || ''} ${(r.categories || []).join(' ')}`;
        return persona.categoryPattern.test(haystack) && r.location?.lat && r.location?.lng;
      })
      .slice(0, 8);

    for (const r of matched) {
      placeToPersonaMap.set(r.placeId, { persona, row: r });
    }
  }

  for (const filename of files) {
    console.log(`Processing file: ${filename}`);

    let persona: MasterbotPersona | undefined;
    let source: 'RESTAURANT' | 'DISCOVERY' = 'RESTAURANT';
    let restaurantName: string | null = null;
    let cuisine = '';
    let contextTitle = '';
    let category = '';

    if (filename.includes('_discovery_')) {
      source = 'DISCOVERY';
      const slug = filename.split('_discovery_')[0];
      persona = MASTERBOT_PERSONAS.find(p => p.slug === slug);
      if (!persona) continue;

      contextTitle = `${persona.displayName}'s Signature Discovery`;
      category = 'Signature Dish';
      cuisine = persona.cuisines[0] || 'Global';
    } else {
      const placeId = filename.replace('_v2.png', '');
      const mapping = placeToPersonaMap.get(placeId);
      if (!mapping) {
        console.warn(`  Warning: placeId ${placeId} not found in matched personas!`);
        continue;
      }
      persona = mapping.persona;
      restaurantName = mapping.row.title;
      contextTitle = mapping.row.title;
      category = mapping.row.categoryName || 'Restaurant';
      cuisine = persona.cuisines[0] || 'Global';
    }

    const dishMeta = await generateDishMetadata(contextTitle, category, persona.cuisines, persona.displayName);

    metadataList.push({
      filename,
      image_url: `/generated-images/${filename}`,
      persona_name: persona.displayName,
      persona_slug: persona.slug,
      source,
      restaurant_name: restaurantName,
      cuisine,
      ...dishMeta
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadataList, null, 2));
  console.log(`\nSuccessfully created metadata file: ${OUTPUT_FILE}`);
}

run();
