# Stitch AAA Redesign Strategy
**Project**: FuzoFoodCop  
**Date**: February 9, 2026  
**Status**: ACTIVE - New Frontier  
**Goal**: Port existing pages to AAA design quality using Google Stitch MCP

---

## 🎯 The Brilliant Plan

**Core Insight**: Our logic is sound, but we need AAA design. Solution: Port pages through Stitch for professional design, then bridge back to our codebase.

### Why This Works
1. **Keep Solid Logic** ✅ - All backend, API calls, state management stays
2. **Upgrade Design** ✨ - Stitch generates professional-grade UI
3. **Maintain Architecture** 🏗️ - Convert back to React with our patterns
4. **Team Collaboration** 👥 - Share Stitch MCP with all devs
5. **Consistent Design Language** 🎨 - DESIGN.md ensures uniformity

---

## 📚 Knowledge Base: Stitch Skills

### Repository Cloned
Location: `k:\H DRIVE\Quantum Climb\APPS\fuzofoodcop4\stitch-skills`

### Core Skills Available

#### 1. **design-md** 📝
Generates comprehensive DESIGN.md from existing Stitch projects.

**Purpose**: Document design system in natural language for Stitch generation  
**Input**: Stitch project with screens  
**Output**: `DESIGN.md` with:
- Color palette (descriptive names + hex codes)
- Typography system
- Spacing & layout rules  
- Component patterns
- Atmosphere & mood

**Install**:
```bash
npx skills add google-labs-code/stitch-skills --skill design-md --global
```

#### 2. **stitch-loop** 🔄
Autonomous website builder using iterative baton-passing pattern.

**Purpose**: Generate multi-page sites iteratively with consistent design  
**Key Files**:
- `SITE.md` - Site vision, project ID, sitemap, roadmap
- `DESIGN.md` - Design system (required for prompts)
- `next-prompt.md` - Baton file with next task

**Workflow**:
1. Read baton → Extract page name + prompt
2. Consult SITE.md + DESIGN.md
3. Generate screen with Stitch MCP
4. Download HTML + screenshot
5. Integrate into site structure
6. Update documentation
7. Write next baton → Loop continues

**Install**:
```bash
npx skills add google-labs-code/stitch-skills --skill stitch-loop --global
```

#### 3. **react-components** ⚛️
Converts Stitch HTML to modular React components with validation.

**Purpose**: Transform Stitch designs into production React code  
**Key Features**:
- Modular component architecture
- TypeScript interfaces (Readonly props)
- Data decoupling (`mockData.ts`)
- Custom hooks for logic
- Tailwind theme mapping
- AST-based validation

**Workflow**:
1. Fetch Stitch HTML via bash script (handles GCS redirects)
2. Extract Tailwind config from `<head>`
3. Create data layer (`src/data/mockData.ts`)
4. Generate components with interfaces
5. Validate with `npm run validate`
6. Wire into App.tsx

**Install**:
```bash
npx skills add google-labs-code/stitch-skills --skill react:components --global
```

#### 4. **shadcn-ui** 🎨
Expert guidance for integrating shadcn/ui components.

**Purpose**: Best practices for shadcn integration  
**Features**:
- Component discovery & installation
- Customization patterns
- Optimization strategies

**Install**:
```bash
npx skills add google-labs-code/stitch-skills --skill shadcn-ui --global
```

#### 5. **enhance-prompt** ✨
Transforms vague UI ideas into Stitch-optimized prompts.

**Purpose**: Improve prompt quality for better Stitch output  
**Features**:
- Adds UI/UX specificity
- Injects design system context
- Structures prompts optimally

**Install**:
```bash
npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global
```

---

## 🏗️ Our Implementation Strategy

### Phase 1: Foundation (Week 1)

#### 1.1 Document Current Design System
**Task**: Create initial DESIGN.md from our existing pages

**Current Assets**:
- Lean 5-color system (`src/styles/lean-colors.css`)
- Design tokens (`src/styles/design-tokens.css`)
- Material UI icons (keeping these!)
- Typography: Google Sans Flex + IBM Plex Serif

