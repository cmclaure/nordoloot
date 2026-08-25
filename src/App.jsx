import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { CC, BT, MH, RAID_BOSSES, CRAFTED, BUDGET, LC_CHARGE, LC_UPFRONT, MOD_DEF, DEF_STATS, DEFAULT_LC } from './constants.js'
import { compute, LS, loadLS } from './engine.js'

// merge a saved modifier object over MOD_DEF so keys added later pick up defaults
const mergeMod = sv => { const m = {}; Object.keys(MOD_DEF).forEach(k => { const s = sv && sv[k]; m[k] = s ? { ...MOD_DEF[k], on: s.on, w: s.w } : { ...MOD_DEF[k] }; }); return m; };

export default function App() {
  const saved = useRef(loadLS());
  const s0 = saved.current || {};
  const [tmbRows, setTmb] = useState(s0.tmbRows || null);
  const [tmbName, setTmbName] = useState(s0.tmbName || "");
  const [ptsOverrides, setPtsOverrides] = useState(s0.ptsOverrides || {});  // player -> {item: pts} officer edits, survive re-imports
  const [baseStats, setBaseStats] = useState(s0.baseStats || {});
  const [awardLog, setAwardLog] = useState(s0.awardLog || []);
  const [drops, setDrops] = useState(s0.drops || []);
  const [mod, setMod] = useState(() => mergeMod(s0.mod));
  const [excludeTier, setExcludeTier] = useState(s0.excludeTier !== undefined ? s0.excludeTier : false);
  const [lcItems, setLcItems] = useState(s0.lcItems || DEFAULT_LC());

  const [view, setView] = useState(s0.view || "scores");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [boss, setBoss] = useState("all");
  const [detail, setDetail] = useState(null);
  const [award, setAward] = useState(null);   // {item obj, rollPick}
  const [profile, setProfile] = useState(null);
  const [discord, setDiscord] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dropTarget, setDropTarget] = useState(null); // item obj for drop-a-player modal
  const [drag, setDrag] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // raid night
  const [raid, setRaid] = useState(s0.raid || null);
  const [bossIdx, setBossIdx] = useState(s0.bossIdx || 0);
  // LC edit
  const [lcNew, setLcNew] = useState("");
  const [lcAddP, setLcAddP] = useState(null);
  const [lcNewP, setLcNewP] = useState("");
  // budgets audit view
  const [bgExpand, setBgExpand] = useState(null);  // player whose item list is open
  // save-file import: {data} awaiting confirm, or {error}
  const [pendingImport, setPendingImport] = useState(null);

  const data = useMemo(() => tmbRows ? compute(tmbRows, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems) : null,
    [tmbRows, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems]);

  // init/merge player stats when data players change
  useEffect(() => { if (!data) return; setBaseStats(prev => { let ch = false; const n = { ...prev }; data.allPlayers.forEach(p => { if (!n[p]) { n[p] = { ...DEF_STATS }; ch = true } }); return ch ? n : prev; }); }, [data]);

  // persist
  useEffect(() => {
    const payload = { tmbRows, tmbName, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems, view, raid, bossIdx };
    try { localStorage.setItem(LS, JSON.stringify(payload)); setSavedFlash(true); const t = setTimeout(() => setSavedFlash(false), 900); return () => clearTimeout(t); } catch (e) { }
  }, [tmbRows, tmbName, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems, view, raid, bossIdx]);

  const importCSV = useCallback((file) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = e => {
      const res = Papa.parse(e.target.result, { header: true, skipEmptyLines: true });
      setTmb(res.data); setTmbName(file.name);
    };
    rd.readAsText(file);
  }, []);

  // ── save file export/import ──
  const exportState = useCallback(() => {
    const payload = { app: "nordoloot", version: 1, savedAt: new Date().toISOString(), tmbRows, tmbName, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems, view, raid, bossIdx };
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nordoloot-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  }, [tmbRows, tmbName, ptsOverrides, baseStats, awardLog, drops, mod, excludeTier, lcItems, view, raid, bossIdx]);

  const readSaveFile = useCallback((file) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = e => {
      try {
        const o = JSON.parse(e.target.result);
        if (!o || typeof o !== "object" || o.app !== "nordoloot") throw new Error();
        setPendingImport({ data: o });
      } catch { setPendingImport({ error: file.name + " isn't a Nordoloot save file." }); }
    };
    rd.readAsText(file);
  }, []);

  const applyImport = useCallback(() => {
    const o = pendingImport && pendingImport.data; if (!o) return;
    setTmb(o.tmbRows || null); setTmbName(o.tmbName || "");
    setPtsOverrides(o.ptsOverrides || {}); setBaseStats(o.baseStats || {});
    setAwardLog(o.awardLog || []); setDrops(o.drops || []);
    setMod(mergeMod(o.mod)); setExcludeTier(o.excludeTier !== undefined ? o.excludeTier : false);
    setLcItems(o.lcItems || DEFAULT_LC());
    setPendingImport(null); setView(o.view || "scores"); setRaid(o.raid || null); setBossIdx(o.bossIdx || 0); setBgExpand(null); setProfile(null); setDetail(null);
  }, [pendingImport]);

  const setStat = useCallback((p, k, v) => setBaseStats(prev => {
    let n = v === "" ? 0 : (parseFloat(v) || 0);
    n = Math.max(0, n);
    if (k === "tenure") n = Math.min(4, n);       // weeks — score caps at 4, so the input does too
    if (k === "attendance") n = Math.min(100, n); // it's a %
    return { ...prev, [p]: { ...(prev[p] || DEF_STATS), [k]: n } };
  }), []);
  const setOverride = useCallback((p, item, v) => setPtsOverrides(prev => ({ ...prev, [p]: { ...(prev[p] || {}), [item]: v === "" ? 0 : Math.max(0, parseInt(v) || 0) } })), []);
  const clearOverrides = useCallback(p => setPtsOverrides(prev => { const n = { ...prev }; delete n[p]; return n; }), []);

  const doAward = useCallback((item, pick) => {
    const winner = item.status === "ROLL" ? pick : item.winner;
    if (!winner) return;
    const cls = item.contenders.find(c => c.player === winner)?.cls || "";
    setAwardLog(prev => [...prev, { item: item.item, player: winner, cls, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), wasRoll: item.status === "ROLL", tied: item.status === "ROLL" ? item.tied : undefined }]);
    setAward(null); setDetail(null);
  }, []);
  const undoAward = useCallback(i => setAwardLog(prev => prev.filter((_, j) => j !== i)), []);
  const doDrop = useCallback((player, item) => { setDrops(prev => [...prev, { player, item, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]); setDropTarget(null); }, []);
  const restoreDrop = useCallback(i => setDrops(prev => prev.filter((_, j) => j !== i)), []);

  const reset = useCallback(() => { localStorage.removeItem(LS); setTmb(null); setTmbName(""); setPtsOverrides({}); setBaseStats({}); setAwardLog([]); setDrops([]); setMod(MOD_DEF); setExcludeTier(false); setLcItems(DEFAULT_LC()); setConfirmReset(false); setView("scores"); setRaid(null); setBossIdx(0); setBgExpand(null); }, []);

  // filtered items
  const filtered = useMemo(() => {
    if (!data) return []; let it = data.items;
    if (filter === "contested") it = it.filter(x => x.count > 1);
    else if (filter !== "all") it = it.filter(x => x.status === filter.toUpperCase());
    if (boss !== "all") it = it.filter(x => x.bosses.includes(boss));
    if (search) { const q = search.toLowerCase(); it = it.filter(x => x.item.toLowerCase().includes(q) || x.contenders.some(c => c.player.toLowerCase().includes(q))); }
    return it;
  }, [data, filter, search, boss]);

  const activeBosses = useMemo(() => { if (!data) return {}; const set = new Set(data.items.flatMap(i => i.bosses)); const out = {}; Object.entries(RAID_BOSSES).forEach(([r, bs]) => { const f = bs.filter(b => set.has(b)); if (f.length) out[r] = f; }); if (set.has(CRAFTED)) out[CRAFTED] = [CRAFTED]; return out; }, [data]);

  // players whose submitted (note-based or officer-edited) budget isn't exactly 500 — auto players aren't flagged
  const offBudget = useMemo(() => { if (!data) return []; return Object.entries(data.budgets).filter(([, b]) => (b.mode === "notes" || b.edited) && b.total !== BUDGET).map(([p, b]) => ({ player: p, ...b })); }, [data]);

  const raidBossList = useMemo(() => { if (!raid) return []; if (raid === "Both") return [...RAID_BOSSES[BT], ...RAID_BOSSES[MH]]; return RAID_BOSSES[raid]; }, [raid]);
  const curBoss = raidBossList[bossIdx];
  const bossItems = useMemo(() => { if (!data || !curBoss) return []; return data.items.filter(i => i.bosses.includes(curBoss)); }, [data, curBoss]);

  // discord
  const genDiscord = useCallback((type) => {
    if (!data) return; let t = "";
    if (type === "scores") { t = "**Nordoloot — Projected Winners**\n\n"; data.items.forEach(i => { t += `${i.item} → ${i.winner} (${i.contenders[0].final.toFixed(0)}) [${i.status}]\n`; }); }
    else if (type === "tonight") { t = `**Tonight's Raid — ${raid}**\n\n`; raidBossList.forEach(b => { const its = data.items.filter(i => i.bosses.includes(b)); if (!its.length) return; t += `__${b}__\n`; its.forEach(i => { t += `${i.item} → ${i.winner} (${i.contenders[0].final.toFixed(0)}) [${i.status}]\n`; }); t += "\n"; }); }
    else if (type === "awarded") { t = "**Loot Awarded This Session**\n\n"; awardLog.forEach(a => { t += `${a.player} ← ${a.item}${a.wasRoll ? " (roll)" : ""} ${a.ts}\n`; }); }
    setDiscord(t);
  }, [data, awardLog, raid, raidBossList]);
  const copyDiscord = useCallback(() => { navigator.clipboard.writeText(discord); }, [discord]);

  // LC ops
  const lcAddItem = () => { if (!lcNew.trim()) return; setLcItems(p => [...p, { name: lcNew.trim(), shortlist: [] }]); setLcNew(""); };
  const lcRemove = i => setLcItems(p => p.filter((_, j) => j !== i));
  const lcAddPlayer = li => { if (!lcNewP.trim()) return; setLcItems(p => { const n = [...p]; n[li] = { ...n[li], shortlist: [...n[li].shortlist, { player: lcNewP.trim(), status: "" }] }; return n }); setLcNewP(""); setLcAddP(null); };
  const lcRemP = (li, si) => setLcItems(p => { const n = [...p]; n[li] = { ...n[li], shortlist: n[li].shortlist.filter((_, j) => j !== si) }; return n });
  const lcMove = (li, si, d) => setLcItems(p => { const n = [...p]; const sl = [...n[li].shortlist]; const ni = si + d; if (ni < 0 || ni >= sl.length) return p; [sl[si], sl[ni]] = [sl[ni], sl[si]]; n[li] = { ...n[li], shortlist: sl }; return n });
  const lcCycle = (li, si) => { const S = ["", "NEXT", "IN LINE", "RECEIVED"]; setLcItems(p => { const n = [...p]; const sl = [...n[li].shortlist]; const cur = S.indexOf(sl[si].status); sl[si] = { ...sl[si], status: S[(cur + 1) % S.length] }; n[li] = { ...n[li], shortlist: sl }; return n }); };

  const PN = ({ name, cls, click = true }) => <span className={click ? "plink" : ""} onClick={click ? () => setProfile(name) : undefined} style={{ color: CC[cls] || "#ccc", cursor: click ? "pointer" : "default" }}>{name}</span>;

  const ScoreBars = ({ item, n = 3 }) => {
    const max = item.contenders[0].final || 1; return (
      <div className="bar-wrap">{item.contenders.slice(0, n).map((c, i) => (
        <div className="bar-row" key={c.player}>
          <span className="bar-name"><PN name={c.player} cls={c.cls} /></span>
          <div className="bar-track"><div className="bar-fill" style={{ width: Math.max(3, (c.final / max) * 100) + "%", background: CC[c.cls] || "#666" }} /></div>
          <span className="bar-val">{c.final.toFixed(0)}</span>
        </div>))}
        {item.count > n && <div className="sub" style={{ textAlign: "right" }}>+{item.count - n} more</div>}
      </div>);
  };

  const StatusTag = ({ s }) => <span className={"tag tag-" + (s === "UNCONTESTED" ? "u" : s === "ROLL" ? "r" : "c")}>{s}</span>;

  const ItemRow = ({ item, showBoss = true, showActions = true }) => (
    <tr>
      <td style={{ fontWeight: 600, maxWidth: 210 }}>{item.item}{item.count > 1 && <span className="dim" style={{ fontSize: 10, marginLeft: 5 }}>{item.count}</span>}
        {showBoss && <div className="sub">{item.bosses.join(" · ")}</div>}
      </td>
      <td><StatusTag s={item.status} /></td>
      <td style={{ minWidth: 190 }}><ScoreBars item={item} /></td>
      <td className="gold" style={{ fontWeight: 600 }}>{item.status === "ROLL" ? "TIE" : "+" + item.gap.toFixed(0)}</td>
      {showActions && <td style={{ whiteSpace: "nowrap" }}>
        <button className="btn-award" onClick={() => item.status === "ROLL" ? setAward({ item, pick: item.tied[0] }) : doAward(item)}>Award</button>{" "}
        <button className="btn-detail" onClick={() => setDetail(item)}>Details</button>{" "}
        <button className="btn-drop" onClick={() => setDropTarget(item)} title="Player got it outside raid">Drop</button>
      </td>}
    </tr>);

  const hasData = !!data;
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 12px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div>
          <h1>⚔️ Nordoloot <span style={{ color: "#555", fontWeight: 400, fontSize: 13 }}>· Nordolo</span></h1>
          <div className="sub">500-point budget system · Black Temple &amp; Mount Hyjal</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={"saved" + (savedFlash ? " pending" : "")}>{savedFlash ? "● Saving…" : "● Saved"}</span>
          <label className={"upload-zone" + (drag === "tmb" ? " drag" : "") + (tmbName ? " loaded" : "")} onDragOver={e => { e.preventDefault(); setDrag("tmb") }} onDragLeave={() => setDrag(null)} onDrop={e => { e.preventDefault(); setDrag(null); importCSV(e.dataTransfer.files[0]) }} style={{ cursor: "pointer" }}>
            <span style={{ color: tmbName ? "#4ade80" : "#fbbf24", fontWeight: 500, fontSize: 11 }}>{tmbName ? "✓ " + tmbName : "Drop TMB CSV"}</span>
            <input type="file" accept=".csv" onChange={e => importCSV(e.target.files[0])} style={{ display: "none" }} />
          </label>
          {hasData && <button className="btn" onClick={exportState} style={{ color: "#4ade80", borderColor: "#2d4a2d" }} title="Save everything to a file — backup or share with another officer">Export</button>}
          <label className="btn" style={{ color: "#3FC7EB", borderColor: "#234055", cursor: "pointer" }} title="Load a Nordoloot save file">Import
            <input type="file" accept=".json,application/json" onChange={e => { readSaveFile(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
          </label>
          <button className="btn" onClick={() => setConfirmReset(true)} style={{ color: "#f87171", borderColor: "#4a2d2d" }}>Reset</button>
        </div>
      </div>

      {!hasData ? (
        <div style={{ textAlign: "center", padding: "70px 0", color: "#444" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚔️</div>
          <div style={{ fontSize: 14, color: "#666" }}>Import a TMB export to begin.</div>
          <div className="sub" style={{ marginTop: 8 }}>Raiders put their point bid (just the number, e.g. <code>100</code>) in each wishlist item's note on ThatsmyBIS. Un-noted items are auto-filled from leftover points; fully note-less players get auto points on everything. Everything saves to your browser automatically.</div>
        </div>
      ) : (<>
        {/* session logs */}
        {awardLog.length > 0 && (
          <div className="log">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="gold" style={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Awarded ({awardLog.length})</span>
              <button className="btn btn-sm" onClick={() => genDiscord("awarded")} style={{ color: "#4ade80" }}>Export</button>
            </div>
            {data.logView.map((a, i) => (<div className="log-row" key={i}>
              <span><PN name={a.player} cls={a.cls} /> <span className="dim">←</span> {a.item} {a.wasRoll && <span className="tag tag-r" style={{ marginLeft: 4 }}>ROLL</span>} <span className="dim" style={{ fontSize: 9, marginLeft: 4 }}>{a.ts}{a.spent > 0 ? ` · ${a.spent.toFixed(0)}pts spent` : ""}</span></span>
              <button className="btn-undo" onClick={() => undoAward(i)}>Undo</button>
            </div>))}
          </div>)}
        {drops.length > 0 && (
          <div className="log" style={{ borderColor: "#4a3d2d" }}>
            <span className="gold" style={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Dropped claims ({drops.length})</span>
            {drops.map((d, i) => (<div className="log-row" key={i}>
              <span><PN name={d.player} cls={data.players[d.player]?.cls} /> <span className="dim">—</span> {d.item} <span className="dim" style={{ fontSize: 9 }}>(got outside raid · {d.ts})</span></span>
              <button className="btn-award" onClick={() => restoreDrop(i)}>Restore</button>
            </div>))}
          </div>)}

        {/* summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 12 }}>
          {[["Items", data.counts.total, "#e0e0e0", "#1a1a1a"], ["Contested", data.counts.contested, "#fbbf24", "#2e2a1a"], ["Clear", data.counts.clear, "#4ade80", "#1a2e1a"], ["Roll", data.counts.roll, "#f87171", "#2e1a1a"], ["Uncontested", data.counts.uncontested, "#3FC7EB", "#182430"]].map(([l, c, co, bg]) => (
            <div key={l} style={{ background: bg, borderRadius: 4, padding: 8, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700, color: co }}>{c}</div><div className="sub">{l}</div></div>))}
        </div>

        {/* off-budget warning */}
        {offBudget.length > 0 && (
          <div className="log" style={{ borderColor: "#4a3d1a", cursor: "pointer" }} onClick={() => setView("budget")} title="Open Budgets tab">
            <span className="gold" style={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>⚠ {offBudget.length} raider{offBudget.length > 1 ? "s" : ""} off-budget: </span>
            <span style={{ fontSize: 11 }}>{offBudget.map((b, i) => (
              <span key={b.player}>{i > 0 && <span className="dim"> · </span>}<PN name={b.player} cls={data.players[b.player]?.cls} click={false} /> <span className={b.total > BUDGET ? "red" : "gold"}>{b.total}</span></span>))}
            </span>
            <span className="sub" style={{ marginLeft: 8 }}>click to review in Budgets</span>
          </div>)}

        {/* nav */}
        <div style={{ display: "flex", background: "#1a1a1a", borderRadius: 4, overflow: "hidden", border: "1px solid #2a2a2a", marginBottom: 12, flexWrap: "wrap" }}>
          {[["scores", "Scores"], ["raid", "Raid Night"], ["contested", "Contested"], ["lc", "LC Items"], ["players", "Players"], ["budget", "Budgets"], ["mods", "Modifiers"]].map(([v, l]) => (
            <button key={v} className="view-btn" onClick={() => setView(v)} style={{ background: view === v ? "#2a2a2a" : "transparent", color: view === v ? "#fbbf24" : "#555" }}>{l}</button>))}
        </div>

        {/* ══ SCORES ══ */}
        {view === "scores" && (<>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            {[["all", "All"], ["clear", "Clear"], ["roll", "Roll"], ["contested", "Contested 2+"], ["uncontested", "Uncontested"]].map(([f, l]) => (
              <button key={f} className={"btn" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>{l}</button>))}
            <select value={boss} onChange={e => setBoss(e.target.value)} style={{ color: boss === "all" ? "#888" : "#fbbf24" }}>
              <option value="all">All bosses</option>
              {Object.entries(activeBosses).map(([r, bs]) => <optgroup key={r} label={r}>{bs.map(b => <option key={b} value={b}>{b}</option>)}</optgroup>)}
            </select>
            <input type="text" placeholder="Search item or player…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: "auto", padding: "3px 8px", fontSize: 11, width: 190 }} />
            <button className="btn btn-sm" onClick={() => genDiscord("scores")} style={{ color: "#4ade80" }}>Discord</button>
          </div>
          <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            <table><thead><tr><th>Item</th><th>Status</th><th>Top contenders</th><th>Gap</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(it => <ItemRow key={it.item} item={it} />)}</tbody></table>
            {!filtered.length && <div style={{ textAlign: "center", padding: 30, color: "#444" }}>No items match.</div>}
          </div>
        </>)}

        {/* ══ RAID NIGHT ══ */}
        {view === "raid" && (<>
          {!raid ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p className="dim" style={{ marginBottom: 16 }}>Select tonight's raid:</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {[BT, MH, "Both"].map(r => <button key={r} className="btn-raid" onClick={() => { setRaid(r); setBossIdx(0) }}>{r}</button>)}
              </div>
            </div>
          ) : (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button className="btn-nav" disabled={bossIdx === 0} onClick={() => setBossIdx(i => i - 1)}>← Prev</button>
                <span className="gold" style={{ fontWeight: 600, fontSize: 14, minWidth: 210, textAlign: "center" }}>{curBoss} <span className="dim" style={{ fontSize: 11 }}>({bossIdx + 1}/{raidBossList.length})</span></span>
                <button className="btn-nav" disabled={bossIdx >= raidBossList.length - 1} onClick={() => setBossIdx(i => i + 1)}>Next →</button>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm" onClick={() => genDiscord("tonight")} style={{ color: "#4ade80" }}>Export tonight</button>
                <button className="btn btn-sm" onClick={() => { setRaid(null); setBossIdx(0) }} style={{ color: "#f87171" }}>Exit</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
              {raidBossList.map((b, i) => <div key={b} title={b} onClick={() => setBossIdx(i)} style={{ flex: 1, height: 5, borderRadius: 2, cursor: "pointer", background: i < bossIdx ? "#4ade80" : i === bossIdx ? "#fbbf24" : "#2a2a2a" }} />)}
            </div>
            {bossItems.length ? (
              <div style={{ overflowX: "auto" }}><table><thead><tr><th>Item</th><th>Status</th><th>Top contenders</th><th>Gap</th><th>Actions</th></tr></thead>
                <tbody>{bossItems.map(it => <ItemRow key={it.item} item={it} showBoss={false} />)}</tbody></table></div>
            ) : <div style={{ textAlign: "center", padding: 30, color: "#444" }}>No wishlisted items drop from {curBoss} — open roll.</div>}
          </>)}
        </>)}

        {/* ══ CONTESTED ══ */}
        {view === "contested" && (
          <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            <table><thead><tr><th>Item</th><th>Status</th><th>Contenders</th><th>Gap</th><th>Actions</th></tr></thead>
              <tbody>{data.items.filter(i => i.count > 1).map(it => <ItemRow key={it.item} item={it} />)}</tbody></table>
            {!data.counts.contested && <div style={{ textAlign: "center", padding: 30, color: "#444" }}>No contested items — everything is uncontested.</div>}
          </div>)}

        {/* ══ LC ITEMS ══ */}
        {view === "lc" && (<div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
            <input type="text" placeholder="Add LC item by name…" value={lcNew} onChange={e => setLcNew(e.target.value)} onKeyDown={e => e.key === "Enter" && lcAddItem()} style={{ padding: "5px 8px", width: 280, fontSize: 12 }} />
            <button className="btn" onClick={lcAddItem} style={{ color: "#4ade80", borderColor: "#2d4a2d" }}>+ Add item</button>
            <span className="sub">LC items are handled as manual shortlists — the first {LC_UPFRONT} waiting spots pay {LC_CHARGE} points upfront (marked −{LC_CHARGE} below); receiving keeps that same charge. Further back in line is free until the line moves; leaving the line refunds. Each glaive counts separately.</span>
          </div>
          {lcItems.map((lc, li) => (<div className="card" key={li}>
            <div className="card-h">
              <span style={{ fontWeight: 600, fontSize: 13 }} className="gold">{lc.name}</span>
              <button className="btn-undo" onClick={() => lcRemove(li)}>Remove</button>
            </div>
            <div style={{ padding: "8px 14px" }}>
              {(() => { const charged = new Set(); let w = 0; lc.shortlist.forEach((sp, i) => { if (sp.status === "RECEIVED") charged.add(i); else if (w++ < LC_UPFRONT) charged.add(i); });
              return lc.shortlist.length ? lc.shortlist.map((sp, si) => (
                <div key={si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ width: 22, textAlign: "center", color: "#555", fontSize: 11 }}>{si + 1}</span>
                  <span style={{ flex: 1 }}><PN name={sp.player} cls={data.players[sp.player]?.cls} /></span>
                  <span className="gold" style={{ fontSize: 10, width: 36, textAlign: "right" }}>{charged.has(si) ? "−" + LC_CHARGE : ""}</span>
                  <span onClick={() => lcCycle(li, si)} style={{ cursor: "pointer", minWidth: 80 }} className={"tag " + (sp.status === "RECEIVED" ? "tag-c" : sp.status === "NEXT" ? "tag-r" : sp.status === "IN LINE" ? "tag-u" : "")}>{sp.status || "—"}</span>
                  <button className="arrow" onClick={() => lcMove(li, si, -1)}>▲</button>
                  <button className="arrow" onClick={() => lcMove(li, si, 1)}>▼</button>
                  <button className="btn-undo" onClick={() => lcRemP(li, si)}>✕</button>
                </div>
              )) : <div className="sub" style={{ padding: "4px 0" }}>No players on this shortlist yet.</div>; })()}
              {lcAddP === li ? (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input type="text" list="players-dl" placeholder="Player name…" value={lcNewP} onChange={e => setLcNewP(e.target.value)} onKeyDown={e => e.key === "Enter" && lcAddPlayer(li)} autoFocus style={{ padding: "4px 8px", fontSize: 12, width: 200 }} />
                  <button className="btn btn-sm" onClick={() => lcAddPlayer(li)} style={{ color: "#4ade80" }}>Add</button>
                  <button className="btn btn-sm" onClick={() => { setLcAddP(null); setLcNewP("") }}>Cancel</button>
                </div>
              ) : <button className="btn btn-sm" onClick={() => { setLcAddP(li); setLcNewP("") }} style={{ marginTop: 8, color: "#3FC7EB" }}>+ Add player</button>}
            </div>
          </div>))}
          <datalist id="players-dl">{data.allPlayers.map(p => <option key={p} value={p} />)}</datalist>
        </div>)}

        {/* ══ PLAYERS ══ */}
        {view === "players" && (
          <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            <table><thead><tr><th>Player</th><th>Class</th><th>Att %</th><th>Tenure (wk)</th><th>Wins</th><th>BLP</th><th title="Unexcused absences">UA</th><th>In line for</th></tr></thead>
              <tbody>{data.allPlayers.slice().sort((a, b) => a.localeCompare(b)).map(p => {
                const st = data.players[p].st; const b = baseStats[p] || DEF_STATS; return (
                  <tr key={p}>
                    <td><PN name={p} cls={data.players[p].cls} /></td>
                    <td className="dim" style={{ fontSize: 11 }}>{data.players[p].cls || "—"}</td>
                    <td><input className="stat-input" value={b.attendance} onChange={e => setStat(p, "attendance", e.target.value)} /></td>
                    <td><input className="stat-input" value={b.tenure} onChange={e => setStat(p, "tenure", e.target.value)} /></td>
                    <td><input className="stat-input" value={b.wins} onChange={e => setStat(p, "wins", e.target.value)} /> {st.wins !== (+b.wins || 0) && <span className="gold" style={{ fontSize: 10 }}>→{st.wins}</span>}</td>
                    <td><input className="stat-input" value={b.blp} onChange={e => setStat(p, "blp", e.target.value)} /> {st.blp !== (+b.blp || 0) && <span className="gold" style={{ fontSize: 10 }}>→{st.blp}</span>}</td>
                    <td><input className="stat-input" value={b.ua ?? 0} onChange={e => setStat(p, "ua", e.target.value)} /></td>
                    <td className="green" style={{ fontWeight: 600 }}>{data.players[p].inLineFor}</td>
                  </tr>);
              })}</tbody></table>
            <div className="sub" style={{ marginTop: 6 }}>Wins/BLP arrows show session-adjusted values (base edit + auto-increments from awards). Click a name for full profile.</div>
          </div>)}

        {/* ══ BUDGETS ══ */}
        {view === "budget" && (<div>
          <div className="sub" style={{ marginBottom: 8 }}>Point bids come from each wishlist item's note in the TMB export (a bare number, e.g. <code>100</code>). Players with no note-bids get rank-derived auto points and aren't checked against the {BUDGET} budget; partial noters have their un-noted items auto-filled from the leftover (marked below). A tier set piece listed instead of its token counts as the token (marked below; duplicates collapse to the highest single bid). The first {LC_UPFRONT} waiting spots on an LC shortlist — and every RECEIVED LC item — charge {LC_CHARGE} toward the total. Officer edits persist and survive re-imports.</div>
          <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            <table><thead><tr><th>Player</th><th>Source</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>{Object.keys(data.budgets).sort((a, b) => a.localeCompare(b)).map(p => {
                const b = data.budgets[p];
                const checked = b.mode === "notes" || b.edited;
                const diff = b.total - BUDGET;
                return (<React.Fragment key={p}>
                  <tr>
                    <td><PN name={p} cls={data.players[p]?.cls} /></td>
                    <td>{b.mode === "notes" ? <span className="tag tag-u">NOTES</span> : <span className="tag" style={{ background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}>AUTO</span>}{b.edited && <span className="tag tag-c" style={{ marginLeft: 4 }}>EDITED</span>}</td>
                    <td>{b.items.length}</td>
                    <td style={{ fontWeight: 700, color: !checked ? "#888" : diff === 0 ? "#4ade80" : diff > 0 ? "#f87171" : "#fbbf24" }}>{b.total}{b.lcCharge > 0 && <div className="sub" style={{ fontWeight: 400 }}>incl. {b.lcCharge} LC</div>}</td>
                    <td>{!checked ? <span className="dim" style={{ fontSize: 10 }}>—</span> : diff === 0 ? <span className="green" style={{ fontSize: 11 }}>✓ exactly {BUDGET}</span> : diff > 0 ? <span className="red" style={{ fontSize: 11 }}>✕ {diff} over</span> : <span className="gold" style={{ fontSize: 11 }}>⚠ {-diff} under</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn-detail" onClick={() => setBgExpand(bgExpand === p ? null : p)}>{bgExpand === p ? "Close" : "Adjust"}</button>{" "}
                      {b.edited && <button className="btn-undo" onClick={() => clearOverrides(p)}>Clear edits</button>}
                    </td>
                  </tr>
                  {bgExpand === p && (
                    <tr><td colSpan={6} style={{ background: "#141414", padding: "8px 14px" }}>
                      {b.lcList.map((n, i) => (
                        <div key={"lc" + i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                          <span style={{ flex: 1, fontSize: 12 }} className="gold">{n.name} <span className="sub">{n.recv ? "LC item received" : `LC line (top ${LC_UPFRONT})`}</span></span>
                          <span className="gold" style={{ fontWeight: 600, fontSize: 12, width: 52, textAlign: "center" }}>{LC_CHARGE}</span>
                        </div>))}
                      {b.items.map((r, ri) => (
                        <div key={r.item + (r.copy || "")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                          <span style={{ flex: 1, fontSize: 12, color: r.not ? "#555" : "#e0e0e0" }}>{r.item}{r.copy && <span className="sub" style={{ marginLeft: 6 }}>{r.copy === 2 ? "2nd" : r.copy + "th"} copy</span>}{r.af && <span className="sub" style={{ marginLeft: 6, color: "#3FC7EB" }}>auto-filled</span>}{r.via && <span className="sub" style={{ marginLeft: 6, color: "#F48CBA" }}>listed as {r.via.join(", ")}</span>}{r.not && <span className="sub" style={{ marginLeft: 6 }}>not counted ({r.not})</span>}</span>
                          {r.copy ? <span style={{ fontWeight: 600, fontSize: 12, width: 52, textAlign: "center", color: "#e0e0e0" }}>{r.pts}</span>
                            : <input className="stat-input" type="number" min="0" value={r.pts} onChange={e => setOverride(p, r.item, e.target.value)} />}
                        </div>))}
                      <div className="sub" style={{ marginTop: 6 }}>Adjust after talking to the raider — no re-import needed. 0 removes the claim. Re-importing the TMB file keeps these edits.</div>
                    </td></tr>)}
                </React.Fragment>);
              })}</tbody></table>
          </div>
        </div>)}

        {/* ══ MODIFIERS ══ */}
        {view === "mods" && (<div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}>
            <div className={"tog" + (excludeTier ? " on" : "")} onClick={() => setExcludeTier(v => !v)} />
            <div><div style={{ fontWeight: 600 }}>Exclude tier tokens from budget</div><div className="sub">Filters any item with "Forgotten"/"Vanquished" + Verdant Sphere. Tier handled separately.</div></div>
          </div>
          {Object.entries(mod).map(([k, m]) => (
            <div className={"mod-card" + (m.on ? " on" : "")} key={k}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className={"tog" + (m.on ? " on" : "")} onClick={() => setMod(p => ({ ...p, [k]: { ...p[k], on: !p[k].on } }))} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.sign === "−" ? "−" : "+"} {m.label} <span className="dim" style={{ fontWeight: 400, fontSize: 11 }}>weight {m.w}</span></div>
                  <div className="sub">{m.desc}</div>
                </div>
                <input type="number" min="1" max="50" value={m.w} onChange={e => setMod(p => ({ ...p, [k]: { ...p[k], w: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) } }))} className="stat-input" />
              </div>
              <input type="range" min="1" max="50" value={m.w} onChange={e => setMod(p => ({ ...p, [k]: { ...p[k], w: parseInt(e.target.value) } }))} className="slider" style={{ width: "100%", marginTop: 8 }} />
            </div>))}
          <div style={{ marginTop: 8, padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}>
            <div className="sub" style={{ marginBottom: 6 }}>Live formula</div>
            <div className="formula-box">{"final = base\n"
              + (mod.att.on ? `  + (attendance% ÷ 100 × ${mod.att.w})\n` : "")
              + (mod.ten.on ? `  + (min(tenure,4) ÷ 4 × ${mod.ten.w})\n` : "")
              + (mod.blp.on ? `  + (blp × ${mod.blp.w})\n` : "")
              + (mod.ua.on ? `  − (${mod.ua.w} × strikes·(strikes+1)÷2)` : "")}</div>
            <div className="sub" style={{ marginTop: 10, lineHeight: 1.6 }}><b className="gold">Points are spent on win:</b> when a player wins an item, the base points they allocated to it are gone — they do not move to their remaining items. Budget allocations are one-shot bids.</div>
          </div>
        </div>)}
      </>)}

      {/* ══ MODALS ══ */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h3>{detail.item} <span className="dim" style={{ fontSize: 11, fontWeight: 400 }}>{detail.bosses.join(" · ")}</span></h3>
            <div style={{ marginBottom: 10 }}><StatusTag s={detail.status} /> <span className="sub">{detail.count} contender{detail.count > 1 ? "s" : ""} · gap {detail.status === "ROLL" ? "tied" : "+" + detail.gap.toFixed(1)}</span></div>
            <div style={{ overflowX: "auto" }}><table><thead><tr><th>Player</th><th>Base</th>{mod.att.on && <th>Att</th>}{mod.ten.on && <th>Ten</th>}{mod.blp.on && <th>BLP</th>}{mod.ua.on && <th title="Unexcused absences">UA</th>}<th>Final</th><th></th></tr></thead>
              <tbody>{detail.contenders.map((c, i) => (
                <tr key={c.player} style={{ background: i === 0 ? "#141f14" : detail.tied.includes(c.player) ? "#241414" : "transparent" }}>
                  <td><PN name={c.player} cls={c.cls} />{i === 0 && detail.status !== "ROLL" && <span className="tag tag-c" style={{ marginLeft: 6 }}>WIN</span>}{detail.status === "ROLL" && detail.tied.includes(c.player) && <span className="tag tag-r" style={{ marginLeft: 6 }}>ROLL</span>}</td>
                  <td style={{ fontWeight: 600 }}>{c.base.toFixed(0)}</td>
                  {mod.att.on && <td className="green">+{c.parts.att.toFixed(1)}</td>}
                  {mod.ten.on && <td className="green">+{c.parts.ten.toFixed(1)}</td>}
                  {mod.blp.on && <td className="green">+{c.parts.blp.toFixed(1)}</td>}
                  {mod.ua.on && <td className="red">{c.parts.ua ? c.parts.ua.toFixed(1) : <span className="dim">—</span>}</td>}
                  <td className="gold" style={{ fontWeight: 700 }}>{c.final.toFixed(1)}</td>
                  <td><button className="btn-award" onClick={() => doAward(detail, c.player)}>Award</button></td>
                </tr>))}</tbody></table></div>
            <div className="modal-buttons"><button className="mx" onClick={() => setDetail(null)}>Close</button></div>
          </div>
        </div>)}

      {award && (
        <div className="modal-overlay" onClick={() => setAward(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Roll-off — {award.item.item}</h3>
            <p>Scores are tied. Select the /roll winner:</p>
            {award.item.contenders.filter(c => award.item.tied.includes(c.player)).map(c => (
              <label key={c.player} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: award.pick === c.player ? "#1a2e1a" : "#111", border: "1px solid " + (award.pick === c.player ? "#2d4a2d" : "#2a2a2a"), borderRadius: 4, cursor: "pointer", marginBottom: 5 }}>
                <input type="radio" name="roll" checked={award.pick === c.player} onChange={() => setAward(a => ({ ...a, pick: c.player }))} style={{ accentColor: "#4ade80" }} />
                <span style={{ flex: 1 }}><PN name={c.player} cls={c.cls} click={false} /></span>
                <span className="sub">{c.final.toFixed(0)} pts · {c.st.wins}W</span>
              </label>))}
            <div className="modal-buttons"><button className="mx" onClick={() => setAward(null)}>Cancel</button><button className="mc" onClick={() => doAward(award.item, award.pick)}>Award to {award.pick}</button></div>
          </div>
        </div>)}

      {dropTarget && (
        <div className="modal-overlay" onClick={() => setDropTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Drop a claim — {dropTarget.item}</h3>
            <p>Remove a player's claim (they got it outside raid). This does <b>not</b> count as a win; the item stays available for everyone else.</p>
            {dropTarget.contenders.map(c => (
              <div key={c.player} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 4, marginBottom: 5 }}>
                <span><PN name={c.player} cls={c.cls} click={false} /> <span className="sub">{c.final.toFixed(0)} pts</span></span>
                <button className="btn-drop" onClick={() => doDrop(c.player, dropTarget.item)}>Drop</button>
              </div>))}
            <div className="modal-buttons"><button className="mx" onClick={() => setDropTarget(null)}>Close</button></div>
          </div>
        </div>)}

      {profile && data && data.players[profile] && (() => {
        const pl = data.players[profile]; return (
          <div className="modal-overlay" onClick={() => setProfile(null)}>
            <div className="modal wide" onClick={e => e.stopPropagation()}>
              <h3><span style={{ color: CC[pl.cls] || "#ccc" }}>{profile}</span> <span className="dim" style={{ fontSize: 11, fontWeight: 400 }}>{pl.cls}</span></h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 12 }}>
                {[["Attendance", pl.st.attendance + "%"], ["Tenure", pl.st.tenure + "w"], ["Wins", pl.st.wins], ["UA strikes", pl.st.ua], ["In line for", pl.inLineFor]].map(([l, v]) => (
                  <div key={l} style={{ background: "#111", borderRadius: 4, padding: 8, textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700 }} className="gold">{v}</div><div className="sub">{l}</div></div>))}
              </div>
              {pl.wishlist.length > 0 && (<>
                <div className="sub" style={{ marginBottom: 4, textTransform: "uppercase" }}>Wishlist (active claims)</div>
                <table><thead><tr><th>Item</th><th>Base</th><th>Final</th><th>Status</th></tr></thead>
                  <tbody>{pl.wishlist.map(w => (
                    <tr key={w.item} style={{ background: w.isWinner ? "#141f14" : "transparent" }}>
                      <td>{w.item}{w.via && <span className="sub" style={{ marginLeft: 6, color: "#F48CBA" }}>listed as {w.via.join(", ")}</span>}</td><td style={{ fontWeight: 600 }}>{w.base.toFixed(0)}</td><td className="gold" style={{ fontWeight: 600 }}>{w.final.toFixed(1)}</td>
                      <td>{w.isWinner ? <span className="tag tag-c">{w.status === "UNCONTESTED" ? "UNCONTESTED" : "PROJECTED WIN"}</span> : w.winner ? <span className="sub">→ {w.winner}</span> : <span className="dim" style={{ fontSize: 10 }}>—</span>}</td>
                    </tr>))}</tbody></table>
              </>)}
              {pl.received.length > 0 && (<div style={{ marginTop: 12 }}><div className="sub" style={{ marginBottom: 4, textTransform: "uppercase" }}>Items received</div><div className="sub" style={{ color: "#888" }}>{pl.received.join(", ")}</div></div>)}
              <div className="modal-buttons"><button className="mx" onClick={() => setProfile(null)}>Close</button></div>
            </div>
          </div>);
      })()}

      {discord !== null && (
        <div className="modal-overlay" onClick={() => setDiscord(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h3>Discord export</h3>
            <div className="discord-box">{discord}</div>
            <div className="modal-buttons"><button className="mx" onClick={() => setDiscord(null)}>Close</button><button className="mc" onClick={copyDiscord}>Copy to clipboard</button></div>
          </div>
        </div>)}

      {pendingImport && (
        <div className="modal-overlay" onClick={() => setPendingImport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {pendingImport.error ? (<>
              <h3>Can't import</h3>
              <p>{pendingImport.error}</p>
              <div className="modal-buttons"><button className="mx" onClick={() => setPendingImport(null)}>Close</button></div>
            </>) : (<>
              <h3>Load this save file?</h3>
              <p>{pendingImport.data.tmbName ? <>Contains <b>{pendingImport.data.tmbName}</b></> : "No TMB import"}{pendingImport.data.savedAt ? <> · saved {new Date(pendingImport.data.savedAt).toLocaleString()}</> : null} · {(pendingImport.data.awardLog || []).length} award{(pendingImport.data.awardLog || []).length === 1 ? "" : "s"} logged.{hasData ? " This replaces everything currently in the app." : ""}</p>
              <div className="modal-buttons"><button className="mx" onClick={() => setPendingImport(null)}>Cancel</button><button className="mc" onClick={applyImport}>Load save</button></div>
            </>)}
          </div>
        </div>)}

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reset everything?</h3>
            <p>This clears all imports, awards, drops, player stats, modifiers, and LC shortlists from this browser. This cannot be undone.</p>
            <div className="modal-buttons"><button className="mx" onClick={() => setConfirmReset(false)}>Cancel</button><button className="md" onClick={reset}>Reset all data</button></div>
          </div>
        </div>)}
    </div>);
}
