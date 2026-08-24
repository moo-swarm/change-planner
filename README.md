# Change Planner

An interactive change management planning tool based on Jurgen Appelo's "How to Change the World" framework — plan change initiatives across all 4 facets (Dance with the System, Mind the People, Stimulate the Network, Change the Environment) with guided prompts, action tracking, a Kanban board, a roadmap timeline, and readiness assessments. All data lives in browser localStorage — no account, no backend.

Part of the [Agile Tools](https://github.com/bthos) suite built on Management 3.0 and ICAgile source materials.

See `GOAL.md` for why this exists and `ROADMAP.md` for what's shipped and what's next.

## Stack
React 18 · TypeScript · Vite · Tailwind CSS · react-i18next (EN/ES/BE/RU)

## Dev commands
```bash
npm install
npm run dev      # start Vite dev server
npm run build    # tsc typecheck + production build
npm test         # vitest unit tests
npm run preview  # preview the production build locally
```

## Deploy
GitHub Pages via GitHub Actions on push to `main`.

## Future-back planning

Change plans drift when they start from the tools they'll use instead of the outcome they want. Each initiative gains a **Future-back** tab in its canvas (between Guided and Roadmap) that plans from the end: describe where you want to arrive in **End state**, then derive the conditions that must be true first, backwards. The mode is opt-in per initiative — until enabled the tab shows a short pitch; **Enable for this initiative** turns it on, **Not now** declines and returns to the workspace unchanged.

The end state gets a gentle vocabulary guard: while you type (debounced), an amber banner flags solution words — tool and implementation nouns like jira, docker, migrate ("This sounds like a solution, not an end state: … Describe the outcome instead."). It never blocks editing or saving. Matching is whole-word and case-insensitive, so "jira-like" passes and repeats are deduplicated; **Dismiss** quiets the words listed for the rest of the visit (leaving the tab clears it), and typing a different solution word warns again. The word list follows the app language: Spanish falls back to the English list, Belarusian to the Russian one — whose seeds are transliterated tool names (джира, гитхаб) as they're actually written.

Conditions build as rows of text plus an optional date under "Conditions on the way back". **Add to roadmap** promotes one condition into a plain roadmap milestone — title is the condition text, date is the row's date or today when left blank — and the row reads "On roadmap ✓"; **Add all to roadmap** promotes every drafted row in one atomic save, so an interrupted write can never strand half a promotion. Promoted conditions are ordinary milestones, needing nothing special from the Roadmap timeline or Progress view. Promotion state stays derived rather than permanent: delete the milestone from the Roadmap and the condition row quietly renders as a draft again, editable and re-promotable. **Turn off future-back** keeps the statement and conditions stored; re-enabling restores everything intact.

Storage is additive: three optional fields on the initiative inside the existing `change-planner-initiatives` key. Export/import are untouched — backups stay version 1, older exports import cleanly with the feature simply absent. One direction to know: importing a newer backup into an older build silently drops future-back data, the usual client-side trade.

## localStorage keys

| Key | Shape | Purpose |
|-----|-------|---------|
| `change-planner-initiatives` | `Initiative[]` | All initiatives (active + archived). Read by the suite dashboard (`agile-toolkit.github.io`) for the Change Planner card. |
| `theme` | `'light' \| 'dark'` | Selected UI theme, applied via `[data-theme]` before first paint. |

Change Planner also *reads* (never writes) a few keys owned by sibling apps for one-way integrations: `improvement-board-items` (Improvement Board → import as actions) and `team-identity-charter` (Team Identity → auto-fill initiative stakeholders).

## Tech notes
- **State:** a single `initiatives: Initiative[]` array in `App.tsx`'s React state, persisted to `localStorage` on every change (no external state library, no undo stack).
- **i18n:** `react-i18next` with 4 locale files under `src/i18n/` (`en.json`, `es.json`, `be.json`, `ru.json`). All 4 must stay in sync — a new user-facing string means a new key in all 4 files, not just `en.json`.
- **Theme:** `ThemeToggle.tsx` toggles a `data-theme` attribute (Tailwind `darkMode: 'selector'`), persisted under the `theme` localStorage key. An inline anti-flash script in `index.html` applies the stored theme before React mounts, to avoid a light-mode flash on dark-theme reloads.
- **Facets:** the 4 Appelo facets are a fixed `FacetId` union (`'dance' | 'mind' | 'stimulate' | 'change'`) duplicated as a local `FACET_IDS` const array in several components (`ActionTracker.tsx`, `ExportButton.tsx`, `LearnView.tsx`) rather than a single shared source — keep them in sync when adding a facet.
- **Sharing:** `src/utils/sharing.ts` encodes an initiative to a base64url URL hash (`#share=...`) with no server round-trip; `SharedView.tsx` renders it read-only and offers a one-click import into the viewer's own localStorage.
- **Cross-app integrations:** one-way localStorage reads from Improvement Board (`improvement-board-items`) and Team Identity (`team-identity-charter`); a "Copy to Retro context" button in `ProgressView.tsx` builds a Markdown block for pasting into Scrum Facilitator; the suite dashboard (`agile-toolkit.github.io`) reads `change-planner-initiatives` directly for its dashboard card.
- **PNG/export:** `html2canvas` is dynamically imported (not in the initial bundle) so the export path only costs bytes when used.

## Source materials
See `.artefacts/BRIEF.md` for the full feature checklist and run-by-run agent narrative log.