**Action**:
```markdown
# Create DESIGN.md manually (or use design-md skill if we port a page first)
Document:
- Color: Banana Yellow (#ffe838), Orange (#e89f3c), etc.
- Typography: Headlines, body text
- Spacing: 8px base unit
- Components: Buttons, Cards, Navigation
- Atmosphere: Energetic, food-focused, mobile-first
```

**File**: `DESIGN.md` at project root

#### 1.2 Create Site Vision
**Task**: Document FuzoFoodCop vision and page inventory

**Action**:
```markdown
# Create SITE.md
Include:
- Site vision: Food discovery with SNAP, Scout, Feed, Bites
- Stitch project ID: (will get from first generation)
- Sitemap: [x] Landing, [ ] Feed, [ ] Scout, etc.
- Roadmap: Pages to redesign in order
```

**File**: `SITE.md` at project root

#### 1.3 Set Up Stitch Project
**Task**: Create Stitch project for FuzoFoodCop redesign

**Action**:
1. Use Stitch MCP: `create_project` with name "FuzoFoodCop AAA Redesign"
2. Save project ID to `stitch.json`
3. Update `SITE.md` with project ID

---

### Phase 2: Pilot Redesign (Week 1-2)

#### 2.1 Choose Pilot Page
**Candidate**: Landing Page (already exists, good starting point)

**Why**:
- Self-contained (no complex state)
- Represents brand identity
- Critical first impression

#### 2.2 Generate AAA Design with Stitch

**Input Prompt Structure**:
```markdown
---
page: landing
---
A modern food discovery app landing page for FuzoFoodCop.

**DESIGN SYSTEM (REQUIRED):**
[Copy entire DESIGN.md content]

**Page Structure:**
1. Hero section with app showcase
2. Feature highlights (SNAP, Scout, Bites)
3. Social proof / testimonials
4. Call-to-action section
5. Footer with links

**Key Requirements:**
- Mobile-first responsive design
- Energetic food-focused aesthetic
- Material UI icons integration points
- Clear CTAs for sign up
```

**Stitch MCP Calls**:
1. `generate_screen_from_text` → Get screen ID
2. `get_screen` → Download HTML + screenshot
3. Save to `stitch-designs/landing/`

#### 2.3 Visual Review & Iteration

**Process**:
1. Review screenshot vs. current design
2. Identify improvements (spacing, typography, visual hierarchy)
3. If needed: Regenerate with refined prompt
4. Get stakeholder approval

#### 2.4 Convert to React Components

**Using react-components skill**:
1. Run fetch script: `scripts/fetch-stitch.sh`
2. Extract components:
   - `HeroSection.tsx`
   - `FeatureCard.tsx`
   - `CTASection.tsx`
3. Create `mockData.ts` with content
4. Add TypeScript interfaces
5. Validate with AST checker

**Port Logic**:
- Auth integration (Google OAuth via Supabase)
- Navigation to `/feed` after login
- Material UI icons in buttons

#### 2.5 Test & Deploy

**Testing**:
- Mobile Safari, Chrome, Firefox
- Test auth flow
- Verify navigation
- Check responsive breakpoints

**Deploy**:
- Commit to `feature/stitch-landing-redesign`
- Push to GitHub
- Vercel auto-deploys preview
- Merge to main after approval

---

### Phase 3: Core Pages Redesign (Weeks 2-4)

**Priority Order** (based on user impact):

#### 3.1 Feed Page (Week 2)
**Current**: `src/components/feed/FeedMobile.tsx`, `FeedDesktop.tsx`  
**Components**: FeedCard, masonry layout, infinite scroll

**Stitch Prompt Focus**:
- Pinterest-style masonry grid
- Card design with image, title, rating, location
- Save/like interactions
- Filter chips at top

**Logic to Port**:
- Infinite scroll hook
- Supabase data fetching
- SavedItemsService integration
- Modal for place details

