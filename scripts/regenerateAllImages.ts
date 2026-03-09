/**
 * Regenerate All Restaurant Images with Minimal Illustration Style
 * 
 * - Backs up old images
 * - Generates 121 new images using approved prompts
 * - Updates JSON files with new image paths
 * - Creates metadata file linking images to geolocations
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../public/generated-images');
const BACKUP_DIR = path.join(__dirname, '../public/generated-images-backup');
const PROMPTS_FILE = path.join(__dirname, '../prompts-review.json');
const METADATA_FILE = path.join(__dirname, '../public/generated-images/image-metadata.json');

interface PromptEntry {
    index: number;
    placeId: string;
    title: string;
    city: string;
    category: string;
    description: string | null;
    base_prompt: string;
    variety_modifier: string;
    full_prompt: string;
    negative_prompt: string;
}

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
 * Backup existing images
 */
function backupImages() {
    console.log('\n📦 Backing up existing images...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        console.log('⚠️  No existing images to backup');
        return;
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));

    for (const file of files) {
        const src = path.join(OUTPUT_DIR, file);
        const dest = path.join(BACKUP_DIR, file);
        fs.copyFileSync(src, dest);
    }

    console.log(`✅ Backed up ${files.length} images to ${BACKUP_DIR}`);
}

/**
 * Generate image using DALL-E 3 with negative prompt
 */
async function generateImage(prompt: string, negativePrompt: string): Promise<string | null> {
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
                // Note: DALL-E 3 doesn't support negative_prompt parameter directly
                // The negative elements are included in the main prompt
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
async function downloadImage(url: string, placeId: string): Promise<string> {
    const filename = `${placeId}_v2.png`; // v2 to distinguish from old
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
    console.log('🚀 Starting Image Regeneration with Minimal Illustration Style');
    console.log(`📁 Prompts file: ${PROMPTS_FILE}`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log('');

    if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found');
        process.exit(1);
    }

    // Backup existing images
    backupImages();

    // Load prompts
    const promptsData = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf-8'));

    const imageMetadata: ImageMetadata[] = [];
    let totalGenerated = 0;
    const startTime = Date.now();

    // Process each file
    for (const [filename, prompts] of Object.entries(promptsData)) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`FILE: ${filename}`);
        console.log('='.repeat(60));

        const filepath = path.join(DATA_DIR, filename);
        const locations: Restaurant[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        const promptsArray = prompts as PromptEntry[];

        for (let i = 0; i < promptsArray.length; i++) {
            const promptEntry = promptsArray[i];
            const restaurant = locations[promptEntry.index];

            console.log(`\n[${promptEntry.index + 1}] ${promptEntry.title}`);
            console.log(`   Modifier: ${promptEntry.variety_modifier}`);

            // Generate image
            const imageUrl = await generateImage(promptEntry.full_prompt, promptEntry.negative_prompt);
            if (!imageUrl) {
                console.log(`⚠️  Failed, skipping...`);
                continue;
            }

            console.log(`✅ Generated`);

            // Download image
            const localPath = await downloadImage(imageUrl, promptEntry.placeId);
            console.log(`💾 Saved: ${localPath}`);

            // Update restaurant
            restaurant.imageUrl = localPath;
            totalGenerated++;

            // Store metadata
            imageMetadata.push({
                placeId: promptEntry.placeId,
                title: promptEntry.title,
                city: promptEntry.city,
                imagePath: localPath,
                location: restaurant.location,
                prompt: promptEntry.full_prompt,
                generatedAt: new Date().toISOString(),
            });

            // Rate limiting - wait between requests, but not after the last one
            if (i < promptsArray.length - 1) {
                console.log(`⏳ Waiting 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Save updated JSON
        fs.writeFileSync(filepath, JSON.stringify(locations, null, 2));
        console.log(`\n✅ Updated ${filename}`);
    }

    // Save metadata file
    fs.writeFileSync(METADATA_FILE, JSON.stringify(imageMetadata, null, 2));
    console.log(`\n📄 Saved metadata to ${METADATA_FILE}`);

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const cost = (totalGenerated * 0.04).toFixed(2);

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Regeneration complete!');
    console.log(`📊 Total images: ${totalGenerated}`);
    console.log(`💰 Cost: $${cost}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`📦 Backup: ${BACKUP_DIR}`);
    console.log(`📄 Metadata: ${METADATA_FILE}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
