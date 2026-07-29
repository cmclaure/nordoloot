# Nordoloot — Nordolo Loot System

Point-budget loot distribution for Black Temple / Mount Hyjal. Everything saves automatically in your browser — nothing to set up beyond running the app.

## Getting started

```
npm install
npm run dev
```

Or skip the terminal entirely: run `npm run build` once and open `dist/index.html` straight from your file explorer.

## How the system works

- Every raider gets a **500-point budget** to spread across their wishlist however they want. More points on an item = higher priority.
- Raiders enter their bid in the item's **Note** field on ThatsmyBIS — just the number (`300` or `300 pts`).
- Bids are **blind** — nobody sees anyone else's numbers.
- **Highest score wins.** Ties go to /roll.
- Tier tokens, Loot Council items, and crafting reagents are **outside the budget** — don't spend points on them.
- Raiders who don't enter any bids get automatic points based on their wishlist order.
- **Points are spent when you win.** Win an item and the points you bid on it are gone — they don't move to your other items.

## Officer workflow

1. Export the roster CSV from ThatsmyBIS.
2. Drop it onto the upload zone in the app.
3. Check the warning banner / **Budgets** tab — it flags anyone whose total isn't exactly 500 (under or over).
4. Message the raider, then fix their numbers right in the app with the **Adjust** button. No re-export needed — your edits are kept even when you import a fresh CSV later.
5. Keep attendance, tenure, and absence strikes up to date on the **Players** tab.
6. **Export** (top right) saves everything to a single file — use it as a backup before raid, or send it to another officer, who can **Import** it and see exactly what you see.

## Raid night

- **Raid Night** tab: pick tonight's raid and step through boss by boss — only that boss's drops are shown.
- **Award** gives the item to the projected winner. On a tie, it asks you to pick the /roll winner. **Undo** is in the session log if you misclick.
- **Drop** removes one player's claim (they got the item outside raid) — doesn't count as a win, item stays live for everyone else.
- **LC Items** tab: manual shortlists for council items like the Skull and Warglaives.
- **Discord** buttons copy a formatted summary (projected winners, tonight's predictions, or the award log) to paste into the guild server.

## Scoring

```
final = bid + attendance + tenure − prior wins − unexcused absences
```

Each piece can be toggled and weighted on the **Modifiers** tab — the live formula there always shows exactly what's being calculated.

## Practice data

`fake-tmb-export-p3-notes.csv` is a fake 28-player roster with bids already filled in — import it to click around safely before using real data.