#### 3.2 Scout Page (Week 2-3)
**Current**: `src/components/scout/ScoutDesktop.tsx`  
**Components**: Search bar, Google Maps, place cards

**Stitch Prompt Focus**:
- Split-screen layout (map + list)
- Search input with autocomplete
- Place cards with CTA buttons
- Map markers and clusters

**Logic to Port**:
- Google Maps API integration
- PlacesService calls
- Marker clustering
- Place details modal

#### 3.3 Snap Page (Week 3)
**Current**: `src/components/snap/Snap.tsx`, `SnapDesktop.tsx`  
**Components**: Camera interface, upload, tagging system

**Stitch Prompt Focus**:
- Camera viewfinder UI
- Capture button (mobile)
- Upload dropzone (desktop)
- Tag selection chips
- Saved photos gallery

**Logic to Port**:
- Camera API (navigator.mediaDevices)
- File upload to Supabase Storage
- Image processing (resize, compress)
- Tag submission with metadata

#### 3.4 Bites Page (Week 3-4)
**Current**: `src/components/bites/Bites.tsx`  
**Components**: Recipe cards, category tabs, filters

**Stitch Prompt Focus**:
- Recipe card grid
- Category tabs (Breakfast, Lunch, Dinner)
- Filter sidebar
- Recipe detail modal

**Logic to Port**:
- Spoonacular API integration
- Recipe search & filtering
- Dietary restriction filters
- Saved recipes feature

#### 3.5 Plate Page (Week 4)
**Current**: `src/components/plate/Plate.tsx`  
**Components**: User profile, saved items, achievements

**Stitch Prompt Focus**:
- Profile header with avatar
- Saved items grid (photos, places, recipes)
- Achievement badges
- Settings panel

**Logic to Port**:
- User data from Supabase
- Saved items aggregation
- Edit profile functionality
- Logout flow

---

### Phase 4: Navigation & Shared Components (Week 5)

#### 4.1 Navigation System
**Files**: `src/App.tsx`, `src/components/navigation/FloatingActionMenu.tsx`

**Stitch Prompt Focus**:
- Desktop navbar with logo + links
- Mobile floating action menu
- User profile dropdown
- Chat & AI assistant icons

**Logic to Port**:
- Active route highlighting
- Authentication-based menu items
- Unread message badges

#### 4.2 Dialogs & Modals
**Current**: Various custom modals

**Redesign with Stitch**:
- Place detail dialog (Scout)
- Tagging dialog (Snap)
- Recipe detail dialog (Bites)
- Confirmation dialogs

**Convert to**: shadcn Dialog components with Stitch design

#### 4.3 Common UI Elements
**Buttons**: Already using shadcn, ensure Stitch design aligns  
**Cards**: Standardize across Feed, Bites, Plate  
**Inputs**: Search bars, text inputs, selects  
**Badges**: Tags, dietary restrictions, badges

---

### Phase 5: Polish & Integration (Week 6)

#### 5.1 Design Consistency Audit
- Compare all pages side-by-side
- Ensure color usage matches DESIGN.md
- Verify spacing consistency (8px grid)
- Check typography hierarchy

#### 5.2 Accessibility Pass
- Lighthouse audit all pages
- WCAG AA contrast compliance
- Keyboard navigation
- Screen reader testing

#### 5.3 Performance Optimization
- Image optimization (WebP, lazy loading)
- Code splitting per page
- Bundle size analysis
- Lighthouse performance > 95

#### 5.4 Documentation
- Update README with new design system
- Component usage guide for devs
- Stitch workflow documentation
- MCP setup guide for team

---

## 🌉 The Bridge: Dev Workflow

### How Devs Use Shared Stitch MCP

#### Setup (One-time per dev)

**1. Install VS Code Extension**:
- MCP extension already configured in `.vscode/mcp.json`

**2. Get Google Stitch API Key**:
- Visit: https://console.cloud.google.com
- Enable Stitch API
- Create API key
- Enter when prompted by VS Code

