/**
 * Find and regenerate images for restaurants with undefined descriptions
 * 
 * This script identifies restaurants from indices 0-4 that had undefined descriptions
 * and regenerates their images with proper fallback prompts.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../public/generated-images');
const START_INDEX = 0;
const END_INDEX = 5;
const EXCLUDE_FILES = ['MasterSet_01.json'];

interface Restaurant {
    placeId: string;
    title: string;
    description?: string;
    categoryName: string;
    city: string;
    imageUrl?: string;
    location: {
        lat: number;
        lng: number;
    };
}

/**
 * Check if restaurant needs regeneration (had undefined description)
 */
function needsRegeneration(restaurant: Restaurant): boolean {
    // If description is missing or empty, it would have generated "undefined" prompt
    return !restaurant.description || restaurant.description.trim() === '';
}

/**
 * Generate image using OpenAI DALL-E 3
 */
async function generateImage(restaurant: Restaurant): Promise<string | null> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment');
    }

    // Build prompt with fallback logic
    let basePrompt = '';

    if (restaurant.description && restaurant.description.trim()) {
        basePrompt = restaurant.description;
    } else if (restaurant.categoryName) {
        basePrompt = `A ${restaurant.categoryName} serving delicious food`;
    } else {
        basePrompt = `${restaurant.title}, a restaurant`;
    }

    const styleDirective = 'food photography style, vibrant colors, appetizing presentation, professional lighting, shallow depth of field';
    const prompt = `${basePrompt}, ${styleDirective}`;

    console.log(`🎨 Regenerating image for: ${restaurant.title}`);
    console.log(`   Base: ${basePrompt.substring(0, 60)}...`);

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                response_format: 'url',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ OpenAI API error:', error);
            return null;
        }

        const data = await response.json();
        const imageUrl = data.data[0]?.url;

        if (!imageUrl) {
            console.error('❌ No image URL in response');
            return null;
        }

        console.log(`✅ Image generated`);
        return imageUrl;
    } catch (error) {
        console.error('❌ Error generating image:', error);
        return null;
    }
}

/**
 * Download image from URL and save locally
 */
async function downloadImage(url: string, placeId: string): Promise<string> {
    const filename = `${placeId}_dalle3.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`💾 Saved: ${filename}`);

    return `/generated-images/${filename}`;
}

/**
 * Process a single JSON file
 */
async function processFile(filename: string): Promise<{ total: number, regenerated: number }> {
    const filepath = path.join(DATA_DIR, filename);

    console.log(`\n📂 Processing: ${filename}`);

    const content = fs.readFileSync(filepath, 'utf-8');
    const locations: Restaurant[] = JSON.parse(content);

    if (!Array.isArray(locations) || locations.length === 0) {
        console.log('⚠️  No locations found in file');
        return { total: 0, regenerated: 0 };
    }

    // Check restaurants 1-5 (indices 0-4)
    const restaurantsToCheck = locations.slice(START_INDEX, END_INDEX);
    const needsRegen = restaurantsToCheck.filter(needsRegeneration);

    console.log(`Found ${needsRegen.length} restaurants needing regeneration (out of ${restaurantsToCheck.length})`);

    let regenerated = 0;

    for (let i = 0; i < needsRegen.length; i++) {
        const restaurant = needsRegen[i];
        const actualIndex = locations.indexOf(restaurant) + 1;

        console.log(`\n[#${actualIndex}] ${restaurant.title} - REGENERATING`);

        const imageUrl = await generateImage(restaurant);
        if (!imageUrl) {
            console.log(`⚠️  Failed to generate image, skipping...`);
            continue;
        }

        const localPath = await downloadImage(imageUrl, restaurant.placeId);
        restaurant.imageUrl = localPath;
        regenerated++;

        // Rate limiting
        if (i < needsRegen.length - 1) {
            console.log(`⏳ Waiting 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Save updated JSON
    if (regenerated > 0) {
        fs.writeFileSync(filepath, JSON.stringify(locations, null, 2));
        console.log(`\n✅ Updated ${filename} with ${regenerated} regenerated images`);
    }

    return { total: needsRegen.length, regenerated };
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting Image Regeneration for Undefined Descriptions');
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`🔍 Checking restaurants #${START_INDEX + 1}-${END_INDEX} from each file`);
    console.log('');

    if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found in environment');
        process.exit(1);
    }

    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('MasterSet_') && f.endsWith('.json'))
        .filter(f => !EXCLUDE_FILES.includes(f))
        .sort();

    console.log(`📋 Found ${files.length} files to check:`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');

    const startTime = Date.now();
    let totalNeedingRegen = 0;
    let totalRegenerated = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`FILE ${i + 1}/${files.length}: ${file}`);
        console.log('='.repeat(60));

        try {
            const result = await processFile(file);
            totalNeedingRegen += result.total;
            totalRegenerated += result.regenerated;
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const cost = (totalRegenerated * 0.04).toFixed(2);

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Regeneration complete!');
    console.log(`📊 Total needing regeneration: ${totalNeedingRegen}`);
    console.log(`📊 Total regenerated: ${totalRegenerated}`);
    console.log(`💰 Estimated cost: $${cost}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log('='.repeat(60));
}

main().catch(console.error);
