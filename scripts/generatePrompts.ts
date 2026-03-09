/**
 * Generate Prompts for All Restaurant Images
 * 
 * Creates prompts-review.json with all 108 restaurant prompts for user review.
 * NO API calls - just prompt generation.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(__dirname, '../prompts-review.json');
const RESTAURANTS_PER_FILE = 11; // First 11 from each file
const EXCLUDE_FILES = ['MasterSet_01.json'];

interface Restaurant {
    placeId: string;
    title: string;
    description?: string;
    categoryName: string;
    city: string;
    categories?: string[];
}

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

/**
 * Get variety modifier based on category
 */
function getVarietyModifier(categoryName: string, categories: string[] = []): string {
    const allCategories = [categoryName, ...categories].join(' ').toLowerCase();

    if (allCategories.includes('japanese') || allCategories.includes('sushi')) {
        return 'zen aesthetic, minimalist, clean composition';
    }
    if (allCategories.includes('street food') || allCategories.includes('food court') || allCategories.includes('hawker')) {
        return 'playful, dynamic, energetic';
    }
    if (allCategories.includes('fine dining') || allCategories.includes('french') || allCategories.includes('michelin')) {
        return 'elegant, sophisticated, refined';
    }
    if (allCategories.includes('vegan') || allCategories.includes('health') || allCategories.includes('vegetarian')) {
        return 'fresh, organic feel, natural';
    }
    if (allCategories.includes('mexican') || allCategories.includes('taco')) {
        return 'bold, colorful, festive';
    }
    if (allCategories.includes('indian')) {
        return 'warm colors, spices theme';
    }
    if (allCategories.includes('thai')) {
        return 'tropical, vibrant';
    }
    if (allCategories.includes('chinese') || allCategories.includes('dim sum')) {
        return 'traditional, artistic';
    }
    if (allCategories.includes('italian')) {
        return 'rustic, warm, inviting';
    }

    return 'modern, contemporary';
}

/**
 * Generate base prompt from restaurant data
 */
function generateBasePrompt(restaurant: Restaurant): string {
    if (restaurant.description && restaurant.description.trim()) {
        return restaurant.description.trim();
    }
    if (restaurant.categoryName) {
        return `A ${restaurant.categoryName} serving delicious food`;
    }
    return `${restaurant.title}, a restaurant`;
}

/**
 * Generate full prompt for a restaurant
 */
function generatePrompt(restaurant: Restaurant, index: number): PromptEntry {
    const basePrompt = generateBasePrompt(restaurant);
    const varietyModifier = getVarietyModifier(restaurant.categoryName, restaurant.categories);

    const styleDirective = 'minimal illustration, flat design, simple shapes, vibrant colors, clean lines';
    const fullPrompt = `${basePrompt}, ${styleDirective}, ${varietyModifier}`;

    const negativePrompt = 'text, watermark, letters, words, writing, labels, realistic, photographic, photo, 3d render, detailed textures';

    return {
        index,
        placeId: restaurant.placeId,
        title: restaurant.title,
        city: restaurant.city,
        category: restaurant.categoryName,
        description: restaurant.description || null,
        base_prompt: basePrompt,
        variety_modifier: varietyModifier,
        full_prompt: fullPrompt,
        negative_prompt: negativePrompt,
    };
}

/**
 * Process a single JSON file
 */
function processFile(filename: string): PromptEntry[] {
    const filepath = path.join(DATA_DIR, filename);

    console.log(`\n📂 Processing: ${filename}`);

    const content = fs.readFileSync(filepath, 'utf-8');
    const locations: Restaurant[] = JSON.parse(content);

    if (!Array.isArray(locations) || locations.length === 0) {
        console.log('⚠️  No locations found');
        return [];
    }

    const restaurantsToProcess = locations.slice(0, RESTAURANTS_PER_FILE);
    const prompts: PromptEntry[] = [];

    for (let i = 0; i < restaurantsToProcess.length; i++) {
        const restaurant = restaurantsToProcess[i];
        const prompt = generatePrompt(restaurant, i);
        prompts.push(prompt);

        console.log(`  [${i + 1}] ${restaurant.title}`);
        console.log(`      Modifier: ${prompt.variety_modifier}`);
    }

    console.log(`✅ Generated ${prompts.length} prompts`);
    return prompts;
}

/**
 * Main execution
 */
function main() {
    console.log('🚀 Generating Prompts for Review');
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📄 Output file: ${OUTPUT_FILE}`);
    console.log(`📊 Target: ${RESTAURANTS_PER_FILE} restaurants per file`);
    console.log('');

    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('MasterSet_') && f.endsWith('.json'))
        .filter(f => !EXCLUDE_FILES.includes(f))
        .sort();

    console.log(`📋 Found ${files.length} files to process:`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');

    const allPrompts: Record<string, PromptEntry[]> = {};
    let totalPrompts = 0;

    for (const file of files) {
        const prompts = processFile(file);
        allPrompts[file] = prompts;
        totalPrompts += prompts.length;
    }

    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPrompts, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ Prompt generation complete!');
    console.log(`📊 Total prompts generated: ${totalPrompts}`);
    console.log(`📄 Saved to: ${OUTPUT_FILE}`);
    console.log(`💰 Cost: $0.00 (no API calls)`);
    console.log('='.repeat(60));
    console.log('\n📝 Next steps:');
    console.log('   1. Review prompts-review.json');
    console.log('   2. Tweak prompts if needed');
    console.log('   3. Run regeneration script');
}

main();
