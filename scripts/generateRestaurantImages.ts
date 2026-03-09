/**
 * Generate Restaurant Images using OpenAI DALL-E 3
 * 
 * Batch generation: 6 images from each of 11 city files (restaurants 6-11) = 66 total images
 * Uses DALL-E 3 with 1024x1024 size and food photography style.
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
const START_INDEX = 5; // Start from restaurant #6 (index 5)
const END_INDEX = 11;   // End at restaurant #11 (index 10)
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
 * Generate image using OpenAI DALL-E 3
 */
async function generateImage(restaurant: Restaurant): Promise<string | null> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment');
    }

    // Build prompt with fallback logic
    let basePrompt = '';

    if (restaurant.description && restaurant.description.trim()) {
        // Use description if available
        basePrompt = restaurant.description;
    } else if (restaurant.categoryName) {
        // Fallback to category name
        basePrompt = `A ${restaurant.categoryName} serving delicious food`;
    } else {
        // Last resort: use title
        basePrompt = `${restaurant.title}, a restaurant`;
    }

    // Consistent style directive for food photography
    const styleDirective = 'food photography style, vibrant colors, appetizing presentation, professional lighting, shallow depth of field';
    const prompt = `${basePrompt}, ${styleDirective}`;

    console.log(`🎨 Generating image for: ${restaurant.title}`);
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

    // Ensure output directory exists
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
async function processFile(filename: string): Promise<number> {
    const filepath = path.join(DATA_DIR, filename);

    console.log(`\n📂 Processing: ${filename}`);

    // Read JSON file
    const content = fs.readFileSync(filepath, 'utf-8');
    const locations: Restaurant[] = JSON.parse(content);

    if (!Array.isArray(locations) || locations.length === 0) {
        console.log('⚠️  No locations found in file');
        return 0;
    }

    // Process restaurants 6-11 (indices 5-10)
    const restaurantsToProcess = locations.slice(START_INDEX, END_INDEX);
    let processed = 0;

    console.log(`Processing restaurants ${START_INDEX + 1}-${END_INDEX} from this file`);

    for (let i = 0; i < restaurantsToProcess.length; i++) {
        const restaurant = restaurantsToProcess[i];
        const actualIndex = START_INDEX + i + 1;

        console.log(`\n[#${actualIndex}] ${restaurant.title}`);

        // Generate image
        const imageUrl = await generateImage(restaurant);
        if (!imageUrl) {
            console.log(`⚠️  Failed to generate image, skipping...`);
            continue;
        }

        // Download and save image
        const localPath = await downloadImage(imageUrl, restaurant.placeId);

        // Update restaurant data
        restaurant.imageUrl = localPath;
        processed++;

        // Rate limiting - wait 2 seconds between requests
        if (i < restaurantsToProcess.length - 1) {
            console.log(`⏳ Waiting 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Save updated JSON
    if (processed > 0) {
        fs.writeFileSync(filepath, JSON.stringify(locations, null, 2));
        console.log(`\n✅ Updated ${filename} with ${processed} new images`);
    }

    return processed;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting Batch AI Image Generation');
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`🎨 Model: DALL-E 3 (1024x1024, standard quality)`);
    console.log(`🎨 Style: Food photography`);
    console.log(`📊 Target: Restaurants #${START_INDEX + 1}-${END_INDEX} from each file`);
    console.log('');

    if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found in environment');
        console.error('   Please set it in your .env file');
        process.exit(1);
    }

    // Get all MasterSet JSON files
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('MasterSet_') && f.endsWith('.json'))
        .filter(f => !EXCLUDE_FILES.includes(f))
        .sort();

    console.log(`📋 Found ${files.length} files to process:`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');

    const startTime = Date.now();
    let totalProcessed = 0;

    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`FILE ${i + 1}/${files.length}: ${file}`);
        console.log('='.repeat(60));

        try {
            const processed = await processFile(file);
            totalProcessed += processed;
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const cost = (totalProcessed * 0.04).toFixed(2);

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Batch generation complete!');
    console.log(`📊 Total images generated: ${totalProcessed}`);
    console.log(`💰 Estimated cost: $${cost}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log('='.repeat(60));
}

// Run the script
main().catch(console.error);
