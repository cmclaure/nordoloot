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

- `fake-tmb-export-p3-notes.csv` — 26 players with note bids, exercising every bid case. Expected on import: **8 raiders off-budget** (Grimjaw 545, Frostbyte 460, Voidlord 450, Dotsmagee 610, Shadowmind 474, Zappurah 348, Chainmend 425, Owlcapone 323) and **4 AUTO players** (Wallmeat, Petpuller, Mendylou — no notes; Bonkers — prose-only notes, must not parse as bids). Cheesybread uses "N pts" note format and lands exactly 500. Owlcapone's shortfall is a bid on a tier token ("not counted (tier)"), Voidlord's is a bid on an LC item, Zappurah's is a bid on a crossed-off item (received_at set).
- `fake-tmb-export-p3.csv` — older export with empty notes → all players auto-derived. Expected contested counts: Band of Devastation 15, Choker of Endless Nightmares 11, Leggings of Devastation 9, Madness of the Betrayer 7, Cursed Vision of Sargeras 5, Cataclysm's Edge 5.

## Point bids

Everything comes in through the single TMB export. Raiders put their point bid in each wishlist item's **note** on ThatsmyBIS — a bare number like `300` (or `300 pts`). Prose notes are never misread as bids. Players with no note-bids fall back to rank-derived auto points and aren't checked against the budget. The **Budgets** tab audits every player's total against 500 (under/over indicators plus a warning banner) and lets the officer adjust any bid in-app — edits persist and survive re-imports, so there's no need to re-export from TMB after talking to a raider.

## Modifiers

Attendance (+20), Tenure (+30, capped at 12 weeks), Unexcused Absence (−25 escalating: n strikes cost 25·n(n+1)/2), Win Penalty (−8), plus optional Passing Bonus and Bad Luck Protection. All toggleable with weight sliders.

## Structure

- `src/constants.js` — class colors, boss loot tables, modifier defaults
- `src/engine.js` — score formula, award-log replay (points spent on win, BLP), localStorage
- `src/App.jsx` — all UI (tabs, modals, imports, budget builder)
