# Onboarding V2 Question Editor Plan (Deferred)

Status: Deferred by product decision on 2026-03-11.

## Goal
Provide a low-friction way to iterate onboarding question wording/options without changing component code.

## Scope (Later)
- Add a JSON-backed question source for Onboarding V2 steps.
- Keep runtime validation to avoid malformed configs breaking auth flow.
- Support preview via demo route (`view=onboarding-demo`).
- Keep production auth onboarding behind feature flag until approved.

## Proposed Implementation
1. Create a typed parser/validator for onboarding question config.
2. Load config from a versioned JSON file in the repo.
3. Add safe fallback to default static questions when config is invalid.
4. Add a small preview panel in demo mode to show resolved question set.
5. Add telemetry for invalid config or missing required fields.

## Acceptance Criteria
- Questions/options can be updated without touching TSX logic.
- Demo route reflects new config immediately after deploy.
- Invalid config does not block sign-in; defaults are used.
- Build and type checks remain green.

## Notes
- Keep this out of current release branch logic until client approves final onboarding flow.
- After approval, enable V2 via `VITE_ONBOARDING_V2_ENABLED=true` and retire V1 path.
