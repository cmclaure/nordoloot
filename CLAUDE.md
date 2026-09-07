# Nordoloot — project knowledge

Client-side React/Vite loot app for the WoW TBC Classic guild **Nordolo** (Black Temple / Mount Hyjal phase, Aug–Nov 2026). Live and in nightly use. Christian (GitHub `cmclaure`, in-game officer "Spits") is the sole operator.

## Architecture
- `src/engine.js` — pure scoring engine. `compute(tmbRows, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems)` returns `{items, players, counts, logView, budgets, allPlayers}`. Importable from Node for audits/simulations (`node -e "import('./src/engine.js')..."` from repo root).
- `src/constants.js` — loot tables (BL, verified vs Wowhead TBC), tier-token maps (`TIER_TOKEN_PIECES` name+id→token, `TIER_TOKEN_IDS`), modifiers (`MOD_DEF`), budgets (`BUDGET` 500, `ALT_BUDGET` 200), LC charges (`LC_CHARGES`: Warglaive pair 200, else 100; `LC_UPFRONT` 1).
- `src/App.jsx` — all UI. State persists to localStorage key `nordoloot.v1` per-origin (file:// and localhost differ!).
- `tools/standings.mjs` — generates the standings HTML from a save JSON (or CSV with default stats).
- `tools/nordoloot-sheets.gs` — Apps Script the officer pastes into Google; repaints the sheet in app theme on every push.
- `addon/NordolootInGame/` — TBC addon: paste the app's "Addon" export into `/ndl`; LOOT_OPENED raid-warns `[item link] - Winner (points)`. Import format NDL2, `~`-delimited (WoW escapes `|` in editboxes — never use pipes in paste formats). `/ndl test [n]` fakes drops locally, `/ndl testlive` uses the real announce path.

## Ship workflow (every change)
edit → verify live at the preview (launch.json `nordoloot-dev-b`, port 5198; 5199 may be held by another session) → `npm run build` (dist/index.html is a self-contained single file he double-clicks; file:// blocks module scripts, hence vite-plugin-singlefile) → commit with rationale → `git pull` first, then push (he sometimes edits via GitHub web) → if raider-facing rules changed, republish artifacts and hand him a Discord block (no tables, no em dashes, ≤2000 chars, small example bids like 100).

Verification gotchas: drive imports via DataTransfer + dispatched `change` on the file input; React ignores synthetic MouseEvents — invoke `el[__reactProps$…].onClick()` directly; clear `nordoloot.v1` after testing; React state re-saves cleared localStorage, so clear **and reload**; HMR keeps state — hard-reload before judging constants changes.

## The loot system (settled rules — don't re-litigate unless Christian raises)
- 500-pt blind budget per raider per phase; bids = bare number in TMB wishlist notes (prose never parses → silent auto-fill; malformed notes like "100 (token)" don't parse either). Highest final score wins; exact ties /roll. Points burn on win (crossed-off noted bids stay counted as spent; spent subtracts before auto-fill leftover).
- Auto-fill: no notes at all → full rank-weighted AUTO (~budget, unchecked); partial noters' blanks absorb exact leftover.
- Modifiers: attendance ≤+20 (every miss counts, from join date, imported weekly from the Warcraft Logs attendance CSV via Players tab); tenure ≤+30 capped 4wk (counts after trial); UA strikes −25·n(n+1)/2; BLP **+10 per lost tied /roll only** (auto from award log; Wins/BLP columns are read-only).
- Tier: bid token name; a listed class set piece canonicalizes to its token (id-first matching), duplicates collapse to highest bid; TMB's "Warglaive (mainhand/offhand)" folds into the LC item.
- LC: no bids; front-of-line pays upfront (Skull 100, Warglaive pair 200 — one entry per raider), everyone behind pays on receipt; leaving the front refunds; receipt never double-charges.
- Double rings (Band of Devastation, Blessed Band of Karabor, Ring of Ancient Knowledge): list twice, separate bids/claims.
- Lists locked at first raid night (policy, not enforced in-app — an import-diff warning is a known wanted feature).
- Alts (guild-requested only): Alt checkbox on Players tab → 200 budget; person-level stats copied; main keeps claims and accrues attendance. Respec only if guild needs it: relist remaining (500 − spent) points, modifiers carry, officer reviews for sniping. Late lister = forced AUTO (rank order only). Removed players (left guild): Remove button, TMB rows ignored until restored, award history kept.
- Award modal lists all contenders (absent winner → award to next, claim preserved). Rolls must be awarded in-app (only source of BLP).

## Officer data loop
TMB export CSV → drop on app. After raid: TMB button (unarchived awards only, `character,date,itemID,note`) → TMB Assign Loot → Submit → **Archive** button (prevents duplicate re-uploads; archived awards stay in the ledger). Weekly: WCL attendance CSV → Players tab import (diacritic/case-insensitive matching; hand-fix mid-phase joiners and alt-runners). Google Sheets: "Sheets" button pushes themed tabs via Apps Script webhook (URL is secret; sheet shared view-only; published-to-web link hides all identities and auto-republishes). Save-file Export = backup + officer sharing + input to standings.mjs.

## Live surfaces
- Rules artifact: https://claude.ai/code/artifact/e2ae2280-1461-4518-946c-46b948d0ae8a (update by `url`; share links pin versions — re-pin after republishing).
- Standings artifact: https://claude.ai/code/artifact/0453f31b-5ebc-40c2-b54f-f6f622befb96 (largely superseded by the Sheets push).
- Tiebreaker proposal (officer review): https://claude.ai/code/artifact/89d7f835-77b9-4c9e-9a2e-1b11e4c63ff1

## Pending decisions / roadmap
- **Drought BLP + fewest-contested-wins tiebreak** — proposed, simulated (six 2-week seeds: drought halves the zero-loot list; tiebreak kills rolls; 1–5/54 drops shift, always toward the loot-less; ~45% of drops disenchant so drop RNG dominates "feeling behind"). Tracking design: raid nights = distinct award-log dates; per-night presence kept from the WCL import; reset on any award (LC receipts need a date stamp). Waiting on officer sign-off.
- Prorated budgets for mid-phase recruits (500 × weeks-remaining/12, floor ~250) — recommended, not yet adopted.
- Import bid-diff + unparseable-note warnings at import time — wanted, unbuilt.
- Raid schedule: BT Tuesdays (prog), Hyjal Thursdays. Test baselines: `fake-tmb-export-p3-notes.csv` → 59 items, 5 off-budget (Grimjaw 545, Frostbyte 460, Voidlord 450, Dotsmagee 610, Chainmend 425).
