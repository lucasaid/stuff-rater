# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start                   # Dev server at http://localhost:3000
yarn build                   # Production build to /build
yarn test                    # Unit tests (interactive watch mode)
yarn test --watchAll=false   # Unit tests once (CI mode)
yarn test:e2e                # Playwright e2e tests (requires Chrome installed)
yarn test:e2e:ui             # Playwright with interactive UI
```

E2E tests run the dev server on port 3001 (to avoid conflicts with port 3000). Playwright uses system-installed Chrome via `channel: 'chrome'` — no separate browser download needed.

## What this app does

Stuff Rater is a single-page React app for deciding whether to keep or discard personal items (games, collectibles, household objects, etc.). Users rate an item across 8 weighted criteria; the algorithm outputs a quality tier (Junk → Common → Uncommon → Rare → Epic → Legendary) and a RETAIN / DISCARD verdict with a plain-English explanation of what drove the decision.

## Scoring algorithm (`src/scoring.ts`)

The algorithm is extracted into `src/scoring.ts` for testability. `App.tsx` imports from it; all pure logic lives there.

**Weighted criteria** — all rated 0–10:

| Criterion | Weight | Max |
|---|---|---|
| Joy | ×3 | 30 |
| Engagement | ×2 | 20 |
| Repeated Value | ×2 | 20 |
| Identity | ×2 | 20 |
| Nostalgia | ×1 | 10 |
| Social Value | ×1 | 10 |
| Merit | ×1 | 10 |
| Replaceability | ×1 | 10 |
| **Max total** | | **130** |

**Decision logic** (evaluated in order):

1. **Hard discard** — joy ≤ 3 AND engagement ≤ 3 → always DISCARD
2. **Hard keep** — joy ≥ 9 → always RETAIN (Legendary tier)
3. **Amplifier** — weighted total in [50, 62) AND replaceability ≥ 7 → RETAIN
4. **Score** — weighted total ≥ 62 → RETAIN; below → DISCARD

**Quality tiers** (mapped from rule + score):

| Tier | Condition | Verdict |
|---|---|---|
| Legendary | hard-keep or score ≥ 112 | Retain |
| Epic | score 96–111 | Retain |
| Rare | score 78–95 | Retain |
| Uncommon | score 62–77 or amplifier | Retain |
| Common | score 38–61 | Discard |
| Junk | hard-discard or score < 38 | Discard |

**`why` text**: override rules prefix themselves ("Override — " / "Amplifier — "); score-based verdicts describe the dominant group (core vs. emotional vs. balanced).

## Architecture

- `src/scoring.ts` — all algorithm logic: constants (`WEIGHTS`, `ZERO_SCORES`, `MAX_SCORE`, thresholds), types (`CriterionKey`, `Scores`, `QualityTier`, `VerdictRule`, `Verdict`), and functions (`computeVerdict`, `computeTier`, `rulePrefix`)
- `src/App.tsx` — state, UI-only mappings (`TIER_CSS`, `TIER_COLOR`), `GROUPS` array for rendering; imports everything algorithmic from `scoring.ts`
- `src/Range.tsx` — segmented stat bar (10 clickable rectangular segments, 0–10); clicking the rightmost filled segment steps value down
- `src/App.css` — all styles; dark fantasy RPG aesthetic using Cinzel Decorative / Rajdhani / Orbitron; CSS variables for tier colors; staggered `slideIn` animations
- `src/scoring.test.ts` — 36 Jest unit tests covering all scoring branches
- `e2e/appraisal.spec.ts` — 17 Playwright tests covering UI interactions end-to-end

## Design notes

- **Aesthetic**: dark panel with gold corner brackets, dark background with subtle colour nebula gradients
- **Tier colours** are CSS variables (`--legendary`, `--epic`, etc.) used for both the verdict text glow and the score bar fill
- **Accessibility**: all interactive elements have `focus-visible` gold outline; minimum font size 12px; `--text-muted` is `#6a82a4` (sufficient contrast on dark panel); stat segments are 22px tall; reset button `min-height: 44px`
- The `verdict-tier` div uses `key={verdict.tier}` to retrigger the reveal animation on tier change — this is intentional, not redundant state
- **ESLint**: `react-app/jest` testing-library rules are suppressed for `e2e/**/*.ts` via an override in `package.json` (they're RTL-specific and don't apply to Playwright)
