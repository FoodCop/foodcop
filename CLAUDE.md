@AGENTS.md
@DESIGN_SYSTEM.md

## Design
All UI must follow the design system in DESIGN_SYSTEM.md (source of truth: the /profile page, `src/scss/_profile.scss`).

## Development standards (owner's requirement)
- **UI/UX:** use the `ui-ux-pro-max` skill (`.claude/skills/ui-ux-pro-max`, search tool: `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux|--stack nextjs`) for layout, hierarchy, accessibility, responsive and consistency guidance. Its output is advice - DESIGN_SYSTEM.md and the client's decisions win; never regenerate a separate design system.
- **Motion:** Framer Motion (`framer-motion`) for subtle, premium micro-interactions, entrances, transitions and loading states - natural, not excessive; animate transform/opacity; always respect reduced motion.
- **Every feature:** pixel-perfect, reusable components, responsive mobile → tablet → desktop, WCAG accessibility, consistent spacing/typography, loading/empty/error states, no needless re-renders, type-safe, follow the existing architecture.
- **Mandatory QA:** after EVERY UI task run `.claude/QA_CHECKLIST.md` (visual, layout, 320–1600px responsive with no horizontal scroll, links/functionality, animation, overflow/z-index, accessibility, performance/console, tsc + eslint + sass) and fix failures before reporting done. A PostToolUse hook (`.claude/hooks/ui-qa-reminder.js`) reminds after any edit to `src/**/*.tsx|jsx|scss|css`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
