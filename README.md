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
- Raiders enter their bid in the item's **Note** field on ThatsmyBIS — just the number (`100` or `100 pts`).
- Bids are **blind** — nobody sees anyone else's numbers.
- **Highest score wins.** Ties go to /roll.
- Tier tokens count like any other item — bid on the **token name** (e.g. "Helm of the Forgotten Vanquisher"). Listing your class set piece instead (e.g. "Skyshatter Helmet") also works: the app counts it as the token, and if both are listed only the highest single bid counts.
- BoP craftables (Swiftsteel, Dawnsteel, Swiftstrike, Living Earth, Swiftheal, Nimble Thought pieces) are biddable and show under a "Crafted (BoP)" source.
- The three BT trash rings (Band of Devastation, Blessed Band of Karabor, Ring of Ancient Knowledge) can be **listed twice** — each listing is its own bid and claim; winning one copy keeps the second bid in line.
- Loot Council items and crafting reagents take no note bids — don't spend points on them. The **first 3 waiting spots** on an LC shortlist are charged **100 points upfront** — being near the front of the line for a chase item costs points now, not just on receipt. Receiving keeps that same charge (no double dip), spots further back are free until the line moves, and leaving the line refunds. A Warglaive spot is for the pair — one entry per raider, charged 200 total (never list anyone twice). The officers trim the raider's remaining bids to fit.
- Items left without a bid split the raider's leftover points automatically (higher on the list = more). Raiders who enter no bids at all get automatic points across their whole list. Spend all 500 in notes and blank items get nothing.
- **Points are spent when you win.** Win an item and the points you bid on it are gone — they don't move to your other items.

## Officer workflow

1. Export the roster CSV from ThatsmyBIS.
2. Drop it onto the upload zone in the app.
3. Check the warning banner / **Budgets** tab — it flags anyone whose total isn't exactly 500 (under or over).
4. Message the raider, then fix their numbers right in the app with the **Adjust** button. No re-export needed — your edits are kept even when you import a fresh CSV later.
5. Keep attendance, tenure, and absence strikes up to date on the **Players** tab.
6. **Export** (top right) saves everything to a single file — use it as a backup before raid, or send it to another officer, who can **Import** it and see exactly what you see.
7. **Standings page** (raider-facing): regenerate with `node tools/standings.mjs <nordoloot-save.json> out.html`, feeding it the Export save file so stats, awards, LC lines, and officer edits are included (a raw TMB CSV works but uses defaults), then republish the artifact at the same URL.

## Raid night

- **Raid Night** tab: pick tonight's raid and step through boss by boss — only that boss's drops are shown.
- **Award** gives the item to the projected winner. On a tie, it asks you to pick the /roll winner. **Undo** is in the session log if you misclick.
- **Drop** removes one player's claim (they got the item outside raid) — doesn't count as a win, item stays live for everyone else.
- **LC Items** tab: manual shortlists for council items like the Skull and Warglaives.
- **Discord** buttons copy a formatted summary (projected winners, tonight's predictions, or the award log) to paste into the guild server.

## Scoring

```
final = bid + attendance + tenure + bad-luck protection − unexcused absences
```

Each piece can be toggled and weighted on the **Modifiers** tab — the live formula there always shows exactly what's being calculated.

Note on absences: marking out ahead of time avoids a strike, but it does not protect attendance — every missed raid lowers the attendance score, excused or not. Consistent absence costs points either way.

## Practice data

`fake-tmb-export-p3-notes.csv` is a fake 28-player roster with bids already filled in — import it to click around safely before using real data.
