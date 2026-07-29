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

- `fake-tmb-export-p3.csv` — TMB export, 26 players, BT/Hyjal wishlists
- `fake-budget-submissions-p3.csv` — budget submissions, every player at exactly 500 points

Drag both onto the upload zones. Expected contested counts: Band of Devastation 15, Choker of Endless Nightmares 11, Leggings of Devastation 9, Madness of the Betrayer 7, Cursed Vision of Sargeras 5, Cataclysm's Edge 5.

## Submissions

The Budget tab has two modes: **Build My Budget** (raiders pick items by boss, allocate exactly 500 points, and copy a compact `NDL1|…` string) and **Officer Import** (paste one or many strings; each is validated — over-budget, unknown items, bad versions, and duplicates are flagged — and accepted players replace their prior submission). The Budget CSV drop zone still works as a fallback.

## Modifiers

Attendance (+20), Tenure (+30, capped at 12 weeks), Unexcused Absence (−25 escalating: n strikes cost 25·n(n+1)/2), Win Penalty (−8), plus optional Passing Bonus and Bad Luck Protection. All toggleable with weight sliders.

## Structure

- `src/constants.js` — class colors, boss loot tables, modifier defaults
- `src/engine.js` — score formula, award-log replay (points spent on win, BLP), localStorage
- `src/App.jsx` — all UI (tabs, modals, imports, budget builder)
