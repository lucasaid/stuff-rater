# Stuff Rater

A single-page app for deciding whether to keep or discard personal items, games, collectibles, household objects, and anything else cluttering the shelves. Rate an item across 8 weighted criteria and the app outputs a quality tier (Junk → Legendary) along with a plain-English RETAIN / DISCARD verdict.

## How it works

Each item is scored across eight criteria (all rated 0–10):

| Criterion | Weight |
|---|---|
| Joy | ×3 |
| Engagement | ×2 |
| Repeated Value | ×2 |
| Identity | ×2 |
| Nostalgia | ×1 |
| Social Value | ×1 |
| Merit | ×1 |
| Replaceability | ×1 |

The weighted total maps to a tier (Junk, Common, Uncommon, Rare, Epic, Legendary) and a verdict. Hard overrides apply at the extremes, anything with very low joy and engagement is always discarded; anything with very high joy is always kept.

## Requirements

- Node.js 24+
- Yarn
- Chrome (for end-to-end tests)

## Getting started

```bash
yarn install
yarn start
```

The dev server runs at [http://localhost:3000](http://localhost:3000).

## Running tests

### Unit tests

```bash
yarn test                    # interactive watch mode
yarn test --watchAll=false   # run once (CI mode)
```

### End-to-end tests

```bash
yarn test:e2e                # headless
yarn test:e2e:ui             # with Playwright's interactive UI
```

E2E tests spin up the dev server on port 3001 automatically and use your system-installed Chrome.

## Building for production

```bash
yarn build
```

Output goes to `/build`, minified and cache-busted, ready to serve as static files.
