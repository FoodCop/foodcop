import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { MASTERBOT_PERSONAS, type MasterbotPersona } from './data/masterbotPersonas';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MASTERSET_DIR = 'K:/H DRIVE/Quantum Climb/APPS/Fuzo_Doc_Backup/data';
const IMAGES_SRC_DIR = 'K:/H DRIVE/Quantum Climb/APPS/Fuzo_Doc_Backup/public/generated-images';
const IMAGES_DEST_DIR = path.resolve(__dirname, '../public/generated-images');

// Ensure destination dir exists
fs.mkdirSync(IMAGES_DEST_DIR, { recursive: true });

const GLOBAL_STYLE = `Professional food photography for a premium culinary discovery platform.
The food is the hero of the image.
Photographed using realistic commercial food photography techniques.
Natural food textures.
Authentic ingredients.
Professional food styling.
Clean composition.
Exceptional plating.
Realistic lighting.
Shallow depth of field.
Editorial food photography.
Award-winning culinary photography.
Canon EOS R5.
Ultra-high-resolution.
Commercial advertising quality.
No artificial appearance.
No CGI look.
No exaggerated food styling.
No unrealistic colors.
No clutter.
No unnecessary props.
The image should feel authentic, aspirational, and professionally photographed.`;

const UNIVERSAL_NEGATIVE = `Avoid: cartoon, cgi, 3d render, illustration, anime, ai generated appearance, plastic textures, unrealistic food, oversaturated colors, food delivery photography, low quality, blurry, text, watermark, logo, people, hands, fingers, utensils being held, duplicate food, floating ingredients, deformed food, cluttered composition, stock photo appearance.`;

const PROFILE_STYLES: Record<string, { style: string; lighting: string }> = {
  'jun-tanaka': {
    style: `Japanese zen minimalism. Wabi-sabi aesthetics. Michelin-star omakase. Artisan ceramic tableware. Generous negative space. Refined restraint. Sophisticated hospitality photography. Subtle moody lighting. Luxury restaurant atmosphere. Understated elegance.`,
    lighting: `soft moody indoor lighting, luxury Japanese restaurant ambiance, warm subtle highlights, minimalist composition`
  },
  'aurelia-voss': {
    style: `Premium street food culture. Travel magazine photography. Urban culinary exploration. Modern food hall atmosphere. Contemporary street food presentation. Energetic composition. Authentic local food culture. Commercial fast-casual advertising.`,
    lighting: `natural daylight, bright outdoor environment, open-air food market atmosphere, fresh vibrant colors, travel editorial photography`
  },
  'sebastian-leclair': {
    style: `Michelin-star tasting menu. Luxury fine dining. World-class gastronomy. Architectural plating. Luxury hospitality photography. Sophisticated table setting. Culinary artistry. Editorial restaurant photography.`,
    lighting: `dramatic fine dining lighting, dark luxury restaurant ambiance, controlled highlights, editorial culinary photography`
  },
  'lila-cheng': {
    style: `Plant-based gastronomy. Sustainable cuisine. Seasonal ingredients. Organic produce. Wellness-focused fine dining. Natural beauty. Fresh botanical presentation.`,
    lighting: `soft natural daylight, bright airy atmosphere, fresh organic aesthetic, clean contemporary environment`
  },
  'rafael-mendez': {
    style: `Regional culinary discovery. Authentic cultural cuisine. Luxury travel photography. Destination dining. Rare ingredients. Global food exploration. Rich culinary storytelling.`,
    lighting: `golden hour lighting, travel magazine aesthetic, outdoor destination atmosphere, warm natural sunlight`
  },
  'anika-kapoor': {
    style: `Indian and Asian culinary heritage. Layered flavors. Authentic spices. Regional cooking traditions. Premium contemporary presentation. Cultural richness. Refined spice-forward cuisine.`,
    lighting: `warm daylight, rich color rendering, premium restaurant atmosphere, vibrant but realistic colors`
  },
  'omar-darzi': {
    style: `Specialty coffee culture. Third-wave coffee movement. Artisan cafés. Coffee craftsmanship. Lifestyle editorial photography. Slow living aesthetic.`,
    lighting: `morning window light, soft natural illumination, café atmosphere, minimalist lifestyle photography`
  }
};

interface MasterSetRow {
  title: string;
  categoryName?: string;
  categories?: string[];
  address?: string;
  city?: string;
  price?: string;
  totalScore?: number;
  placeId: string;
  location?: { lat: number; lng: number };
  imageUrl?: string;
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

async function generateDishDescription(restaurant: MasterSetRow, persona: MasterbotPersona): Promise<string> {
  console.log(`  Generating dish description for: ${restaurant.title}...`);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a gourmet food writer. Describe a single mouth-watering signature dish or beverage served at the given restaurant. Make it 1 sentence, highly descriptive of the food, visual appearance, and texture. Do not mention people, hands, or utensils."
          },
          {
            role: "user",
            content: `Restaurant: "${restaurant.title}"
Category: "${restaurant.categoryName || ''}"
Cuisines: ${persona.cuisines.join(', ')}
Style: ${persona.displayName}'s preference (${persona.subtype})`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`GPT Chat error: ${JSON.stringify(data)}`);
    }
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("  Error generating description, using fallback:", err);
    return `A signature gourmet dish featuring fresh local ingredients prepared in ${persona.cuisines[0] || 'delicious'} style.`;
  }
}

