import { BUDGET, isTierName, REAGENTS, DEF_STATS, bossesFor, primaryBoss } from './constants.js'

// ── Score engine ──
export function scoreParts(base, st, mod) {
  const p = { base: base };
  p.att = mod.att.on ? (st.attendance / 100) * mod.att.w : 0;
  p.ten = mod.ten.on ? (Math.min(st.tenure, 12) / 12) * mod.ten.w : 0;
  p.pass = mod.pass.on ? st.pass * mod.pass.w : 0;
  p.blp = mod.blp.on ? st.blp * mod.blp.w : 0;
  p.win = mod.win.on ? -(st.wins * mod.win.w) : 0;
  // triangular escalation: n strikes cost w·n(n+1)/2. mod.ua guarded — saved pre-ua modifier state may lack it
  const ua = mod.ua && mod.ua.on ? (st.ua || 0) : 0;
  p.ua = ua > 0 ? -(mod.ua.w * ua * (ua + 1) / 2) : 0;
  p.final = p.base + p.att + p.ten + p.pass + p.blp + p.win + p.ua;
  return p;
}
export const pairKey = (p, i) => p + "\0" + i;

// A wishlist note is a point bid only when it's a standalone number ("300", "300 pts") —
// prose notes must never be misread as points.
export const parseBidNote = n => { const m = String(n || "").trim().match(/^(\d{1,4})\s*(?:pts?|points?)?$/i); return m ? parseInt(m[1]) : null; };

