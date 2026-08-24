# Project Configuration

> This file is read by Claude Code agents and pipeline scripts.
> Fill in the values below before running the pipeline.

## Project-Specific Configuration

- **Test command:** `npm test`
- **Build command:** `npm run build`
- **Version files:** `package.json`
- **Artifacts directory:** `.artefacts/`

## Project Context

> Optional. Describe the project so agents have background without reading the whole codebase.

- **What it is:** Change initiative planner — goal/context canvas, guided facets (Dance/Mind/Stimulate/Change), stakeholder map, actions with hypotheses, roadmap milestones and board view.
- **Tech stack:** TypeScript, React, Vite, Tailwind CSS, i18next (en/es/be/ru)
- **Key conventions:** functional components, no classes; pure logic in `src/utils/` with co-located `*.test.ts` (vitest, node env); initiatives persisted under one localStorage key, export/import tolerant merge-by-id; i18n parity pinned by test (CC2).
