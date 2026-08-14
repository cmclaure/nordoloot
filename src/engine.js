import { BUDGET, LC_CHARGE, DUP_OK, isTierName, REAGENTS, DEF_STATS, bossesFor, primaryBoss } from './constants.js'

// ── Score engine ──
export function scoreParts(base, st, mod) {
  const p = { base: base };
  p.att = mod.att.on ? (st.attendance / 100) * mod.att.w : 0;
  p.ten = mod.ten.on ? (Math.min(st.tenure, 4) / 4) * mod.ten.w : 0;
  p.blp = mod.blp.on ? st.blp * mod.blp.w : 0;
  // triangular escalation: n strikes cost w·n(n+1)/2. mod.ua guarded — saved pre-ua modifier state may lack it
  const ua = mod.ua && mod.ua.on ? (st.ua || 0) : 0;
  p.ua = ua > 0 ? -(mod.ua.w * ua * (ua + 1) / 2) : 0;
  p.final = p.base + p.att + p.ten + p.blp + p.ua;
  return p;
}
export const pairKey = (p, i) => p + "\0" + i;

// A wishlist note is a point bid only when it's a standalone number ("300", "300 pts") —
// prose notes must never be misread as points.
export const parseBidNote = n => { const m = String(n || "").trim().match(/^(\d{1,4})\s*(?:pts?|points?)?$/i); return m ? parseInt(m[1]) : null; };