export function compute(tmbRows, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcNames) {
  const lcSet = new Set(lcNames);
  const excluded = it => lcSet.has(it) ? "lc" : REAGENTS.has(it) ? "reagent" : (excludeTier && isTierName(it)) ? "tier" : null;
  const meta = {};              // player -> {cls}
  const alloc = {};             // player -> {item: points}
  const receivedTokens = new Set(); // player\0item obtained (TMB received)
  const crossed = new Set();    // player\0item wishlist rows crossed off
  const ensure = (p, cls) => { if (!meta[p]) meta[p] = { cls: cls || "" }; if (cls && !meta[p].cls) meta[p].cls = cls; if (!alloc[p]) alloc[p] = {}; };

  (tmbRows || []).forEach(r => {
    const p = (r.character_name || "").trim(); if (!p) return;
    ensure(p, r.character_class);
    const it = (r.item_name || "").trim(); if (!it) return;
    if (r.type === "received") { receivedTokens.add(pairKey(p, it)); return; }
    if (r.type === "wishlist" && (r.received_at || "").trim()) crossed.add(pairKey(p, it));
  });

  // Base points come from wishlist-item notes; players with no note-bids fall back to
  // sort_order-derived auto-allocation. Officer overrides layer on top of either.
  const tmbWish = {};  // player -> [{item,sort,bid}]
  (tmbRows || []).forEach(r => {
    if (r.type !== "wishlist") return;
    const p = (r.character_name || "").trim(); const it = (r.item_name || "").trim();
    if (!p || !it) return; if (crossed.has(pairKey(p, it))) return;
    (tmbWish[p] = tmbWish[p] || []).push({ item: it, sort: parseInt(r.sort_order) || 0, bid: parseBidNote(r.note) });
  });
  const budgetMode = {};
  Object.keys(tmbWish).forEach(p => {
    const noted = tmbWish[p].filter(x => x.bid !== null && x.bid > 0);
    if (noted.length) {
      budgetMode[p] = "notes";
      noted.forEach(x => { alloc[p][x.item] = (alloc[p][x.item] || 0) + x.bid; });
    } else {
      budgetMode[p] = "auto";
      const list = tmbWish[p].filter(x => !excluded(x.item));
      if (!list.length) return;
      const N = list.length; const wsum = list.reduce((a, _, i) => a + (N - i), 0) || 1;
      list.sort((a, b) => a.sort - b.sort);
      list.forEach((x, i) => { alloc[p][x.item] = Math.max(1, Math.round(BUDGET * (N - i) / wsum)); });
    }
    const ov = (ptsOverrides || {})[p];
    if (ov) Object.entries(ov).forEach(([it, v]) => { const n = +v || 0; if (n > 0) alloc[p][it] = n; else delete alloc[p][it]; });
  });

  // per-player budget audit (pre-award totals; excluded categories don't count toward the budget)
  const budgets = {};
  Object.keys(alloc).forEach(p => {
    const rows = Object.entries(alloc[p]).map(([it, pts]) => ({ item: it, pts, not: excluded(it) })).sort((a, b) => b.pts - a.pts);
    if (!rows.length) return;
    budgets[p] = { total: rows.filter(r => !r.not).reduce((a, r) => a + r.pts, 0), mode: budgetMode[p] || "auto", edited: !!((ptsOverrides || {})[p] && Object.keys(ptsOverrides[p]).length), items: rows };
  });

  const allPlayers = new Set([...Object.keys(meta), ...Object.keys(baseStats || {})]);
  allPlayers.forEach(p => ensure(p));
  const statOf = (p, dw, db) => { const b = baseStats[p] || DEF_STATS; return { attendance: +b.attendance || 0, tenure: +b.tenure || 0, pass: +b.pass || 0, wins: (+b.wins || 0) + (dw[p] || 0), blp: (+b.blp || 0) + (db[p] || 0), ua: +b.ua || 0 }; };

  // ── replay award log ──
  const work = {}; Object.keys(alloc).forEach(p => work[p] = { ...alloc[p] });
  const dw = {}, db = {}; const awardedPairs = new Set(); const recv = new Set([...receivedTokens, ...crossed]);
  const dropSet = new Set((drops || []).map(d => pairKey(d.player, d.item)));
  const contendersNow = (item) => { const out = []; Object.keys(work).forEach(p => { const pts = work[p][item]; if (!(pts > 0)) return; if (recv.has(pairKey(p, item))) return; if (awardedPairs.has(pairKey(p, item))) return; if (dropSet.has(pairKey(p, item))) return; out.push(p); }); return out; };
  const logView = [];
  (awardLog || []).forEach(a => {
    const item = a.item, winner = a.player;
    const cont = contendersNow(item);
    if (mod.blp.on) { cont.forEach(c => { if (c !== winner) db[c] = (db[c] || 0) + 1; }); }
    dw[winner] = (dw[winner] || 0) + 1;
    awardedPairs.add(pairKey(winner, item)); recv.add(pairKey(winner, item));
    // points spent on a won item are gone — no reallocation to remaining items
    const p = work[winner] ? work[winner][item] || 0 : 0;
    if (work[winner]) delete work[winner][item];
    logView.push({ ...a, spent: p });
  });

  // ── final per-item results ──
  const itemSet = new Set();
  Object.keys(work).forEach(p => Object.keys(work[p]).forEach(it => { if (work[p][it] > 0 && !excluded(it)) itemSet.add(it); }));
  const items = [];
  itemSet.forEach(item => {
    const cont = [];
    Object.keys(work).forEach(p => {
      const pts = work[p][item];
      if (!(pts > 0)) return;
      if (recv.has(pairKey(p, item))) return;
      if (awardedPairs.has(pairKey(p, item))) return;
      if (dropSet.has(pairKey(p, item))) return;
      const st = statOf(p, dw, db);
      const parts = scoreParts(pts, st, mod);
      cont.push({ player: p, cls: meta[p]?.cls || "", base: pts, st, parts, final: parts.final });
    });
    if (!cont.length) return;
    cont.sort((a, b) => b.final - a.final || a.player.localeCompare(b.player));
    const top = cont[0].final;
    const eps = 1e-6;
    const tied = cont.filter(c => Math.abs(c.final - top) < eps);
    let status;
    if (cont.length === 1) status = "UNCONTESTED";
    else if (tied.length > 1) status = "ROLL";
    else status = "CLEAR";
    const gap = cont.length > 1 ? cont[0].final - cont[1].final : cont[0].final;
    items.push({ item, bosses: bossesFor(item), boss: primaryBoss(item), contenders: cont, winner: cont[0].player, winnerCls: cont[0].cls, status, gap, tied: tied.map(t => t.player), count: cont.length });
  });
  items.sort((a, b) => ({ UNCONTESTED: 2, CLEAR: 1, ROLL: 0 }[a.status] - { UNCONTESTED: 2, CLEAR: 1, ROLL: 0 }[b.status]) || b.count - a.count || a.item.localeCompare(b.item));

  // ── player profiles ──
  const players = {};
  allPlayers.forEach(p => {
    const st = statOf(p, dw, db);
    const received = [...recv].filter(k => k.startsWith(p + "\0")).map(k => k.slice(p.length + 1));
    const wl = [];
    Object.keys(work[p] || {}).forEach(it => { if (!(work[p][it] > 0)) return; if (excluded(it)) return; if (recv.has(pairKey(p, it))) return; if (dropSet.has(pairKey(p, it))) return; const res = items.find(x => x.item === it); const parts = scoreParts(work[p][it], st, mod); wl.push({ item: it, base: work[p][it], parts, final: parts.final, isWinner: res && res.winner === p, winner: res ? res.winner : null, status: res ? res.status : null }); });
    wl.sort((a, b) => b.base - a.base);
    players[p] = { cls: meta[p]?.cls || "", st, received, wishlist: wl, inLineFor: items.filter(x => x.winner === p).length, contenderOn: wl.length };
  });

  const counts = { total: items.length, uncontested: items.filter(i => i.status === "UNCONTESTED").length, clear: items.filter(i => i.status === "CLEAR").length, roll: items.filter(i => i.status === "ROLL").length, contested: items.filter(i => i.count > 1).length };
  return { items, players, counts, meta, logView, budgets, allPlayers: [...allPlayers] };
}

// ── localStorage ──
export const LS = "nordoloot.v1";
// falls back to the pre-rename key so previously saved data migrates on first load
export const loadLS = () => { try { return JSON.parse(localStorage.getItem(LS) || localStorage.getItem("onslaught.v1") || "null") } catch (e) { return null } };