**3. Install Stitch Skills**:
```bash
# Install all skills globally
npx skills add google-labs-code/stitch-skills --skill stitch-loop --global
npx skills add google-labs-code/stitch-skills --skill react:components --global
npx skills add google-labs-code/stitch-skills --skill design-md --global
npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global
```

#### Daily Workflow

**Scenario 1: New Feature Needs UI**
```
1. Dev reads DESIGN.md
2. Dev creates prompt in next-prompt.md
3. Dev asks AI: "Generate this page with Stitch"
4. AI uses stitch-loop skill → generates HTML
5. AI uses react-components skill → converts to React
6. Dev ports logic from existing similar component
7. Dev tests and commits
```

**Scenario 2: Redesign Existing Component**
```
1. Dev identifies component to improve
2. Dev creates Stitch prompt based on DESIGN.md
3. AI generates improved design
4. Dev compares old vs. new side-by-side
5. Dev merges logic into new design
6. Dev validates and deploys
```

**Scenario 3: Design System Update**
```
1. Design lead updates DESIGN.md (new color, spacing, etc.)
2. All devs pull latest DESIGN.md
3. AI uses updated DESIGN.md in all prompts
4. Consistency automatically maintained
```

### Shared Resources

**Stitch Project**:
- ID stored in `stitch.json` at project root
- All devs use same project for consistency
- Screens organized by page name

**Design System**:
- Single source of truth: `DESIGN.md`
- Version controlled in Git
- All prompts reference this file

**Component Library**:
- shadcn UI components pre-configured
- Custom components in `src/components/ui/`
- Material UI icons registry

---

## 📊 Success Metrics

### Design Quality
- [ ] Lighthouse Design score > 90
- [ ] WCAG AA accessibility compliance
- [ ] Consistent spacing (8px grid)
- [ ] Professional typography hierarchy
- [ ] Mobile-first responsive on all pages

### User Experience
- [ ] Page load time < 2s
- [ ] Smooth animations (60fps)
- [ ] Clear navigation paths
- [ ] Intuitive interactions
- [ ] Delightful micro-interactions

### Developer Experience
- [ ] Component reusability > 80%
- [ ] Code review time reduced by 30%
- [ ] Design-to-code time < 1 day per page
- [ ] Zero design inconsistencies
- [ ] MCP adoption by all devs

### Business Impact
- [ ] User engagement up 20%
- [ ] Time on site increased
- [ ] Feature adoption (SNAP, Bites) improved
- [ ] User retention improved
- [ ] NPS score increased

---

## 🚀 Quick Start Checklist

### Today (February 9, 2026)
- [x] Clone stitch-skills repo
- [x] Study stitch-loop workflow
- [x] Study react-components conversion
- [x] Understand design-md documentation
- [x] Document strategy in this file
- [ ] Create DESIGN.md with current system
- [ ] Create SITE.md with vision
- [ ] Set up Stitch project via MCP
- [ ] Generate first screen (Landing Page)

### This Week
- [ ] Install Stitch skills globally
- [ ] Pilot: Redesign Landing Page
- [ ] Convert to React components
- [ ] Test and deploy to preview
- [ ] Get team feedback
- [ ] Document learnings
- [ ] Plan next 3 pages

### Next 2 Weeks
- [ ] Redesign Feed page
- [ ] Redesign Scout page
- [ ] Redesign Snap page
- [ ] Maintain logic, upgrade design
- [ ] Deploy each to preview
- [ ] Iterate based on feedback

### Month 1 Complete
- [ ] All 5 core pages redesigned
- [ ] Navigation system updated
- [ ] Shared components standardized
- [ ] Accessibility audit passed
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Team trained on MCP workflow
- [ ] Production deployment

---

## 🔥 Why This Is Brilliant

### 1. **Logic Preservation**
We don't throw away working code. All Supabase integration, API calls, state management, and business logic is ported directly. Only the UI layer changes.