export function compute(tmbRows, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems) {
  const lcSet = new Set((lcItems || []).map(l => l.name));
  const excluded = it => lcSet.has(it) ? "lc" : REAGENTS.has(it) ? "reagent" : (excludeTier && isTierName(it)) ? "tier" : null;
  // LC minus: receiving an LC item charges LC_CHARGE of the player's budget — waiting in line is free.
  // Charged per RECEIVED shortlist entry (each glaive counts separately).
  const lcCount = {}, lcListOf = {};
  (lcItems || []).forEach(l => (l.shortlist || []).forEach(s => { if (s.status !== "RECEIVED") return; const p = (s.player || "").trim(); if (!p) return; lcCount[p] = (lcCount[p] || 0) + 1; (lcListOf[p] = lcListOf[p] || []).push(l.name); }));
  const meta = {};              // player -> {cls}
  const alloc = {};             // player -> {item: active bid}
  const dupQ = {};              // pair -> [further bids] for DUP_OK items listed more than once
  const receivedTokens = new Set(); // player\0item obtained (TMB received)
  const crossed = new Set();    // player\0item wishlist rows crossed off
  const dupRecvN = {}, dupCrossN = {}; // per-pair receipt counts for DUP_OK items
  const ensure = (p, cls) => { if (!meta[p]) meta[p] = { cls: cls || "" }; if (cls && !meta[p].cls) meta[p].cls = cls; if (!alloc[p]) alloc[p] = {}; };

  (tmbRows || []).forEach(r => {
    const p = (r.character_name || "").trim(); if (!p) return;
    ensure(p, r.character_class);
    const it = (r.item_name || "").trim(); if (!it) return;
    const pk = pairKey(p, it);
    if (r.type === "received") { if (DUP_OK.has(it)) dupRecvN[pk] = (dupRecvN[pk] || 0) + 1; else receivedTokens.add(pk); return; }
    if (r.type === "wishlist" && (r.received_at || "").trim()) { if (DUP_OK.has(it)) dupCrossN[pk] = (dupCrossN[pk] || 0) + 1; else crossed.add(pk); }
  });

  // Base points come from wishlist-item notes; players with no note-bids fall back to
  // sort_order-derived auto-allocation. Officer overrides layer on top of either.
  const tmbWish = {};  // player -> [{item,sort,bid}]  (crossed-off rows skipped per-row)
  (tmbRows || []).forEach(r => {
    if (r.type !== "wishlist") return;
    const p = (r.character_name || "").trim(); const it = (r.item_name || "").trim();
    if (!p || !it) return; if ((r.received_at || "").trim()) return;
    (tmbWish[p] = tmbWish[p] || []).push({ item: it, sort: parseInt(r.sort_order) || 0, bid: parseBidNote(r.note) });
  });
  const addClaim = (p, it, v) => {
    if (DUP_OK.has(it) && alloc[p][it] !== undefined) (dupQ[pairKey(p, it)] = dupQ[pairKey(p, it)] || []).push(v);
    else if (DUP_OK.has(it)) alloc[p][it] = v;
    else alloc[p][it] = (alloc[p][it] || 0) + v;
  };
  const budgetMode = {};
  Object.keys(tmbWish).forEach(p => {
    const noted = tmbWish[p].filter(x => x.bid !== null && x.bid > 0);
    if (noted.length) {
      budgetMode[p] = "notes";
      noted.forEach(x => addClaim(p, x.item, x.bid));
    } else {
      budgetMode[p] = "auto";
      const list = tmbWish[p].filter(x => !excluded(x.item));
      if (!list.length) return;
      const N = list.length; const wsum = list.reduce((a, _, i) => a + (N - i), 0) || 1;
      const budgetFor = Math.max(0, BUDGET - (lcCount[p] || 0) * LC_CHARGE);
      list.sort((a, b) => a.sort - b.sort);
      list.forEach((x, i) => addClaim(p, x.item, Math.max(1, Math.round(budgetFor * (N - i) / wsum))));
    }
    const ov = (ptsOverrides || {})[p];
    if (ov) Object.entries(ov).forEach(([it, v]) => { const n = +v || 0; if (n > 0) alloc[p][it] = n; else { delete alloc[p][it]; delete dupQ[pairKey(p, it)]; } });
  });
  // biggest bid is the active claim; the rest queue behind it
  Object.keys(dupQ).forEach(pk => {
    const [p, it] = pk.split("\0");
    if (!alloc[p] || alloc[p][it] === undefined) { delete dupQ[pk]; return; }
    const chain = [alloc[p][it], ...dupQ[pk]].sort((a, b) => b - a);
    alloc[p][it] = chain[0]; dupQ[pk] = chain.slice(1);
  });
  // copies already obtained (TMB received rows beyond crossed-off wishlist rows) consume claims, top first
  Object.keys(dupRecvN).forEach(pk => {
    const extra = Math.max(0, (dupRecvN[pk] || 0) - (dupCrossN[pk] || 0));
    const [p, it] = pk.split("\0");
    for (let i = 0; i < extra; i++) {
      if (!alloc[p] || alloc[p][it] === undefined) break;
      const q = dupQ[pk];
      if (q && q.length) alloc[p][it] = q.shift(); else delete alloc[p][it];
    }
  });

  // per-player budget audit (pre-award totals; excluded categories don't count toward the budget,
  // but LC shortlist charges do)
  const budgets = {};
  Object.keys(alloc).forEach(p => {
    const rows = Object.entries(alloc[p]).map(([it, pts]) => ({ item: it, pts, not: excluded(it) }));
    Object.entries(dupQ).forEach(([pk, q]) => { if (!pk.startsWith(p + "\0")) return; const it = pk.slice(p.length + 1); q.forEach((pts, i) => rows.push({ item: it, pts, not: excluded(it), copy: i + 2 })); });
    rows.sort((a, b) => b.pts - a.pts);
    const charge = (lcCount[p] || 0) * LC_CHARGE;
    if (!rows.length && !charge) return;
    budgets[p] = { total: rows.filter(r => !r.not).reduce((a, r) => a + r.pts, 0) + charge, lcCharge: charge, lcList: lcListOf[p] || [], mode: budgetMode[p] || "auto", edited: !!((ptsOverrides || {})[p] && Object.keys(ptsOverrides[p]).length), items: rows };
  });

  const allPlayers = new Set([...Object.keys(meta), ...Object.keys(baseStats || {})]);
  allPlayers.forEach(p => ensure(p));
  const statOf = (p, dw, db) => { const b = baseStats[p] || DEF_STATS; return { attendance: +b.attendance || 0, tenure: +b.tenure || 0, wins: (+b.wins || 0) + (dw[p] || 0), blp: (+b.blp || 0) + (db[p] || 0), ua: +b.ua || 0 }; };

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
    // points spent on a won item are gone — no reallocation to remaining items
    const spent = work[winner] ? work[winner][item] || 0 : 0;
    const pk = pairKey(winner, item);
    const q = dupQ[pk];
    if (q && q.length) {
      // second copy of a non-unique ring: the next bid takes over, player stays in line
      if (work[winner]) work[winner][item] = q.shift();
    } else {
      awardedPairs.add(pk); recv.add(pk);
      if (work[winner]) delete work[winner][item];
    }
    logView.push({ ...a, spent });
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
  const recvDisplay = new Set(recv);
  Object.keys(dupRecvN).forEach(pk => { if (dupRecvN[pk] > 0) recvDisplay.add(pk); });
  const players = {};
  allPlayers.forEach(p => {
    const st = statOf(p, dw, db);
    const received = [...recvDisplay].filter(k => k.startsWith(p + "\0")).map(k => k.slice(p.length + 1));
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
