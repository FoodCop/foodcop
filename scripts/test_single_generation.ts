import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
  process.exit(1);
}

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

// Jun Tanaka - Zen Minimalist Style
const JUN_STYLE = `Japanese zen minimalism. Wabi-sabi aesthetics. Michelin-star omakase. Artisan ceramic tableware. Generous negative space. Refined restraint. Sophisticated hospitality photography. Subtle moody lighting. Luxury restaurant atmosphere. Understated elegance.`;
const JUN_LIGHTING = `soft moody indoor lighting, luxury Japanese restaurant ambiance, warm subtle highlights, minimalist composition`;

// A specific premium dish description
const DISH_DESC = `An exquisite, single piece of bluefin tuna otoro nigiri resting on a hand-pressed bed of seasoned sushi rice, glazed with a light brush of house-aged soy sauce, served on a dark, rustic, textured wabi-sabi ceramic plate.`;

async function run() {
  console.log("Generating single test image using gpt-image-2...");
  const prompt = `${GLOBAL_STYLE}\n\n${JUN_STYLE}\n\n${JUN_LIGHTING}\n\n${DISH_DESC}\n\n${UNIVERSAL_NEGATIVE}\n\nProfessional commercial food photography.`;
  
  const destDir = path.resolve(__dirname, '../public/generated-images');
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, 'test_gpt_image_2.png');

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
      console.error(`Error:`, JSON.stringify(data));
      process.exit(1);
    }

    const base64Data = data.data[0].b64_json;
    fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
    console.log(`Success! Image saved to: ${destPath}`);
  } catch (err) {
    console.error("Failed to generate image:", err);
    process.exit(1);
  }
}

run();