### 2. **Design Elevation**
Stitch brings professional design capabilities:
- Material Design 3 principles
- Consistent spacing & typography
- Professional color harmony
- Responsive layouts that actually work

### 3. **Team Velocity**
With shared MCP:
- Designers can prototype in Stitch
- Devs convert to React automatically
- No more design→dev handoff delays
- Everyone uses same design system

### 4. **Maintainability**
Single source of truth (DESIGN.md):
- Update once, affects all future generations
- No more style drift across pages
- Onboarding new devs is faster
- Consistent codebase

### 5. **Scalability**
The loop skill pattern:
- Generate new pages rapidly
- Each follows same design language
- Automated quality checks
- Ready for future features

---

## 🛠️ Technical Architecture

### File Structure (After Implementation)

```
fuzofoodcop4/
├── DESIGN.md                   # Design system source of truth
├── SITE.md                     # Site vision and roadmap
├── stitch.json                 # Stitch project reference
├── next-prompt.md              # Baton for stitch-loop
├── stitch-skills/              # Cloned skills repo
│   └── skills/
│       ├── stitch-loop/
│       ├── react-components/
│       ├── design-md/
│       └── ...
├── stitch-designs/             # Generated Stitch HTML
│   ├── landing/
│   │   ├── landing.html
│   │   └── landing.png
│   ├── feed/
│   ├── scout/
│   └── ...
├── src/
│   ├── components/
│   │   ├── feed/              # Redesigned with Stitch→React
│   │   ├── scout/
│   │   ├── snap/
│   │   ├── bites/
│   │   ├── plate/
│   │   └── ui/                # shadcn + custom components
│   ├── data/
│   │   └── mockData.ts        # Decoupled content
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API integrations (unchanged)
│   └── styles/
│       ├── lean-colors.css    # Synced with DESIGN.md
│       └── design-tokens.css  # Synced with Stitch theme
└── .vscode/
    └── mcp.json               # Stitch MCP configured
```

### Data Flow

```
DESIGN.md → Stitch Prompt → Stitch MCP → HTML/CSS → React Components → FuzoFoodCop
    ↑                                                                        ↓
    └────────────────── Feedback Loop: Iterate & Improve ─────────────────┘
```

### Integration Points

**Stitch MCP** ↔ **VS Code** ↔ **AI Agent** ↔ **stitch-skills** ↔ **React App**

---

## 📖 References

### Official Docs
- Stitch MCP Setup: https://stitch.withgoogle.com/docs/mcp/setup
- Stitch Prompting Guide: https://stitch.withgoogle.com/docs/learn/prompting/
- Agent Skills Standard: https://github.com/agent-skills/skills

### Our Resources
- [SHADCN_IMPLEMENTATION_PLAN.md](SHADCN_IMPLEMENTATION_PLAN.md) - Phase 1 context
- [ICON_CONSOLIDATION_MATERIAL_UI.md](ICON_CONSOLIDATION_MATERIAL_UI.md) - Icon system
- [lean-colors.css](src/styles/lean-colors.css) - 5-color system
- [design-tokens.css](src/styles/design-tokens.css) - Typography & spacing

### Stitch Skills Repo
- GitHub: https://github.com/google-labs-code/stitch-skills
- Local: `k:\H DRIVE\Quantum Climb\APPS\fuzofoodcop4\stitch-skills`

---

## 💡 Key Takeaways

1. **We're on a new frontier** - Stitch MCP + skills = design automation
2. **Logic stays, design elevates** - Port functionality, upgrade UI
3. **Team collaboration through MCP** - Shared design system for all devs
4. **Iterative, not destructive** - Pilot → Core Pages → Polish
5. **Automated quality** - AST validation, Lighthouse audits built-in

---

**Status**: COMMITTED TO KNOWLEDGE ✅  
**Next Action**: Create DESIGN.md and SITE.md  
**Team**: Ready to execute  
**Timeline**: 6 weeks to AAA design

Let's build something beautiful! 🚀🎨
