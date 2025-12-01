/**
 * Batch Generate Remaining Restaurant Images
 * 
 * Generates images for restaurants that don't have images yet.
 * Uses the new naming convention: {city}_{index}_{sanitized-title}_v2.png
 * 
 * Process:
 * 1. Loads all MasterSet JSON files
 * 2. Checks which restaurants already have images (from image-metadata.json)
 * 3. Generates images for missing restaurants
 * 4. Updates image-metadata.json
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateImageFilename, generateImagePath, extractCityFromFilename } from './utils/imageNaming.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../public/generated-images');
const METADATA_FILE = path.join(__dirname, '../public/generated-images/image-metadata.json');

interface Restaurant {
    placeId: string;
    title: string;
    description?: string;
    categoryName: string;
    city?: string;
    location: {
        lat: number;
        lng: number;
    };
}

interface ImageMetadata {
    placeId: string;
    title: string;
    city: string;
    imagePath: string;
    location: {
        lat: number;
        lng: number;
    };
    prompt: string;
    generatedAt: string;
}

/**
 * Load existing image metadata
 */
function loadExistingMetadata(): Set<string> {
    if (!fs.existsSync(METADATA_FILE)) {
        return new Set();
    }

    const metadata: ImageMetadata[] = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    return new Set(metadata.map(m => m.placeId));
}

/**
 * Generate prompt for restaurant
 */
function generatePrompt(restaurant: Restaurant): string {
    let basePrompt = '';

    if (restaurant.description && restaurant.description.trim()) {
        basePrompt = restaurant.description;
    } else if (restaurant.categoryName) {
        basePrompt = `A ${restaurant.categoryName} serving delicious food`;
    } else {
        basePrompt = `${restaurant.title}, a restaurant`;
    }

    // Consistent style directive for minimal illustration
    const styleDirective = 'minimal illustration, flat design, simple shapes, vibrant colors, clean lines';
    
    // Add variety based on category
    let varietyModifier = 'modern, contemporary';
    if (restaurant.categoryName?.toLowerCase().includes('thai')) {
        varietyModifier = 'tropical, vibrant';
    } else if (restaurant.categoryName?.toLowerCase().includes('sushi') || 
               restaurant.categoryName?.toLowerCase().includes('japanese')) {
        varietyModifier = 'zen aesthetic, minimalist, clean composition';
    } else if (restaurant.categoryName?.toLowerCase().includes('hawker') ||
               restaurant.categoryName?.toLowerCase().includes('street')) {
        varietyModifier = 'playful, dynamic, energetic';
    } else if (restaurant.categoryName?.toLowerCase().includes('french') ||
               restaurant.categoryName?.toLowerCase().includes('fine')) {
        varietyModifier = 'elegant, sophisticated, refined';
    }

    return `${basePrompt}, ${styleDirective}, ${varietyModifier}`;
}

/**
 * Generate image using DALL-E 3
 */
async function generateImage(prompt: string): Promise<string | null> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found');
    }

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
            console.error('❌ API error:', error);
            return null;
        }

        const data = await response.json();
        return data.data[0]?.url || null;
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

/**
 * Download and save image
 */
async function downloadImage(url: string, filename: string): Promise<string> {
    const filepath = path.join(OUTPUT_DIR, filename);

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(filepath, Buffer.from(buffer));
    return `/generated-images/${filename}`;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Batch Generate Remaining Restaurant Images');
    console.log('='.repeat(60));
    console.log('');

    if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found');
        process.exit(1);
    }

    // Load existing metadata to know what's already generated
    const existingPlaceIds = loadExistingMetadata();
    console.log(`📋 Found ${existingPlaceIds.size} existing images\n`);

    // Get all MasterSet JSON files
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('MasterSet_') && f.endsWith('.json'))
        .filter(f => f !== 'MasterSet_01.json' && f !== 'MasterSet_other.json')
        .sort();

    console.log(`📁 Processing ${files.length} MasterSet files:\n`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');

    // Load existing metadata array
    let imageMetadata: ImageMetadata[] = [];
    if (fs.existsSync(METADATA_FILE)) {
        imageMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    }

    let totalGenerated = 0;
    let totalSkipped = 0;
    const startTime = Date.now();

    // Process each file
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const filename = files[fileIndex];
        const city = extractCityFromFilename(filename);
        const filepath = path.join(DATA_DIR, filename);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`FILE ${fileIndex + 1}/${files.length}: ${filename}`);
        console.log(`CITY: ${city}`);
        console.log('='.repeat(60));

        const restaurants: Restaurant[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        console.log(`📊 Found ${restaurants.length} restaurants in file\n`);

        // Process each restaurant
        for (let i = 0; i < restaurants.length; i++) {
            const restaurant = restaurants[i];

            // Skip if already has image
            if (existingPlaceIds.has(restaurant.placeId)) {
                console.log(`[${i + 1}/${restaurants.length}] ⏭️  ${restaurant.title} (already has image)`);
                totalSkipped++;
                continue;
            }

            console.log(`\n[${i + 1}/${restaurants.length}] 🎨 ${restaurant.title}`);
            console.log(`   Category: ${restaurant.categoryName || 'N/A'}`);

            // Generate prompt
            const prompt = generatePrompt(restaurant);
            console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

            // Generate image
            const imageUrl = await generateImage(prompt);
            if (!imageUrl) {
                console.log(`   ⚠️  Failed to generate image, skipping...`);
                continue;
            }

            console.log(`   ✅ Image generated`);

            // Generate filename
            const filename_new = generateImageFilename(city, i, restaurant.title);
            const imagePath = generateImagePath(city, i, restaurant.title);

            // Download and save
            await downloadImage(imageUrl, filename_new);
            console.log(`   💾 Saved: ${filename_new}`);

            // Add to metadata
            imageMetadata.push({
                placeId: restaurant.placeId,
                title: restaurant.title,
                city: city,
                imagePath: imagePath,
                location: restaurant.location,
                prompt: prompt,
                generatedAt: new Date().toISOString(),
            });

            totalGenerated++;

            // Rate limiting - wait 2 seconds between requests (except for last item)
            if (i < restaurants.length - 1 || fileIndex < files.length - 1) {
                console.log(`   ⏳ Waiting 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Save updated metadata
    fs.writeFileSync(METADATA_FILE, JSON.stringify(imageMetadata, null, 2));
    console.log(`\n📄 Updated ${METADATA_FILE}`);

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const cost = (totalGenerated * 0.04).toFixed(2);

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Batch generation complete!');
    console.log(`📊 New images generated: ${totalGenerated}`);
    console.log(`⏭️  Skipped (already exist): ${totalSkipped}`);
    console.log(`💰 Estimated cost: $${cost}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`📄 Metadata updated: ${METADATA_FILE}`);
    console.log('='.repeat(60));
}

main().catch(console.error);

