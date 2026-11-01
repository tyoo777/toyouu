/* RANGGA PRASETIO — skrip situs. Tanpa dependensi. Semua teks dari data dimasukkan lewat textContent. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const idr = (opt) => new Intl.NumberFormat("id-ID", opt);
  const money = (v) => (v < 0 ? "-$" : "$") + idr({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  const num = (sel, d = 0) => {
    const el = $(sel);
    const v = parseFloat(String(el ? el.value : "").replace(",", "."));
    return Number.isFinite(v) ? v : d;
  };
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penyimpanan diblokir */ } }
  };

  /* ---------- Tema terang / gelap ---------- */
  const themeBtn = $("#themeToggle");
  const effectiveTheme = () => {
    const set = root.getAttribute("data-theme");
    if (set === "dark" || set === "light") return set;
    return "dark";
  };
  const paintTheme = () => {
    if (!themeBtn) return;
    const t = effectiveTheme();
    themeBtn.setAttribute("aria-label", t === "dark" ? "Pakai tema terang" : "Pakai tema gelap");
    themeBtn.setAttribute("title", t === "dark" ? "Tema terang" : "Tema gelap");
    themeBtn.innerHTML = t === "dark"
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  };
  if (themeBtn) {
    paintTheme();
    themeBtn.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("rp-theme", next); } catch (e) { /* abaikan */ }
      paintTheme();
    });
  }

  /* ---------- Menu mobile ---------- */
  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Jam sesi pasar (WIB = UTC+7, tanpa DST) ---------- */
  const SESSIONS = [
    { name: "Sydney", s: 5, e: 14 },
    { name: "Tokyo", s: 7, e: 16 },
    { name: "London", s: 15, e: 24 },
    { name: "New York", s: 20, e: 29 }
  ];
  const wibHour = () => {
    const d = new Date();
    return (d.getUTCHours() + d.getUTCMinutes() / 60 + 7) % 24;
  };
  const isOpen = (s, e, h) => ((h - s + 24) % 24) < (e - s);
  const hh = (h) => String(h % 24).padStart(2, "0") + ".00";
  const wibClock = () => {
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    } catch (e) { return ""; }
  };
  const renderSessions = () => {
    const h = wibHour();
    const active = SESSIONS.filter((x) => isOpen(x.s, x.e, h));
    const clock = $("#wibClock");
    if (clock) clock.textContent = wibClock() + " WIB";
    const live = $("#liveSession");
    if (live) live.textContent = active.length ? active.map((x) => x.name).join(" + ") : "Jeda antar sesi";
    const dot = $("#liveDot");
    if (dot) dot.classList.toggle("off", active.length === 0);
    const list = $("#sessionList");
    if (list && !list.dataset.built) {
      list.dataset.built = "1";
      SESSIONS.forEach((x) => {
        const li = document.createElement("li");
        li.dataset.session = x.name;
        const left = document.createElement("span");
        const strong = document.createElement("strong");
        strong.textContent = x.name;
        const range = document.createElement("span");
        range.className = "muted num";
        range.textContent = " " + hh(x.s) + " – " + hh(x.e) + " WIB";
        left.append(strong, range);
        const status = document.createElement("span");
        status.className = "status";
        li.append(left, status);
        list.appendChild(li);
      });
    }
    if (list) {
      SESSIONS.forEach((x) => {
        const li = list.querySelector('[data-session="' + x.name + '"]');
        if (!li) return;
        const open = isOpen(x.s, x.e, h);
        const st = li.querySelector(".status");
        st.className = "status " + (open ? "open" : "closed");
        st.textContent = open ? "Sedang buka" : "Tutup";
      });
    }
  };
  if ($("#wibClock") || $("#liveSession") || $("#sessionList")) {
    renderSessions();
    setInterval(renderSessions, 30000);
  }

  /* ---------- Progres modul ---------- */
  const doneList = () => {
    const v = store.get("rp-progress", []);
    return Array.isArray(v) ? v.map(String) : [];
  };
  const paintProgress = () => {
    const done = doneList();
    const mods = $$("[data-module]");
    const ids = mods.map((li) => li.dataset.module);
    mods.forEach((li) => {
      const on = done.includes(li.dataset.module);
      li.classList.toggle("done", on);
      const b = li.querySelector(".badge");
      if (b) {
        b.textContent = on ? "Selesai" : "Belum";
        b.classList.toggle("done", on);
      }
    });
    const count = ids.filter((id) => done.includes(id)).length;
    const meter = $("#meter");
    if (meter && ids.length) {
      meter.style.setProperty("--p", Math.round((count / ids.length) * 100) + "%");
      meter.setAttribute("aria-valuenow", String(count));
    }
    const txt = $("#progressText");
    if (txt && ids.length) txt.textContent = count + " dari " + ids.length + " modul selesai";
    $$("[data-complete]").forEach((b) => {
      const on = done.includes(b.dataset.complete);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "Sudah selesai (klik untuk batalkan)" : "Tandai modul ini selesai";
      b.classList.toggle("btn-primary", !on);
      b.classList.toggle("btn-ghost", on);
    });
  };
  $$("[data-complete]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.complete;
      let done = doneList();
      done = done.includes(id) ? done.filter((x) => x !== id) : done.concat(id);
      store.set("rp-progress", done);
      paintProgress();
    });
  });
  paintProgress();

  /* ---------- Kuis ---------- */
  const quizRoot = $("#quiz");
  if (quizRoot) {
    let data = [];
    try { data = JSON.parse($("#quiz-data").textContent); } catch (e) { data = []; }
    let i = 0, score = 0;
    const qCount = $("#qCount"), qText = $("#qText"), qOpts = $("#qOpts"), qFb = $("#qFeedback");
    const qNext = $("#qNext"), qBody = $("#qBody"), qResult = $("#qResult"), qScore = $("#qScore");
    const qMsg = $("#qMsg"), qRestart = $("#qRestart"), qBar = $("#qBar");
    const render = () => {
      const q = data[i];
      qCount.textContent = "Soal " + (i + 1) + " dari " + data.length;
      qText.textContent = q.q;
      qOpts.textContent = "";
      qFb.textContent = "";
      qNext.disabled = true;
      qNext.textContent = i === data.length - 1 ? "Lihat hasil" : "Soal berikutnya";
      if (qBar) qBar.style.setProperty("--p", Math.round((i / data.length) * 100) + "%");
      q.options.forEach((opt, j) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "opt";
        b.textContent = opt;
        b.addEventListener("click", () => answer(j, b));
        qOpts.appendChild(b);
      });
    };
    const answer = (j, btn) => {
      const q = data[i];
      const btns = $$(".opt", qOpts);
      btns.forEach((x) => { x.disabled = true; });
      const lead = document.createElement("strong");
      if (j === q.a) {
        score++;
        btn.dataset.state = "right";
        lead.textContent = "Benar. ";
      } else {
        btn.dataset.state = "wrong";
        btns[q.a].dataset.state = "right";
        lead.textContent = "Belum tepat. ";
      }
      qFb.textContent = "";
      qFb.append(lead, document.createTextNode(q.why));
      qNext.disabled = false;
    };
    qNext.addEventListener("click", () => {
      if (i < data.length - 1) { i++; render(); return; }
      qBody.hidden = true;
      qResult.hidden = false;
      qScore.textContent = score + " / " + data.length;
      const pct = score / data.length;
      qMsg.textContent = pct >= 0.8
        ? "Hasil bagus. Lanjutkan ke modul berikutnya atau coba simulator risiko."
        : pct >= 0.5
          ? "Cukup baik. Ulangi modul yang jawabannya salah, lalu coba lagi."
          : "Belum cukup. Baca ulang modul 1 sampai 3, lalu kerjakan kuis lagi.";
      if (qBar) qBar.style.setProperty("--p", "100%");
    });
    qRestart.addEventListener("click", () => {
      i = 0; score = 0;
      qBody.hidden = false; qResult.hidden = true;
      render();
    });
    if (data.length) render();
  }

  /* ---------- Cari glosarium ---------- */
  const gSearch = $("#glossSearch");
  if (gSearch) {
    const items = $$(".glossary > div");
    const count = $("#glossCount");
    const apply = () => {
      const q = gSearch.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((d) => {
        const hit = !q || d.textContent.toLowerCase().includes(q);
        d.hidden = !hit;
        if (hit) shown++;
      });
      if (count) count.textContent = shown + " istilah ditampilkan";
    };
    gSearch.addEventListener("input", apply);
    apply();
  }

  /* ---------- Kalkulator posisi ---------- */
  const calc = $("#calc");
  if (calc) {
    const runCalc = () => {
      const bal = num("#cBal", 0);
      const risk = num("#cRisk", 1) / 100;
      const sl = num("#cSL", 0);
      const price = num("#cPrice", 1);
      const lev = Math.max(1, num("#cLev", 100));
      const rr = num("#cRR", 2);
      const pair = $("#cPair").value;
      const jpy = pair === "jpy";
      $("#cRateHint").hidden = !jpy;
      const pipVal = jpy ? (price > 0 ? 1000 / price : 0) : 10;
      const riskAmt = bal * risk;
      const lotRaw = sl > 0 && pipVal > 0 ? riskAmt / (sl * pipVal) : 0;
      const lot = Math.floor(lotRaw * 100) / 100;
      const units = lot * 100000;
      const loss = lot * sl * pipVal;
      const tpPips = sl * rr;
      const reward = lot * tpPips * pipVal;
      const notionalUSD = jpy ? units : units * price;
      const margin = lev > 0 ? notionalUSD / lev : 0;
      $("#oRisk").textContent = money(riskAmt);
      $("#oPipVal").textContent = money(pipVal) + " / pip";
      $("#oLot").textContent = lot.toFixed(2);
      $("#oUnits").textContent = idr({}).format(units);
      $("#oLoss").textContent = money(-loss);
      $("#oTP").textContent = idr({ maximumFractionDigits: 1 }).format(tpPips) + " pip";
      $("#oReward").textContent = money(reward);
      $("#oMargin").textContent = money(margin);
      const note = $("#oNote");
      const out = $("#outBox");
      out.querySelector('[data-kind="reward"]').className = "out up";
      out.querySelector('[data-kind="loss"]').className = "out down";
      if (sl <= 0 || bal <= 0) {
        note.textContent = "Isi saldo dan jarak stop loss (pip) untuk melihat hasilnya.";
      } else if (lot < 0.01) {
        note.textContent = "Risiko terlalu kecil untuk jarak stop loss ini. Perkecil jarak SL atau naikkan saldo.";
      } else if (margin > bal) {
        note.textContent = "Margin yang dibutuhkan melebihi saldo. Kurangi lot atau naikkan leverage.";
      } else {
        note.textContent = "Lot dibulatkan ke bawah (0,01). Kerugian aktual sedikit di bawah risiko yang diinginkan.";
      }
    };
    calc.addEventListener("input", runCalc);
    calc.addEventListener("change", runCalc);
    calc.addEventListener("submit", (e) => { e.preventDefault(); runCalc(); });
    runCalc();
  }

  /* ---------- Simulator Monte Carlo ---------- */
  const sim = $("#sim");
  if (sim) {
    const W = 640, H = 280, pl = 58, pr = 14, pt = 14, pb = 30;
    const runSim = () => {
      const bal0 = Math.max(1, num("#simBal", 5000));
      const risk = Math.min(100, Math.max(0.1, num("#simRisk", 1))) / 100;
      const win = Math.min(100, Math.max(0, num("#simWin", 45))) / 100;
      const rr = Math.max(0.1, num("#simRR", 2));
      const n = Math.min(500, Math.max(10, Math.round(num("#simN", 100))));
      const runs = Math.min(1000, Math.max(100, Math.round(num("#simRuns", 500))));
      const all = [];
      const finals = [];
      let profit = 0, dd50 = 0;
      for (let k = 0; k < runs; k++) {
        let b = bal0, peak = bal0, mdd = 0;
        const path = new Array(n + 1);
        path[0] = b;
        for (let t = 1; t <= n; t++) {
          b = Math.random() < win ? b * (1 + risk * rr) : b * (1 - risk);
          path[t] = b;
          if (b > peak) peak = b;
          const dd = (peak - b) / peak;
          if (dd > mdd) mdd = dd;
        }
        all.push(path);
        finals.push(b);
        if (b > bal0) profit++;
        if (mdd >= 0.5) dd50++;
      }
      const sorted = finals.slice().sort((a, b) => a - b);
      const q = (p) => sorted[Math.min(runs - 1, Math.floor(p * runs))];
      const median = q(0.5);
      const ev = win * rr - (1 - win);
      $("#simMedian").textContent = money(median);
      $("#simP5").textContent = money(q(0.05));
      $("#simP95").textContent = money(q(0.95));
      $("#simProfit").textContent = Math.round((profit / runs) * 100) + "%";
      $("#simDD").textContent = Math.round((dd50 / runs) * 100) + "%";
      $("#simEV").textContent = (ev >= 0 ? "+" : "") + ev.toFixed(2).replace(".", ",") + " R";
      $("#simNote").textContent = "Setiap klik menghasilkan variasi acak. " + runs + " simulasi, masing-masing " + n + " trade. Ini gambaran probabilitas, bukan prediksi.";
      // gambar: 40 jalur contoh + median per langkah
      const sampleN = Math.min(40, runs);
      const medPath = [];
      for (let t = 0; t <= n; t++) {
        const col = all.map((p) => p[t]).sort((a, b) => a - b);
        medPath.push(col[Math.floor(col.length / 2)]);
      }
      let lo = Infinity, hi = -Infinity;
      for (let k = 0; k < sampleN; k++) for (const v of all[k]) { if (v < lo) lo = v; if (v > hi) hi = v; }
      for (const v of medPath) { if (v < lo) lo = v; if (v > hi) hi = v; }
      lo = Math.min(lo, bal0) * 0.98; hi = Math.max(hi, bal0) * 1.02;
      const X = (t) => pl + (t / n) * (W - pl - pr);
      const Y = (v) => pt + (hi - v) * (H - pt - pb) / (hi - lo);
      const linePath = (arr) => arr.map((v, t) => (t ? "L" : "M") + X(t).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
      const svg = $("#simSvg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.textContent = "";
      const NS = "http://www.w3.org/2000/svg";
      const el = (tag, attrs, text) => {
        const e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
        if (text !== undefined) e.textContent = text;
        return e;
      };
      for (let g = 0; g <= 4; g++) {
        const v = lo + (hi - lo) * (g / 4);
        svg.appendChild(el("line", { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), stroke: "currentColor", "stroke-opacity": ".12" }));
        svg.appendChild(el("text", { x: pl - 8, y: Y(v) + 4, "text-anchor": "end" }, "$" + idr({ maximumFractionDigits: 0 }).format(v)));
      }
      svg.appendChild(el("line", { x1: pl, x2: W - pr, y1: Y(bal0), y2: Y(bal0), stroke: "currentColor", "stroke-opacity": ".5", "stroke-dasharray": "2 4" }));
      for (let k = 0; k < sampleN; k++) svg.appendChild(el("path", { d: linePath(all[k]), fill: "none", stroke: "var(--muted)", "stroke-opacity": ".22", "stroke-width": "1" }));
      svg.appendChild(el("path", { d: linePath(medPath), fill: "none", stroke: "var(--accent)", "stroke-width": "2.6", "stroke-linejoin": "round" }));
      svg.appendChild(el("text", { x: W - pr, y: H - 6, "text-anchor": "end" }, "Jumlah trade: " + n));
      svg.appendChild(el("text", { x: pl, y: H - 6 }, "0"));
    };
    sim.addEventListener("input", runSim);
    sim.addEventListener("submit", (e) => { e.preventDefault(); runSim(); });
    const again = $("#simAgain");
    if (again) again.addEventListener("click", runSim);
    runSim();
  }

  /* ---------- Dashboard jurnal (data contoh) ---------- */
  const jurnal = $("#jurnal");
  if (jurnal) {
    const START = 5000, RISK = 0.01;
    const mulberry32 = (a) => () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rnd = mulberry32(20261001);
    const pairs = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"];
    const raw = [];
    for (let i = 0; i < 64; i++) {
      const day = Math.floor((i * 296) / 64) + Math.floor(rnd() * 3);
      const win = rnd() < 0.47;
      raw.push({
        date: new Date(2026, 0, 2 + day),
        pair: pairs[Math.floor(rnd() * pairs.length)],
        side: rnd() < 0.5 ? "BUY" : "SELL",
        R: win ? +(1.3 + rnd() * 1.1).toFixed(2) : -1,
        pips: Math.round(12 + rnd() * 20)
      });
    }
    raw.sort((a, b) => a.date - b.date);
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const dateFmt = (d) => d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();

    const ledger = (trades) => {
      let bal = START, peak = START, maxDD = 0;
      const pts = [START];
      const rows = trades.map((t) => {
        const risk = bal * RISK;
        const pnl = t.R * risk;
        bal += pnl;
        if (bal > peak) peak = bal;
        maxDD = Math.max(maxDD, (peak - bal) / peak);
        pts.push(bal);
        return Object.assign({}, t, { pnl, bal, lot: Math.max(0.01, Math.floor((risk / (t.pips * 10)) * 100) / 100) });
      });
      return { rows, pts, bal, maxDD };
    };

    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs, text) => {
      const e = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
      if (text !== undefined) e.textContent = text;
      return e;
    };

    const renderKpis = (L) => {
      const n = L.rows.length;
      const wins = L.rows.filter((r) => r.R > 0).length;
      const gp = L.rows.filter((r) => r.pnl > 0).reduce((s, r) => s + r.pnl, 0);
      const gl = Math.abs(L.rows.filter((r) => r.pnl < 0).reduce((s, r) => s + r.pnl, 0));
      const avgR = n ? L.rows.reduce((s, r) => s + r.R, 0) / n : 0;
      const ret = (L.bal - START) / START;
      const set = (id, text, cls) => {
        const e = $("#" + id);
        e.textContent = text;
        e.className = cls || "";
      };
      set("kBal", "$" + idr({ maximumFractionDigits: 0 }).format(L.bal), "");
      set("kRet", (ret >= 0 ? "+" : "") + (ret * 100).toFixed(1).replace(".", ",") + "%", ret >= 0 ? "up" : "down");
      set("kWin", n ? Math.round((wins / n) * 100) + "%" : "–", "");
      set("kAvgR", n ? (avgR >= 0 ? "+" : "") + avgR.toFixed(2).replace(".", ",") + " R" : "–", avgR >= 0 ? "up" : "down");
      set("kPF", gl ? (gp / gl).toFixed(2).replace(".", ",") : "–", "");
      set("kDD", (L.maxDD * 100).toFixed(1).replace(".", ",") + "%", "down");
      set("kN", String(n), "");
    };

    const renderEquity = (L) => {
      const W = 640, H = 260, pl = 60, pr = 14, pt = 14, pb = 28;
      const svg = $("#equitySvg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.textContent = "";
      const vals = L.pts;
      let lo = Math.floor((Math.min(...vals) - 100) / 100) * 100;
      let hi = Math.ceil((Math.max(...vals) + 100) / 100) * 100;
      if (hi <= lo) hi = lo + 100;
      const n = vals.length - 1;
      const X = (i) => pl + (i / Math.max(1, n)) * (W - pl - pr);
      const Y = (v) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb);
      for (let g = 0; g <= 4; g++) {
        const v = lo + ((hi - lo) * g) / 4;
        svg.appendChild(el("line", { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), stroke: "currentColor", "stroke-opacity": ".12" }));
        svg.appendChild(el("text", { x: pl - 8, y: Y(v) + 4, "text-anchor": "end" }, "$" + idr({ maximumFractionDigits: 0 }).format(v)));
      }
      const d = vals.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
      const area = d + " L" + X(n).toFixed(1) + " " + Y(lo).toFixed(1) + " L" + X(0).toFixed(1) + " " + Y(lo).toFixed(1) + " Z";
      svg.appendChild(el("path", { d: area, style: "fill: var(--accent); opacity: .12" }));
      svg.appendChild(el("path", { d, fill: "none", style: "stroke: var(--accent)", "stroke-width": "2.2", "stroke-linejoin": "round" }));
      vals.forEach((v, i) => {
        const label = i === 0 ? "Saldo awal " + money(v) : "Trade ke-" + i + " · " + money(v);
        svg.appendChild(el("circle", { cx: X(i), cy: Y(v), r: 9, fill: "transparent", "data-tip": label }));
      });
      if (!L.rows.length) svg.appendChild(el("text", { x: W / 2, y: H / 2, "text-anchor": "middle" }, "Tidak ada trade untuk pasangan ini"));
    };

    const renderMonthly = (L) => {
      const W = 400, H = 240, pl = 52, pr = 8, pt = 14, pb = 28;
      const svg = $("#monthSvg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.textContent = "";
      const sums = new Array(10).fill(0);
      L.rows.forEach((r) => { const m = r.date.getMonth(); if (m < 10) sums[m] += r.pnl; });
      const mx = Math.max(100, ...sums.map((s) => Math.abs(s))) * 1.15;
      const zeroY = pt + (H - pt - pb) / 2;
      const Ys = (v) => zeroY - (v / mx) * ((H - pt - pb) / 2);
      svg.appendChild(el("line", { x1: pl, x2: W - pr, y1: zeroY, y2: zeroY, stroke: "currentColor", "stroke-opacity": ".35" }));
      [-1, -0.5, 0.5, 1].forEach((f) => {
        const v = f * mx;
        svg.appendChild(el("line", { x1: pl, x2: W - pr, y1: Ys(v), y2: Ys(v), stroke: "currentColor", "stroke-opacity": ".1" }));
        svg.appendChild(el("text", { x: pl - 8, y: Ys(v) + 4, "text-anchor": "end" }, (v < 0 ? "-" : "") + "$" + idr({ maximumFractionDigits: 0 }).format(Math.abs(v))));
      });
      const slot = (W - pl - pr) / 10;
      sums.forEach((s, m) => {
        const x = pl + m * slot + slot * 0.22;
        const w = slot * 0.56;
        const y1 = Math.min(Ys(s), zeroY), h = Math.max(1, Math.abs(Ys(s) - zeroY));
        svg.appendChild(el("rect", { x: x.toFixed(1), y: y1.toFixed(1), width: w.toFixed(1), height: h.toFixed(1), rx: 4, style: "fill: " + (s >= 0 ? "var(--up)" : "var(--down)") + "; opacity: .85", "data-tip": MONTHS[m] + " 2026 · " + money(s) }));
        svg.appendChild(el("text", { x: (x + w / 2).toFixed(1), y: H - 8, "text-anchor": "middle" }, MONTHS[m]));
      });
    };

    const renderTable = (L) => {
      const body = $("#tradeBody");
      body.textContent = "";
      L.rows.slice().reverse().slice(0, 12).forEach((r) => {
        const tr = document.createElement("tr");
        const cells = [];
        cells.push(dateFmt(r.date));
        cells.push(r.pair);
        const pill = document.createElement("span");
        pill.className = "pill " + (r.side === "BUY" ? "buy" : "sell");
        pill.textContent = r.side;
        cells.push(pill);
        cells.push(r.lot.toFixed(2));
        cells.push((r.R >= 0 ? "+" : "") + r.R.toFixed(2).replace(".", ",") + " R");
        cells.push(money(r.pnl));
        cells.push(money(r.bal));
        cells.forEach((c, k) => {
          const td = document.createElement("td");
          if (c instanceof Node) td.appendChild(c); else td.textContent = c;
          if (k === 4 || k === 5) td.className = r.pnl >= 0 ? "pos num" : "neg num";
          if (k === 3 || k === 6) td.className = "num";
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      if (!L.rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.textContent = "Belum ada trade untuk pasangan ini.";
        tr.appendChild(td);
        body.appendChild(tr);
      }
    };

    const render = () => {
      const f = $("#pairFilter").value;
      const trades = f === "Semua" ? raw : raw.filter((t) => t.pair === f);
      const L = ledger(trades);
      renderKpis(L);
      renderEquity(L);
      renderMonthly(L);
      renderTable(L);
    };

    const sel = $("#pairFilter");
    pairs.concat([]).forEach((p) => {
      const o = document.createElement("option");
      o.value = p; o.textContent = p; sel.appendChild(o);
    });
    sel.addEventListener("change", render);
    render();
  }

  /* ---------- Tooltip umum untuk elemen ber-data-tip ---------- */
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "status");
  let tipHost = null;
  const showTip = (target) => {
    const host = target.closest(".chart-wrap");
    if (!host) return;
    if (tipHost !== host) { host.appendChild(tip); tipHost = host; }
    tip.textContent = target.getAttribute("data-tip");
    const hr = host.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    tip.style.left = (tr.left + tr.width / 2 - hr.left) + "px";
    tip.style.top = (tr.top - hr.top) + "px";
    tip.classList.add("show");
  };
  document.addEventListener("pointerover", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
    if (t) showTip(t);
  });
  document.addEventListener("pointerout", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
    if (t) tip.classList.remove("show");
  });
  document.addEventListener("focusin", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
    if (t) showTip(t);
  });

  /* ---------- Salin teks ---------- */
  $$("[data-copy]").forEach((b) => {
    b.addEventListener("click", async () => {
      const label = b.getAttribute("data-label") || b.textContent;
      try {
        await navigator.clipboard.writeText(b.getAttribute("data-copy"));
        b.textContent = "Tersalin";
      } catch (e) {
        b.textContent = "Pilih teksnya lalu salin";
      }
      setTimeout(() => { b.textContent = label; }, 1800);
    });
  });

  /* ---------- Pratinjau gambar ---------- */
  const shots = $$("img.zoomable, .photo-frame img, .article figure img");
  if (shots.length && typeof HTMLDialogElement !== "undefined") {
    const dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "Pratinjau gambar");
    const x = document.createElement("button");
    x.type = "button";
    x.className = "icon-btn";
    x.setAttribute("aria-label", "Tutup pratinjau");
    x.textContent = "×";
    const big = document.createElement("img");
    big.alt = "";
    dlg.append(x, big);
    document.body.appendChild(dlg);
    shots.forEach((img) => {
      img.classList.add("zoomable");
      img.addEventListener("click", () => {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt || "";
        dlg.showModal();
      });
    });
    x.addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- Bar progres baca ---------- */
  const article = $(".article");
  if (article) {
    const bar = document.createElement("div");
    bar.className = "read-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const upd = () => {
      const top = article.offsetTop;
      const span = article.offsetHeight - window.innerHeight * 0.6;
      const p = span > 0 ? (window.scrollY - top + 120) / span : 1;
      bar.style.setProperty("--read", Math.min(100, Math.max(0, p * 100)).toFixed(1) + "%");
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ---------- Tombol kembali ke atas ---------- */
  const toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "icon-btn to-top";
  toTop.setAttribute("aria-label", "Kembali ke atas");
  toTop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(toTop);
  const onScrollTop = () => toTop.classList.toggle("show", window.scrollY > 600);
  window.addEventListener("scroll", onScrollTop, { passive: true });
  onScrollTop();
})();
