// Generates the raider-facing standings page from a Nordoloot save file (preferred —
// carries stats, awards, LC lines, officer edits) or a raw TMB CSV export (defaults only).
//
//   node tools/standings.mjs <nordoloot-save.json | tmb-export.csv> <out.html>
//
// The page runs the same engine as the app, so its numbers always match.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import Papa from 'papaparse';
import { compute } from '../src/engine.js';
import { RAID_BOSSES, BT, MH, CRAFTED, MOD_DEF, DEFAULT_LC, LC_UPFRONT, lcChargeFor, primaryBoss } from '../src/constants.js';

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error("usage: node tools/standings.mjs <save.json|export.csv> <out.html>"); process.exit(1); }

let state;
if (inPath.toLowerCase().endsWith(".json")) {
  state = JSON.parse(readFileSync(inPath, "utf8"));
  if (state.app !== "nordoloot") { console.error("not a nordoloot save file"); process.exit(1); }
} else {
  const rows = Papa.parse(readFileSync(inPath, "utf8"), { header: true, skipEmptyLines: true }).data;
  state = { tmbRows: rows, savedAt: statSync(inPath).mtime.toISOString() };
  console.warn("CSV input: default stats, no awards/LC lines/officer edits — prefer a save file for the real page.");
}

const mod = state.mod || MOD_DEF;
const lcItems = state.lcItems || DEFAULT_LC();
const data = compute(state.tmbRows || [], state.ptsOverrides || {}, state.baseStats || {}, state.awardLog || [], state.drops || [], mod, state.excludeTier || false, lcItems);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stamp = new Date(state.savedAt || Date.now()).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// group items by primary boss, in raid order; anything else (crafted) trails
const bossOrder = [...RAID_BOSSES[BT], ...RAID_BOSSES[MH], CRAFTED];
const groups = new Map();
data.items.forEach(i => { const b = primaryBoss(i.item) || "Other"; if (!groups.has(b)) groups.set(b, []); groups.get(b).push(i); });
const orderedGroups = [...bossOrder.filter(b => groups.has(b)), ...[...groups.keys()].filter(b => !bossOrder.includes(b))];

const itemLine = i => {
  const others = i.status === "ROLL" ? i.contenders.filter(c => !i.tied.includes(c.player)) : i.contenders.slice(1);
  const vs = others.length ? `<span class="vs">vs ${others.map(c => `${esc(c.player)} ${c.final.toFixed(0)}`).join(" · ")}</span>` : i.contenders.length > 1 ? "" : `<span class="vs solo">uncontested</span>`;
  const head = i.status === "ROLL"
    ? `<span class="win roll">/roll between ${i.tied.map(esc).join(", ")}</span> <span class="pts">${i.contenders[0].final.toFixed(0)}</span>`
    : `<span class="win">${esc(i.winner)}</span> <span class="pts">${i.contenders[0].final.toFixed(0)}</span>`;
  return `<div class="row"><span class="item">${esc(i.item)}</span><span class="res">${head} ${vs}</span></div>`;
};

const awardsHtml = (data.logView || []).length ? `
  <h2>Loot awarded so far</h2>
  ${data.logView.slice().reverse().map(a => `<div class="row"><span class="item">${esc(a.player)} <span class="dim">←</span> ${esc(a.item)}${a.wasRoll ? ' <span class="tag">won /roll</span>' : ""}</span><span class="res dim">${esc(a.ts || "")}${a.spent > 0 ? ` · ${a.spent.toFixed(0)} pts spent` : ""}</span></div>`).join("\n")}` : "";

const lcHtml = lcItems.some(l => (l.shortlist || []).length) ? `
  <h2>Loot Council lines</h2>
  ${lcItems.filter(l => (l.shortlist || []).length).map(l => {
    const amt = lcChargeFor(l.name); let w = 0;
    return `<div class="lc"><div class="lc-name">${esc(l.name)}</div>${l.shortlist.map((s, i) => {
      const recv = s.status === "RECEIVED";
      const charged = recv || (w++ < LC_UPFRONT);
      return `<div class="row"><span class="item"><span class="pos">${i + 1}</span> ${esc(s.player)}${recv ? ' <span class="tag">received</span>' : s.status ? ` <span class="tag dim">${esc(s.status.toLowerCase())}</span>` : ""}</span><span class="res dim">${charged ? `−${amt} pts` : "free (waiting)"}</span></div>`;
    }).join("\n")}</div>`;
  }).join("\n")}` : "";

const html = `<title>Nordolo Standings</title>
<style>
  :root {
    --bg: #111214; --card: #1a1b1e; --line: #2b2c30; --line-soft: #222327;
    --text: #e6e4de; --muted: #96938d; --faint: #6b6963; --gold: #fbbf24; --green: #4ade80;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: "Segoe UI", -apple-system, "Helvetica Neue", sans-serif; font-size: 15px; line-height: 1.5; padding: 48px 20px 64px; }
  .page { max-width: 760px; margin: 0 auto; }
  header { margin-bottom: 30px; }
  .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  h1 { font-size: 30px; font-weight: 700; letter-spacing: -.01em; }
  .sub { color: var(--muted); margin-top: 6px; font-size: 14px; }
  h2 { font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 34px 0 10px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
  h3 { font-size: 13px; font-weight: 600; color: var(--gold); margin: 20px 0 4px; }
  .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 1px solid var(--line-soft); flex-wrap: wrap; }
  .item { flex: 1 1 260px; font-size: 14px; min-width: 0; }
  .res { flex: 1 1 300px; font-size: 13.5px; }
  .win { font-weight: 600; }
  .win.roll { color: var(--gold); }
  .pts { color: var(--gold); font-weight: 600; font-variant-numeric: tabular-nums; }
  .vs { color: var(--faint); font-size: 12.5px; margin-left: 8px; }
  .vs.solo { font-style: italic; }
  .dim { color: var(--faint); font-size: 12.5px; }
  .tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .06em; padding: 1px 7px; border-radius: 3px; color: var(--green); background: #17251a; border: 1px solid #29452e; vertical-align: 1px; }
  .tag.dim { color: var(--muted); background: #1c1d20; border-color: var(--line); }
  .pos { display: inline-block; width: 18px; color: var(--faint); font-size: 12px; }
  .lc { margin-bottom: 14px; }
  .lc-name { font-weight: 600; color: var(--gold); font-size: 13.5px; margin: 12px 0 2px; }
  footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid var(--line); color: var(--faint); font-size: 12.5px; }
</style>
<div class="page">
  <header>
    <div class="eyebrow">Nordolo · Black Temple &amp; Mount Hyjal</div>
    <h1>Loot standings</h1>
    <div class="sub">Updated ${esc(stamp)}</div>
  </header>
  ${awardsHtml}
  ${lcHtml}
  <h2>Projected winners by boss</h2>
  ${orderedGroups.map(b => `<h3>${esc(b)}</h3>\n${groups.get(b).map(itemLine).join("\n")}`).join("\n")}
</div>
`;
writeFileSync(outPath, html);
console.log(`standings written: ${outPath} (${data.items.length} items, ${(data.logView || []).length} awards)`);
