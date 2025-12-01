/**
 * Rename Existing Images to New Naming Convention
 * 
 * Converts existing images from: {placeId}_v2.png
 * To new format: {city}_{index}_{sanitized-title}_v2.png
 * 
 * This script:
 * 1. Reads image-metadata.json to get current mappings
 * 2. Finds the corresponding restaurant in MasterSet JSON files
 * 3. Renames images to new format
 * 4. Updates image-metadata.json with new paths
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateImageFilename, generateImagePath, extractCityFromFilename } from './utils/imageNaming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../public/generated-images');
const METADATA_FILE = path.join(__dirname, '../public/generated-images/image-metadata.json');

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

interface Restaurant {
    placeId: string;
    title: string;
    categoryName?: string;
    city?: string;
    location: {
        lat: number;
        lng: number;
    };
}

/**
 * Find restaurant in MasterSet JSON files and get its index
 */
function findRestaurantInMasterSet(placeId: string): { city: string; index: number; restaurant: Restaurant } | null {
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('MasterSet_') && f.endsWith('.json'))
        .filter(f => f !== 'MasterSet_01.json' && f !== 'MasterSet_other.json');

    for (const filename of files) {
        const filepath = path.join(DATA_DIR, filename);
        const restaurants: Restaurant[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

        const index = restaurants.findIndex(r => r.placeId === placeId);
        if (index !== -1) {
            const city = extractCityFromFilename(filename);
            return {
                city,
                index,
                restaurant: restaurants[index]
            };
        }
    }

    return null;
}

/**
 * Main execution
 */
async function main() {
    console.log('🔄 Renaming Existing Images to New Naming Convention');
    console.log('='.repeat(60));
    console.log('');

    // Load current metadata
    if (!fs.existsSync(METADATA_FILE)) {
        console.error('❌ image-metadata.json not found');
        process.exit(1);
    }

    const metadata: ImageMetadata[] = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    console.log(`📋 Found ${metadata.length} images in metadata\n`);

    const renamed: Array<{ old: string; new: string }> = [];
    const updatedMetadata: ImageMetadata[] = [];
    let notFound = 0;

    for (let i = 0; i < metadata.length; i++) {
        const entry = metadata[i];
        console.log(`[${i + 1}/${metadata.length}] Processing: ${entry.title}`);

        // Find restaurant in MasterSet files
        const found = findRestaurantInMasterSet(entry.placeId);
        if (!found) {
            console.log(`   ⚠️  Restaurant not found in MasterSet files, skipping...`);
            notFound++;
            // Keep original metadata entry
            updatedMetadata.push(entry);
            continue;
        }

        // Generate new filename
        const newFilename = generateImageFilename(found.city, found.index, entry.title);
        const newPath = generateImagePath(found.city, found.index, entry.title);

        // Extract old filename from path
        const oldFilename = path.basename(entry.imagePath);
        const oldFilePath = path.join(OUTPUT_DIR, oldFilename);
        const newFilePath = path.join(OUTPUT_DIR, newFilename);

        // Check if old file exists
        if (!fs.existsSync(oldFilePath)) {
            console.log(`   ⚠️  Old file not found: ${oldFilename}, skipping...`);
            // Keep original metadata entry
            updatedMetadata.push(entry);
            continue;
        }

        // Rename file
        try {
            fs.renameSync(oldFilePath, newFilePath);
            console.log(`   ✅ Renamed: ${oldFilename} → ${newFilename}`);
            renamed.push({ old: oldFilename, new: newFilename });

            // Update metadata entry
            updatedMetadata.push({
                ...entry,
                imagePath: newPath,
                city: found.city // Update city from MasterSet
            });
        } catch (error) {
            console.error(`   ❌ Error renaming: ${error}`);
            // Keep original metadata entry
            updatedMetadata.push(entry);
        }
    }

    // Save updated metadata
    fs.writeFileSync(METADATA_FILE, JSON.stringify(updatedMetadata, null, 2));
    console.log(`\n📄 Updated ${METADATA_FILE}`);

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Renaming complete!');
    console.log(`✅ Successfully renamed: ${renamed.length} images`);
    if (notFound > 0) {
        console.log(`⚠️  Not found in MasterSet: ${notFound} images`);
    }
    console.log(`📄 Updated metadata file`);
    console.log('='.repeat(60));
}

main().catch(console.error);

