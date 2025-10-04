# Demo Directory Structure - FUZO Food Discovery App

## Overview
This document outlines the parallel demo development structure for the FUZO Food Discovery application. The demo flow allows us to build and test new functionality without breaking existing routes, providing a safe development environment for the main user experience.

## Directory Structure

```
foodcop/
├── app/
│   ├── demo/                           # 🆕 Demo flow (parallel development)
│   │   ├── layout.tsx                  # Demo-specific layout with navigation
│   │   ├── landing/                    # Demo landing page
│   │   │   └── page.tsx               
│   │   ├── onboarding/                 # Demo onboarding flow
│   │   │   ├── page.tsx               # Onboarding start
│   │   │   ├── step-1/                # Profile setup
│   │   │   │   └── page.tsx
│   │   │   ├── step-2/                # Food preferences
│   │   │   │   └── page.tsx
│   │   │   ├── step-3/                # Location & goals
│   │   │   │   └── page.tsx
│   │   │   └── complete/              # Onboarding completion
│   │   │       └── page.tsx
│   │   ├── dashboard/                  # Demo dashboard (main hub)
│   │   │   └── page.tsx
│   │   ├── feed/                      # Demo feed page
│   │   │   └── page.tsx
│   │   ├── plate/                     # Demo plate page
│   │   │   └── page.tsx
│   │   ├── scout/                     # Demo scout page
│   │   │   └── page.tsx
│   │   ├── chat/                      # Demo chat page
│   │   │   └── page.tsx
│   │   ├── bites/                     # Demo bites page
│   │   │   └── page.tsx
│   │   └── ai/                        # Demo AI page
│   │       └── page.tsx
│   │
│   ├── feed/                          # 🔄 Existing pages (unchanged)
│   │   └── page.tsx
│   ├── plate/
│   │   └── page.tsx
│   ├── scout/
│   │   └── page.tsx
│   ├── chat/
│   │   └── page.tsx
│   ├── bites/
│   │   └── page.tsx
│   ├── ai/
│   │   └── page.tsx
│   └── api/                           # 🔄 Existing API routes (shared)
│       ├── debug/
│       ├── save-to-plate/
│       └── ...
│
├── components/
│   ├── demo/                          # 🆕 Demo-specific components
│   │   ├── landing/
│   │   │   ├── LandingHero.tsx
│   │   │   ├── LandingFeatures.tsx
│   │   │   └── LandingCTA.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingLayout.tsx
│   │   │   ├── OnboardingStep.tsx
│   │   │   ├── ProfileSetup.tsx
│   │   │   ├── FoodPreferences.tsx
│   │   │   └── LocationGoals.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardHero.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── navigation/
│   │   │   ├── DemoNavbar.tsx
│   │   │   └── DemoSidebar.tsx
│   │   └── shared/
│   │       ├── DemoButton.tsx
│   │       ├── DemoCard.tsx
│   │       └── DemoInput.tsx
│   │
│   ├── auth/                          # 🔄 Existing components (shared)
│   ├── debug/
│   ├── ui/
│   └── ...
│
└── docs/
    ├── Demo-Directory-Structure.md     # 🆕 This document
    ├── Phase1.md
    ├── Phase2.md
    └── ...
```

## Flow Architecture

### Demo User Journey
```
/demo/landing
    ↓ (Sign up/Get started)
/demo/onboarding
    ↓ (Step 1: Profile)
/demo/onboarding/step-1
    ↓ (Step 2: Preferences)
/demo/onboarding/step-2
    ↓ (Step 3: Location & Goals)
/demo/onboarding/step-3
    ↓ (Complete onboarding)
/demo/onboarding/complete
    ↓ (Enter app)
/demo/dashboard
    ↓ (Navigate to features)
/demo/feed | /demo/plate | /demo/scout | /demo/chat | /demo/bites | /demo/ai
```

### Existing User Journey (Unchanged)
```
/ (main landing)
    ↓
/feed | /plate | /scout | /chat | /bites | /ai
```

## Key Benefits

### 1. **Parallel Development**
- Build new UI without affecting existing functionality
- Test complete user flows in isolation
- Iterate quickly without breaking current debug infrastructure

### 2. **Safe Testing Environment**
- All existing API routes remain functional
- Debug components continue to work
- Authentication system shared between both flows

### 3. **Easy Migration Path**
- Once demo flow is proven, can replace existing routes
- Component reusability between demo and main app
- Gradual migration capability

### 4. **Shared Resources**
- API endpoints shared between demo and main app
- Authentication system unified
- Database operations consistent
- Debug infrastructure available in both flows

## Implementation Strategy

### Phase 1: Demo Foundation
1. Create demo layout with navigation
2. Build landing page with modern design
3. Implement onboarding flow with steps
4. Create demo dashboard as main hub

### Phase 2: Demo Main Pages
1. Convert existing debug functionality to production UI
2. Implement Feed, Plate, Scout, Chat, Bites, AI pages
3. Integrate with existing API endpoints
4. Add demo-specific enhancements

### Phase 3: Testing & Refinement
1. End-to-end user flow testing
2. UI/UX optimization
3. Performance testing
4. Cross-browser compatibility

### Phase 4: Migration Planning
1. Feature comparison between demo and main
2. Migration strategy documentation
3. Gradual rollout plan
4. Fallback procedures

## Technical Considerations

### Shared Dependencies
- Authentication system (Supabase Auth)
- API endpoints (all existing routes)
- Database schema (no changes needed)
- External services (Google, Spoonacular, OpenAI)

### Demo-Specific Features
- Enhanced UI components
- Improved onboarding experience
- Modern dashboard design
- Streamlined navigation
- Better mobile responsiveness

### Development Workflow
1. Start development in `/demo` routes
2. Use existing API endpoints
3. Create demo-specific components
4. Test thoroughly in isolation
5. Document differences and improvements
6. Plan migration when ready

## Next Steps

1. **Create Demo Layout** - Base layout for demo flow
2. **Build Landing Page** - Modern, engaging first impression
3. **Implement Onboarding** - Multi-step user setup process
4. **Create Dashboard** - Central hub for all features
5. **Convert Pages** - Transform debug components to production UI

---

*This parallel development approach ensures we can innovate and improve the user experience while maintaining the stability of existing functionality.*