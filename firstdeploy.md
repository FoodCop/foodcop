# First Deploy Preparation - FoodCop App

## Project Cleanup Summary

### ✅ Completed Actions

#### 1. Text Files Organization
- **Moved to docs/:**
  - `PlateCOmponents.txt` → `docs/PlateCOmponents.txt`
  - `buildwarnings.txt` → `docs/buildwarnings.txt`
  - `app/oldfooter.txt` → `docs/oldfooter.txt`
  - `app/folder structure.txt` → `docs/folder-structure.txt`
  - `public/tweakcn.txt` → `docs/tweakcn-styles.txt`

#### 2. File System Audit Completed
- Identified all test routes, demo pages, and debug directories
- Catalogued all images and their usage patterns
- Located backup files and unused components

### 🚨 Issues Found That Need Resolution

#### Missing Image Files
The following images are referenced in code but missing from the file system:
- `/images/fuzo-logo.png` (referenced in `components/ui/splash-screen.tsx`)
- `/images/fuzo-border.svg` (referenced in `components/ui/splash-screen.tsx`)
- `/images/placeholder-food.jpg` (referenced in multiple components)

#### Inconsistent Image Paths
- Some components reference `/images/landing/images/` (lowercase)
- Others reference `/images/landing/Images/` (uppercase)
- This could cause issues on case-sensitive systems

## Image and Icon Inventory

### 📸 Images Currently in Use

#### Landing Page Images (`/public/images/landing/Images/`)
| File | Referenced In | Status |
|------|---------------|--------|
| `hero_image.png` | Multiple landing components | ✅ Active |
| `logo.png` | NavBar, Footer | ✅ Active |
| `dashboard.png` | Landing sections | ✅ Active |
| `bites.png` | Landing sections | ✅ Active |
| `scout.jpg` | Landing sections | ✅ Active |
| `perfect-plate.png` | Landing sections | ✅ Active |
| `Snap.png` | Landing sections | ✅ Active |
| `food-radar.jpg` | Landing sections | ✅ Active |

#### Masterbot Avatars (`/public/masterbot-avatars/`)
| File | Status |
|------|--------|
| `anika_spice_scholar.png` | ✅ Used in scripts |
| `sebastian_sommelier.png` | ✅ Used in scripts |
| `omar_coffee_pilgrim.png` | ✅ Used in scripts |
| `jun_zen_minimalist.png` | ✅ Used in scripts |
| `aurelia_nomad.png` | ✅ Used in scripts |
| `rafael_adventure.png` | ✅ Used in scripts |
| `lila_plant_pioneer.png` | ✅ Used in scripts |

#### Potentially Unused Images
| File | Notes |
|------|-------|
| `camera_image.png` | Not found in current codebase search |
| `camera.png` | Not found in current codebase search |
| `radar.png` | Not found in current codebase search |
| `radar_image.png` | Not found in current codebase search |
| `scout_image.png` | Not found in current codebase search |
| `Profile page.png` | Spaces in filename, likely unused |
| `quick_search.png` | Not found in current codebase search |
| `Fuzocube.png` | Not found in current codebase search |
| `feed_image.png` | Not found in current codebase search |
| `tako_pic.png` | Not found in current codebase search |
| `feedpage.png` | Not found in current codebase search |

## 🧹 Recommended Cleanup Actions

### Test/Demo Routes to Remove
These routes were created for testing and should be removed before production:

1. **`/app/auth-callback-test/`** - Auth testing page
2. **`/app/auth-state-test/`** - Auth state testing
3. **`/app/test-save-to-plate-disabled/`** - Feature testing
4. **`/app/tweakcn-test/`** - Theme testing
5. **`/app/tweakcn-validation/`** - Theme validation
6. **`/app/social-demo/`** - Social feature demo
7. **`/app/order-tracking-demo/`** - Order tracking demo
8. **`/app/onboarding-demo/`** - Onboarding demo

### Backup Files to Remove
1. **`tailwind.config.ts.backup`** - Old Tailwind config

### Debug Routes (Consider Removal for Production)
- **`/app/_debug/`** - Debug utilities
- **`/app/auth-debug/`** - Auth debugging
- **`/app/master-debug/`** - Master debug dashboard

### Scripts Directory Review
The `/scripts/` directory contains database seeding and avatar upload scripts. These should be:
- Kept for development/deployment automation
- Not included in production build
- Documented for future use

## 🚀 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Update environment variables for production
- [ ] Configure Supabase for production instance
- [ ] Set up domain-specific configurations

### 2. Build Optimization
- [ ] Remove test/demo routes
- [ ] Clean up unused images
- [ ] Optimize image sizes
- [ ] Review and remove debug routes

### 3. Missing Assets
- [ ] Create or locate missing placeholder images
- [ ] Standardize image path casing
- [ ] Add favicon and app icons

### 4. Git Repository Preparation
- [ ] Remove existing VITE project from git
- [ ] Initialize fresh git history if needed
- [ ] Set up proper .gitignore for Next.js project

## ✅ Git Repository Update - COMPLETED

### Successfully Replaced Repository Content
- **Repository:** https://github.com/FoodCop/foodcop  
- **Branch:** main
- **Commit:** `8c76b51` - "Initial FoodCop Next.js application - Complete project replacement (without sensitive env files)"
- **Status:** ✅ Successfully pushed and deployed

### What Was Done:
1. **Initialized fresh git repository** in project directory
2. **Removed sensitive files** (.env, .env.local) from git tracking
3. **Updated .gitignore** to prevent future commits of environment files
4. **Force-replaced main branch** with complete Next.js project
5. **Preserved original VITE project** in remote branch history

### Repository Status:
- ✅ All project files successfully committed (357 files, 66,881 insertions)
- ✅ Environment files properly excluded
- ✅ No sensitive data exposed in repository
- ✅ Clean working tree with proper .gitignore

## Next Steps

1. **Immediate Actions:**
   - Remove test/demo routes listed above
   - Delete `tailwind.config.ts.backup`
   - Fix missing image references
   - Standardize image path casing

2. **Before Deployment:**
   - Create production environment configuration
   - Set up CI/CD pipeline
   - Configure domain and SSL
   - Test chat functionality thoroughly
   - Implement CRON jobs for feed updates

3. **Post-Deployment:**
   - Monitor application performance
   - Set up error tracking
   - Implement proper logging
   - Schedule regular database maintenance

## Known Issues to Address Post-Deployment

1. **Chat Component:** Still requires debugging and optimization
2. **CRON Operations:** Feed update automation needs implementation
3. **Image Optimization:** Consider implementing next/image for better performance
4. **Error Handling:** Improve error boundaries and user feedback

---
*Created: October 4, 2025*
*Project: FoodCop - Next.js Food Discovery Application*