# Image Generation & Naming Convention Plan

## Current State
- **Total Restaurants**: 490 restaurants total across all JSON files
- **Script Processes**: 456 restaurants (excludes MasterSet_other.json and MasterSet_01.json)
- **Images Generated**: 206 images (110 renamed + 85 new generated, 11 old format kept)
- **Remaining to Generate**: ~250 images (456 total - 206 current)
- **Naming Convention**: ✅ Implemented - All new images use `{city}_{index}_{sanitized-title}_v2.png`

## New Naming Convention

### Format
```
{city}_{index}_{sanitized-title}_v2.png
```

### Examples
- Old: `ChIJLWlCk9GY4jARpNGpRcq5ABY_v2.png`
- New: `bangkok_01_cheaper-better-street-food_v2.png`

### Benefits
1. **Human-readable**: Easy to identify images by city and restaurant name
2. **Organized**: Images grouped by city with sequential numbering
3. **Maintainable**: Clear structure for future updates
4. **SEO-friendly**: Descriptive filenames

## Implementation Steps

### Step 1: Rename Existing Images ✅ COMPLETED
**Script**: `scripts/renameExistingImages.ts`

**Status**: ✅ Completed
- 110 images successfully renamed to new convention
- 11 images kept in old format (not found in MasterSet files)
- `image-metadata.json` updated with new paths

**Run**:
```bash
npx tsx scripts/renameExistingImages.ts
```

### Step 2: Generate Remaining Images ⏸️ IN PROGRESS
**Script**: `scripts/batchGenerateRemainingImages.ts`

**Status**: ⏸️ Paused (Billing limit reached)
- 85 new images generated before hitting OpenAI billing limit
- All new images use new naming convention automatically
- `image-metadata.json` updated with new entries
- Estimated cost so far: ~$3.40

**To Continue**:
```bash
npx tsx scripts/batchGenerateRemainingImages.ts
```
The script will automatically skip existing images and continue where it left off.

**Remaining**:
- ~250 images still need to be generated
- Estimated remaining cost: ~$10.00 (250 images × $0.04)
- Estimated remaining time: ~8.3 minutes (250 images × 2 seconds per image)

## File Structure

```
scripts/
├── utils/
│   └── imageNaming.ts          # Naming utility functions
├── renameExistingImages.ts     # Step 1: Rename existing images
├── batchGenerateRemainingImages.ts  # Step 2: Generate remaining images
└── IMAGE_GENERATION_PLAN.md    # This file
```

## Naming Utility Functions

Located in `scripts/utils/imageNaming.ts`:

- `sanitizeFilename(str)`: Cleans strings for filenames
- `extractCityFromFilename(filename)`: Gets city from MasterSet filename
- `generateImageFilename(city, index, title)`: Creates new filename
- `generateImagePath(city, index, title)`: Creates full image path

## Feed Service Compatibility

The `feedService.ts` already handles image paths from `image-metadata.json`:
- It looks up images by `placeId` (not filename)
- As long as `image-metadata.json` has correct paths, it will work
- No changes needed to feed service code

## Recent Updates

### Feed Card UI Improvements ✅
- Changed card front from gradient to white background
- Updated logo from `logo_desktop.png` to `logo_mobile.png`
- Replaced "Click to Reveal" text with Font Awesome eye icon
- Cards now have cleaner, more modern appearance

## Verification

Current Status:
1. `public/generated-images/` folder:
   - 206 images total (195 with new naming + 11 old format)
   - New images follow naming: `{city}_{index}_{title}_v2.png`

2. `image-metadata.json`:
   - 206 entries
   - All new entries use new naming convention

3. Feed:
   - Feed displays images correctly
   - No broken image links
   - Location detection working properly

## Notes

- **Rate Limiting**: Scripts wait 2 seconds between API calls to respect OpenAI limits
- **Error Handling**: Scripts skip failed generations and continue
- **Backup**: Consider backing up `image-metadata.json` before running
- **Cost**: Monitor OpenAI API usage during batch generation

