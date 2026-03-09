/**
 * Split MasterSet_01.json into city-based files
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const inputFile = path.join(dataDir, 'MasterSet_01.json');

// City mapping - group related areas into metro cities
const cityMapping = {
  // Barcelona
  'Barcelona': 'barcelona',
  
  // Hong Kong
  'Tsim Sha Tsui': 'hongkong',
  'Central': 'hongkong',
  'Yau Ma Tei': 'hongkong',
  'Sai Ying Pun': 'hongkong',
  'Wan Chai': 'hongkong',
  'Causeway Bay': 'hongkong',
  'Sheung Wan': 'hongkong',
  'Tai Mei Tuk Tsuen': 'hongkong',
  'Mei Foo Sun Chuen': 'hongkong',
  'Sham Shui Po': 'hongkong',
  'Mong Kok': 'hongkong',
  'Tin Hau': 'hongkong',
  'Ma On Shan': 'hongkong',
  
  // Mumbai
  'Mumbai': 'mumbai',
  'Pali, Mumbai': 'mumbai',
  'Navi Mumbai': 'mumbai',
  
  // Singapore
  'Singapore': 'singapore',
  
  // Bangkok
  'Bang Rak': 'bangkok',
  'Ratchathewi': 'bangkok',
  'Watthana': 'bangkok',
  'Samphanthawong': 'bangkok',
  'Khlong Toei': 'bangkok',
  'Pathum Wan': 'bangkok',
  'Sathon': 'bangkok',
  'Thon Buri': 'bangkok',
  'Yan Nawa': 'bangkok',
  'Phaya Thai': 'bangkok',
  'Phra Nakhon': 'bangkok',
  'Lak Si': 'bangkok',
  
  // Mexico City
  'CuauhtAcmoc, Mexico City': 'mexicocity',
  'Miguel Hidalgo, Mexico City': 'mexicocity',
  'Venustiano Carranza, Mexico City': 'mexicocity',
  'Benito Juarez, Mexico City': 'mexicocity',
  'CuauhtAcmoc': 'mexicocity',
  'CuauhtAcmoc, Del. Cuauhtemoc': 'mexicocity',
  
  // London
  'London': 'london',
  
  // Tokyo
  'Toshima City': 'tokyo',
  'Shinjuku City': 'tokyo',
  'Chiyoda City': 'tokyo',
  'Shibuya': 'tokyo',
  'Chuo City': 'tokyo',
  'Minato City': 'tokyo',
  'Meguro City': 'tokyo',
  'Taito City': 'tokyo',
  
  // Paris
  'Paris': 'paris',
  
  // New York
  'New York': 'newyork',
  'Brooklyn': 'newyork',
  'Astoria': 'newyork',
};

// Read and parse the JSON
console.log('Reading MasterSet_01.json...');
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
console.log(`Total locations: ${data.length}`);

// Group by metro city
const cityGroups = {};

data.forEach(location => {
  const metroCity = cityMapping[location.city] || 'other';
  if (!cityGroups[metroCity]) {
    cityGroups[metroCity] = [];
  }
  cityGroups[metroCity].push(location);
});

// Write each city to its own file
Object.entries(cityGroups).forEach(([city, locations]) => {
  const filename = `MasterSet_${city}.json`;
  const filepath = path.join(dataDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(locations, null, 2));
  console.log(`Created ${filename}: ${locations.length} locations`);
});

console.log('\nDone! City files created in data/ folder.');

