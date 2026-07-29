# Nordoloot — Nordolo Loot System

Point-budget loot distribution for Black Temple / Mount Hyjal. No backend — all data lives in localStorage and comes in via CSV imports.

## Run

```
npm install
npm run dev        # dev server
npm run build      # production build → dist/
```

The built `dist/index.html` uses relative paths and can be opened directly from the filesystem.

## Test data (not bundled into the build)

- `fake-tmb-export-p3.csv` — TMB export, 26 players, BT/Hyjal wishlists (empty notes → all players auto-derived)

Drag it onto the upload zone. Expected contested counts: Band of Devastation 15, Choker of Endless Nightmares 11, Leggings of Devastation 9, Madness of the Betrayer 7, Cursed Vision of Sargeras 5, Cataclysm's Edge 5.

## Point bids

Everything comes in through the single TMB export. Raiders put their point bid in each wishlist item's **note** on ThatsmyBIS — a bare number like `300` (or `300 pts`). Prose notes are never misread as bids. Players with no note-bids fall back to rank-derived auto points and aren't checked against the budget. The **Budgets** tab audits every player's total against 500 (under/over indicators plus a warning banner) and lets the officer adjust any bid in-app — edits persist and survive re-imports, so there's no need to re-export from TMB after talking to a raider.

## Modifiers

Attendance (+20), Tenure (+30, capped at 12 weeks), Unexcused Absence (−25 escalating: n strikes cost 25·n(n+1)/2), Win Penalty (−8), plus optional Passing Bonus and Bad Luck Protection. All toggleable with weight sliders.

## Structure

- `src/constants.js` — class colors, boss loot tables, modifier defaults
- `src/engine.js` — score formula, award-log replay (points spent on win, BLP), localStorage
- `src/App.jsx` — all UI (tabs, modals, imports, budget builder)