async function generateImage(prompt: string, filename: string): Promise<string | null> {
  const destPath = path.join(IMAGES_DEST_DIR, filename);
  if (fs.existsSync(destPath)) {
    console.log(`  Image ${filename} already exists, skipping generation.`);
    return `/generated-images/${filename}`;
  }

  console.log(`  Generating image for: ${filename}...`);
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      console.error(`  OpenAI Image generation error:`, JSON.stringify(data));
      return null;
    }

    const base64Data = data.data[0].b64_json;
    fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
    console.log(`  Successfully saved image to ${destPath}`);
    return `/generated-images/${filename}`;
  } catch (err) {
    console.error(`  Error generating image for ${filename}:`, err);
    return null;
  }
}

async function processPersona(persona: MasterbotPersona) {
  console.log(`\n==========================================`);
  console.log(`Processing Persona: ${persona.displayName}`);
  console.log(`==========================================`);

  const pConfig = PROFILE_STYLES[persona.slug];
  if (!pConfig) {
    console.warn(`  No style configuration found for ${persona.slug}, skipping.`);
    return;
  }

  // 1. Get user id from database
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', persona.email)
    .maybeSingle();

  if (!user) {
    console.warn(`  User account not found for ${persona.displayName}, run seed_masterbots.ts first!`);
    return;
  }

  // 2. Resolve restaurant rows
  const cityRows = loadCityRows(persona.cityFiles);
  const matchedRestaurants = cityRows
    .filter((r) => {
      const haystack = `${r.categoryName || ''} ${(r.categories || []).join(' ')}`;
      return persona.categoryPattern.test(haystack) && r.location?.lat && r.location?.lng;
    })
    .slice(0, 8);

  console.log(`  Found ${matchedRestaurants.length} restaurants for seeding/checking.`);

  // 3. Process each restaurant
  for (const r of matchedRestaurants) {
    const filename = `${r.placeId}_v2.png`;
    const localDest = path.join(IMAGES_DEST_DIR, filename);

    let imageUrl: string | null = null;

    // Check if it exists in backup generated-images
    const srcBackup = path.join(IMAGES_SRC_DIR, filename);
    if (fs.existsSync(srcBackup)) {
      if (!fs.existsSync(localDest)) {
        fs.copyFileSync(srcBackup, localDest);
        console.log(`  Copied existing backup image for ${r.title}`);
      }
      imageUrl = `/generated-images/${filename}`;
    } else if (fs.existsSync(localDest)) {
      imageUrl = `/generated-images/${filename}`;
    } else {
      // Generate new dish description
      const dishDesc = await generateDishDescription(r, persona);
      
      // Construct prompt
      const prompt = `${GLOBAL_STYLE}\n\n${pConfig.style}\n\n${pConfig.lighting}\n\n${dishDesc}\n\n${UNIVERSAL_NEGATIVE}\n\nProfessional commercial food photography.`;
      
      // Generate
      imageUrl = await generateImage(prompt, filename);
    }

    // Database seeding bypassed as requested
  }

  // 4. Process the 2 Discovery cards
  for (let i = 0; i < 2; i++) {
    const filename = `${persona.slug}_discovery_${i + 1}.png`;
    const localDest = path.join(IMAGES_DEST_DIR, filename);

    let imageUrl: string | null = null;

    if (fs.existsSync(localDest)) {
      imageUrl = `/generated-images/${filename}`;
    } else {
      // Generate a signature dish description for the persona
      console.log(`  Generating signature dish description for discovery card ${i + 1}...`);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are a gourmet food writer. Describe a single mouth-watering signature dish or beverage matching the given specialty. Make it 1 sentence, highly descriptive of the food, visual appearance, and texture. Do not mention people, hands, or utensils."
                },
                {
                  role: "user",
                  content: `Specialty: "${persona.cuisines.join(', ')}", Role: "${persona.displayName}"`
                }
              ],
              temperature: 0.8
            })
          });

      const chatData = await res.json();
      const dishDesc = chatData.choices[0].message.content.trim();

      const prompt = `${GLOBAL_STYLE}\n\n${pConfig.style}\n\n${pConfig.lighting}\n\n${dishDesc}\n\n${UNIVERSAL_NEGATIVE}\n\nProfessional commercial food photography.`;
      imageUrl = await generateImage(prompt, filename);
    }

    // Database seeding bypassed as requested
  }
}

async function run() {
  console.log("Starting batch image generation for Masterbots...");
  for (const persona of MASTERBOT_PERSONAS) {
    await processPersona(persona);
  }
  console.log("\nBatch image generation complete!");
}

run();
