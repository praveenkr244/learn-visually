/* Python, Visually — interactive diagrams and widgets */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NS = "http://www.w3.org/2000/svg";
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- syntax highlighter ---------- */
const KW = new Set("False None True and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield".split(" "));
const BI = new Set("print len range int float str bool list dict set tuple type isinstance issubclass sorted reversed enumerate zip map filter sum min max abs round open input repr super object id hash iter next any all vars dir getattr setattr hasattr divmod pow chr ord bin hex frozenset callable property classmethod staticmethod Exception ValueError TypeError KeyError IndexError ZeroDivisionError StopIteration RuntimeError NameError AttributeError FileNotFoundError TimeoutError".split(" "));
const RE = /(#[^\n]*)|((?:\b[rRbBfFuU]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(@[A-Za-z_][\w.]*)|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?j?\b)|\b(def|class)(\s+)([A-Za-z_]\w*)|\b([A-Za-z_]\w*)\b/g;
function hl(code) {
  let out = "", last = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="tok-c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tok-s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="tok-d">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="tok-n">${m[4]}</span>`;
    else if (m[5]) out += `<span class="tok-k">${m[5]}</span>${m[6]}<span class="tok-f">${m[7]}</span>`;
    else {
      const w = m[8];
      out += KW.has(w) ? `<span class="tok-k">${w}</span>` : BI.has(w) ? `<span class="tok-b">${w}</span>` : (w === "self" || w === "cls") ? `<span class="tok-self">${w}</span>` : w;
    }
    last = RE.lastIndex;
  }
  return out + esc(code.slice(last));
}

/* ---------- code blocks ---------- */
$$("pre.code").forEach(pre => {
  const code = pre.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
  pre.dataset.src = code;
  pre.innerHTML = hl(code);
  const wrap = document.createElement("div");
  wrap.className = "code-wrap";
  pre.before(wrap); wrap.append(pre);
  const run = pre.hasAttribute("data-run");
  const bar = document.createElement("div");
  bar.className = "code-bar";
  bar.innerHTML = `<span class="lab">${run ? "runnable" : "example"}</span><button type="button" data-a="copy">Copy</button>` +
    (run ? `<button type="button" data-a="edit">Edit</button><button type="button" class="run" data-a="run">▶ Run</button>` : "");
  wrap.append(bar);
  if (run) { const out = document.createElement("pre"); out.className = "out"; out.dataset.base = "out"; out.setAttribute("aria-live", "polite"); wrap.append(out); }
});
$$("pre.mini").forEach(pre => { pre.innerHTML = hl(pre.textContent.replace(/\s+$/, "")); });

/* ---------- Pyodide runner ---------- */
const PY_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyPromise = null;
function setPy(state, text) { const d = $("#pyDot"); d.className = "dot " + state; $("#pyText").textContent = text; }
function loadPy() {
  if (!pyPromise) {
    setPy("load", "Loading Python (≈10 MB, once)…");
    pyPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = PY_URL + "pyodide.js";
      s.onload = () => window.loadPyodide({ indexURL: PY_URL }).then(res, rej);
      s.onerror = () => rej(new Error("the runtime script was blocked"));
      document.head.append(s);
    }).then(py => { setPy("ok", "Python 3.12 ready"); return py; })
      .catch(e => { pyPromise = null; setPy("err", "Python failed to load"); throw e; });
  }
  return pyPromise;
}
function cleanTb(msg) {
  const lines = String(msg).split("\n");
  const i = lines.findIndex(l => l.includes('"<exec>"'));
  return i > 0 ? "Traceback (most recent call last):\n" + lines.slice(i).join("\n") : msg;
}
async function runPy(code, outEl) {
  const base = outEl.dataset.base || "out";
  outEl.className = base; outEl.textContent = pyPromise ? "Running…" : "Loading Python in your browser… (first run takes a few seconds)";
  let py;
  try { py = await loadPy(); }
  catch (e) { outEl.classList.add("err"); outEl.textContent = "Couldn't load the Python runtime here (" + e.message + "). Copy the code and run it with Python on your computer."; return; }
  let buf = "";
  py.setStdout({ batched: s => { buf += s + "\n"; } });
  py.setStderr({ batched: s => { buf += s + "\n"; } });
  try {
    await py.runPythonAsync(code);
    outEl.textContent = buf || "(no output)";
  } catch (e) {
    outEl.classList.add("err");
    outEl.textContent = buf + cleanTb(e.message);
  }
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const wrap = b.closest(".code-wrap"), pre = $("pre.code", wrap), src = pre.dataset.src;
  if (b.dataset.a === "copy") {
    try { await navigator.clipboard.writeText(src); b.textContent = "Copied ✓"; }
    catch (err) { const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = "Selected, press Ctrl+C"; }
    setTimeout(() => { b.textContent = "Copy"; }, 1600);
  } else if (b.dataset.a === "edit") {
    $("#playCode").value = src; $("#playOut").textContent = "";
    $("#playground").scrollIntoView({ behavior: "smooth" }); $("#playCode").focus({ preventScroll: true });
  } else if (b.dataset.a === "run") {
    b.disabled = true; await runPy(src, $(".out", wrap)); b.disabled = false;
  }
});
$("#playOut").dataset.base = "console";
$("#playRun").addEventListener("click", async e => { e.target.disabled = true; await runPy($("#playCode").value, $("#playOut")); e.target.disabled = false; });
$("#playClear").addEventListener("click", () => { $("#playOut").textContent = ""; });
$("#playCode").addEventListener("keydown", e => {
  if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const t = e.target, s = t.selectionStart; t.setRangeText("    ", s, t.selectionEnd, "end"); }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("#playRun").click(); }
});

/* ---------- memory diagrams with arrows ---------- */
let arrowSeq = 0;
function drawArrows(root) {
  $$(".mem", root).forEach(m => {
    let svg = $("svg.arrows", m);
    if (!svg) { svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "arrows"); svg.setAttribute("aria-hidden", "true"); m.append(svg); }
    const box = m.getBoundingClientRect();
    if (!box.width) return;
    const id = "ah" + (++arrowSeq);
    let d = `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>`;
    $$("[data-ref]", m).forEach(src => {
      const t = $(`[data-id="${src.dataset.ref}"]`, m);
      if (!t) return;
      const a = src.getBoundingClientRect(), b = t.getBoundingClientRect();
      const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
      let x2 = b.left - box.left; const y2 = b.top + Math.min(b.height / 2, 18) - box.top;
      let p;
      if (x2 > x1 + 8) { const mx = (x1 + x2) / 2; p = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2 - 2} ${y2}`; }
      else { x2 = b.right - box.left; const cx = Math.max(x1, x2) + 46; p = `M${x1} ${y1} C${cx} ${y1} ${cx} ${y2} ${x2 + 2} ${y2}`; }
      const dashed = src.classList.contains("slot") ? ' style="stroke:var(--muted);stroke-dasharray:4 3"' : "";
      d += `<path d="${p}" marker-end="url(#${id})"${dashed}/>`;
    });
    svg.innerHTML = d;
  });
}
function redrawAll() { $$(".stp-stage").forEach(drawArrows); }
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(redrawAll, 120); });
const O = (id, t, v, c = "") => ({ id, t, v, c });
function mem(names, cols) {
  return `<div class="mem"><div><h5>Names</h5><div class="names">${names.map(([n, r]) => `<div class="nm" data-ref="${r}">${n}</div>`).join("")}</div></div>` +
    `<div><h5>Objects</h5><div class="heap">${cols.map(c => `<div class="hcol">${c.map(o => `<div class="ob ${o.c}" data-id="${o.id}"><small>${o.t}</small>${o.v}</div>`).join("")}</div>`).join("")}</div></div></div>`;
}

/* ---------- generic step player ---------- */
function Stepper(host, code, frames) {
  host.innerHTML = `<div class="stepper"><div class="stp-code" aria-label="code"></div><div class="stp-stage"></div><div class="stp-note" aria-live="polite"></div></div>
  <div class="ctrl"><button class="btn" data-s="reset">⟲ Reset</button><button class="btn" data-s="prev">◀ Back</button><button class="btn pri" data-s="play">▶ Play</button><button class="btn" data-s="next">Next ▶</button><span class="stp-count"></span></div>`;
  const codeEl = $(".stp-code", host), stage = $(".stp-stage", host), note = $(".stp-note", host), cnt = $(".stp-count", host), playB = $("[data-s=play]", host);
  let i = 0, timer = null;
  const setCode = c => { codeEl.innerHTML = c.split("\n").map((l, k) => `<div class="ln" data-n="${k + 1}">${hl(l) || " "}</div>`).join(""); };
  function render() {
    const f = frames[i];
    const on = Array.isArray(f.l) ? f.l : [f.l];
    $$(".ln", codeEl).forEach(el => el.classList.toggle("on", on.includes(+el.dataset.n)));
    stage.innerHTML = f.s || ""; note.innerHTML = f.n || "";
    cnt.textContent = `step ${i} / ${frames.length - 1}`;
    drawArrows(stage); setTimeout(() => drawArrows(stage), 480);
  }
  function stop() { clearInterval(timer); timer = null; playB.textContent = "▶ Play"; }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    const a = b.dataset.s;
    if (a === "next") { stop(); if (i < frames.length - 1) i++; render(); }
    else if (a === "prev") { stop(); if (i > 0) i--; render(); }
    else if (a === "reset") { stop(); i = 0; render(); }
    else if (a === "play") {
      if (timer) { stop(); return; }
      if (i >= frames.length - 1) i = 0;
      playB.textContent = "❚❚ Pause"; render();
      timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } i++; render(); }, 1600);
    }
  });
  setCode(code); render();
  return { set(c, fr) { stop(); setCode(c); frames = fr; i = 0; render(); } };
}

/* ---------- widgets ---------- */
const W = {};

W.vars = host => {
  const code = "x = 10\ny = x\nx = x + 5\na = [1, 2]\nb = a\nb.append(3)\nc = a.copy()\nc.append(4)";
  const base = [O("o1", "int", "10"), O("o2", "int", "15")];
  Stepper(host, code, [
    { l: 0, s: mem([], [[]]), n: "Press <b>Next</b> or <b>Play</b> to run the code one line at a time." },
    { l: 1, s: mem([["x", "o1"]], [[O("o1", "int", "10", "new")]]), n: "Python creates an <b>int object</b> holding 10, then attaches the name <b>x</b> to it." },
    { l: 2, s: mem([["x", "o1"], ["y", "o1"]], [[O("o1", "int", "10")]]), n: "<b>y = x</b> copies the reference, not the value. Two names, one object." },
    { l: 3, s: mem([["x", "o2"], ["y", "o1"]], [[O("o1", "int", "10"), O("o2", "int", "15", "new")]]), n: "Integers are immutable, so <b>x + 5</b> builds a <b>new</b> object 15 and moves the name x. y still points at 10." },
    { l: 4, s: mem([["x", "o2"], ["y", "o1"], ["a", "o3"]], [[...base, O("o3", "list", "[1, 2]", "new")]]), n: "A list object is created and named <b>a</b>." },
    { l: 5, s: mem([["x", "o2"], ["y", "o1"], ["a", "o3"], ["b", "o3"]], [[...base, O("o3", "list", "[1, 2]")]]), n: "<b>b = a</b> does not copy the list. Both names point at the same list." },
    { l: 6, s: mem([["x", "o2"], ["y", "o1"], ["a", "o3"], ["b", "o3"]], [[...base, O("o3", "list", "[1, 2, 3]", "new")]]), n: "<b>append</b> changes the list in place, so looking through <b>a</b> or <b>b</b> you see [1, 2, 3]." },
    { l: 7, s: mem([["x", "o2"], ["y", "o1"], ["a", "o3"], ["b", "o3"], ["c", "o4"]], [[...base, O("o3", "list", "[1, 2, 3]"), O("o4", "list", "[1, 2, 3]", "new")]]), n: "<b>copy()</b> builds a second, independent list." },
    { l: 8, s: mem([["x", "o2"], ["y", "o1"], ["a", "o3"], ["b", "o3"], ["c", "o4"]], [[...base, O("o3", "list", "[1, 2, 3]"), O("o4", "list", "[1, 2, 3, 4]", "new")]]), n: "Only c's list changed. <code>a is b</code> → True, <code>a is c</code> → False." }
  ]);
};

W.slicer = host => {
  const s = "Hello_Python";
  host.innerHTML = `<div class="svg-wrap"><div class="cells" id="slCells" style="flex-wrap:nowrap"></div></div>
  <div class="ctrl"><code style="font-size:1rem">s[</code><input id="slA" type="text" inputmode="numeric" aria-label="start" style="width:4em"><code>:</code><input id="slB" type="text" inputmode="numeric" aria-label="stop" style="width:4em"><code>:</code><input id="slC" type="text" inputmode="numeric" aria-label="step" style="width:4em"><code style="font-size:1rem">]</code></div>
  <div class="ctrl">${["0:5", "6:", "-6:", ":5", "::2", "::-1", "8:2:-2", "-3:-1"].map(p => `<button class="btn" data-p="${p}">[${p}]</button>`).join("")}</div>
  <div class="stp-note" id="slOut" style="margin-top:10px"></div>`;
  const A = $("#slA", host), B = $("#slB", host), C = $("#slC", host);
  const parse = v => { v = v.trim(); if (v === "") return null; const n = Number(v); return Number.isInteger(n) ? n : NaN; };
  function idx(len, start, stop, step) {
    if (step === null) step = 1;
    const adj = (v, def, neg) => {
      if (v === null) return def;
      if (v < 0) { v += len; if (v < 0) v = step < 0 ? -1 : 0; }
      else if (v >= len) v = step < 0 ? len - 1 : len;
      return v;
    };
    start = adj(start, step < 0 ? len - 1 : 0); stop = adj(stop, step < 0 ? -1 : len);
    const r = [];
    if (step > 0) for (let i = start; i < stop; i += step) r.push(i);
    else for (let i = start; i > stop; i += step) r.push(i);
    return r;
  }
  function render() {
    const a = parse(A.value), b = parse(B.value), c = parse(C.value);
    const out = $("#slOut", host);
    let picked = [];
    if ([a, b, c].some(Number.isNaN)) { out.innerHTML = "Use whole numbers (or leave a box empty)."; }
    else if (c === 0) { out.innerHTML = "<b>ValueError</b>: slice step cannot be zero."; }
    else {
      picked = idx(s.length, a, b, c);
      const res = picked.map(i => s[i]).join("");
      out.innerHTML = `<code>s[${A.value.trim()}:${B.value.trim()}${C.value.trim() !== "" ? ":" + C.value.trim() : ""}]</code> → <b>'${esc(res)}'</b> &nbsp; <span style="color:var(--muted)">takes indices ${picked.length ? picked.join(", ") : "(none)"}</span>`;
    }
    $("#slCells", host).innerHTML = [...s].map((ch, i) => {
      const k = picked.indexOf(i);
      return `<div class="cell ${k >= 0 ? "hit flash" : "miss"}" style="${k >= 0 ? `animation-delay:${k * 70}ms` : ""}"><small>${i}</small>${esc(ch)}<small>${i - s.length}</small></div>`;
    }).join("");
  }
  host.addEventListener("input", render);
  host.addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (!b) return; const [x, y, z] = (b.dataset.p + "::").split(":"); A.value = x; B.value = y; C.value = z; render(); });
  A.value = "0"; B.value = "5"; render();
};

W.flow = host => {
  host.innerHTML = `<div class="svg-wrap"><svg viewBox="0 0 690 250" width="100%" style="min-width:560px" role="img" aria-label="Flowchart of if, elif, else on temperature">
  <path id="fe1" class="fl-e" d="M130 115 H178"/>
  <path id="fe2" class="fl-e" d="M250 75 V30 H378"/>
  <path id="fe3" class="fl-e" d="M320 115 H368"/>
  <path id="fe4" class="fl-e" d="M510 115 H558"/>
  <path id="fe5" class="fl-e" d="M440 155 V198"/>
  <text class="fl-lab" x="258" y="60">yes</text><text class="fl-lab" x="330" y="108">no</text><text class="fl-lab" x="518" y="108">yes</text><text class="fl-lab" x="448" y="182">no</text>
  <g class="fl-n" id="fnS"><rect x="10" y="95" width="120" height="40" rx="20"/><text x="70" y="120" id="fnST">temp = 22</text></g>
  <g class="fl-n" id="fnD1"><polygon points="250,75 320,115 250,155 180,115"/><text x="250" y="120">temp &gt; 30?</text></g>
  <g class="fl-n" id="fnD2"><polygon points="440,75 510,115 440,155 370,115"/><text x="440" y="120">temp &gt; 15?</text></g>
  <g class="fl-n res" id="fnH"><rect x="380" y="10" width="120" height="40" rx="8"/><text x="440" y="35">print("hot")</text></g>
  <g class="fl-n res" id="fnP"><rect x="560" y="95" width="122" height="40" rx="8"/><text x="621" y="120">print("pleasant")</text></g>
  <g class="fl-n res" id="fnC"><rect x="380" y="200" width="120" height="40" rx="8"/><text x="440" y="225">print("cold")</text></g>
  </svg></div>
  <div class="ctrl"><label for="tempR">temp</label><input id="tempR" type="range" min="-10" max="45" value="22" style="flex:1;max-width:320px"><b id="tempV" style="font-family:var(--font-mono)"></b></div>
  <div class="stp-note" id="tempOut" style="margin-top:10px"></div>`;
  const r = $("#tempR", host);
  function render() {
    const t = +r.value;
    $("#tempV", host).textContent = t + "°C"; $("#fnST", host).textContent = "temp = " + t;
    let nodes, edges, msg;
    if (t > 30) { nodes = ["fnS", "fnD1", "fnH"]; edges = ["fe1", "fe2"]; msg = `<code>${t} &gt; 30</code> is <b>True</b> → prints <b>hot</b>. The elif and else are never checked.`; }
    else if (t > 15) { nodes = ["fnS", "fnD1", "fnD2", "fnP"]; edges = ["fe1", "fe3", "fe4"]; msg = `<code>${t} &gt; 30</code> is False → <code>${t} &gt; 15</code> is <b>True</b> → prints <b>pleasant</b>.`; }
    else { nodes = ["fnS", "fnD1", "fnD2", "fnC"]; edges = ["fe1", "fe3", "fe5"]; msg = `Both conditions are False → the <b>else</b> block prints <b>cold</b>.`; }
    $$(".fl-n", host).forEach(g => g.classList.toggle("on", nodes.includes(g.id)));
    $$(".fl-e", host).forEach(p => p.classList.toggle("on", edges.includes(p.id)));
    $("#tempOut", host).innerHTML = msg;
  }
  r.addEventListener("input", render); render();
};

W.loop = host => {
  const nums = [4, 8, 15], F = [];
  const st = (idx, n, total, out = "") => `<div class="cells">${nums.map((v, k) => `<div class="cell ${k === idx ? "hit" : ""}">${v}<small>[${k}]</small></div>`).join("")}</div>
    <div class="kv"><span>n = <b>${n ?? "—"}</b></span><span>total = <b>${total ?? "—"}</b></span></div><pre class="console">${out}</pre>`;
  F.push({ l: 0, s: st(-1), n: "Press <b>Play</b> to watch the loop visit each item." });
  F.push({ l: 1, s: st(-1), n: "The list <b>nums</b> is created." });
  let total = 0;
  F.push({ l: 2, s: st(-1, null, 0), n: "<b>total</b> starts at 0." });
  nums.forEach((v, k) => {
    F.push({ l: 3, s: st(k, v, total), n: `The loop takes the next item and names it <b>n = ${v}</b>.` });
    total += v;
    F.push({ l: 4, s: st(k, v, total), n: `The indented body runs: total = ${total - v} + ${v} = <b>${total}</b>.` });
  });
  F.push({ l: 3, s: st(-1, 15, total), n: "No items left, so the loop ends. <b>n</b> keeps its last value." });
  F.push({ l: 5, s: st(-1, 15, total, "27"), n: "Execution continues with the first line after the loop body." });
  Stepper(host, "nums = [4, 8, 15]\ntotal = 0\nfor n in nums:\n    total += n\nprint(total)", F);
};

W.listops = host => {
  let arr = [5, 2, 9], pool = [7, 1, 8, 3, 6, 4], pi = 0, changed = [], last = "";
  host.innerHTML = `<div class="cells" id="loCells"></div>
  <div class="ctrl">${["append(x)", "insert(0, x)", "pop()", "pop(0)", "sort()", "reverse()", "reset"].map(o => `<button class="btn ${o === "append(x)" ? "pri" : ""}" data-o="${o}">${o === "reset" ? "⟲ Reset" : "nums." + o}</button>`).join("")}</div>
  <div class="stp-note" id="loNote" style="margin-top:10px"></div>`;
  function render() {
    $("#loCells", host).innerHTML = arr.length ? arr.map((v, i) => `<div class="cell ${changed.includes(i) ? "hit flash" : ""}">${v}<small>[${i}]</small></div>`).join("") : `<span class="stp-count">[] (empty list)</span>`;
    $("#loNote", host).innerHTML = last || "nums = [5, 2, 9]. Try the buttons; x is the next number from a pool.";
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-o]"); if (!b) return;
    const o = b.dataset.o, x = pool[pi++ % pool.length];
    changed = [];
    if (o === "reset") { arr = [5, 2, 9]; last = ""; }
    else if (o === "append(x)") { if (arr.length >= 10) { last = "Kept short for the demo: pop something first."; } else { arr.push(x); changed = [arr.length - 1]; last = `<code>nums.append(${x})</code> adds at the end. <b>O(1)</b>: nothing else moves.`; } }
    else if (o === "insert(0, x)") { if (arr.length >= 10) { last = "Kept short for the demo: pop something first."; } else { arr.unshift(x); changed = arr.map((_, i) => i); last = `<code>nums.insert(0, ${x})</code> shifts every element one slot right. <b>O(n)</b>.`; } }
    else if (o === "pop()") { if (!arr.length) last = "<b>IndexError</b>: pop from empty list"; else { const v = arr.pop(); last = `<code>nums.pop()</code> removed and returned <b>${v}</b> from the end. <b>O(1)</b>.`; } }
    else if (o === "pop(0)") { if (!arr.length) last = "<b>IndexError</b>: pop from empty list"; else { const v = arr.shift(); changed = arr.map((_, i) => i); last = `<code>nums.pop(0)</code> returned <b>${v}</b>; every other element shifted left. <b>O(n)</b>.`; } }
    else if (o === "sort()") { arr.sort((p, q) => p - q); changed = arr.map((_, i) => i); last = `<code>nums.sort()</code> reorders in place and returns None. <b>O(n log n)</b>. Use <code>sorted(nums)</code> for a new list.`; }
    else if (o === "reverse()") { arr.reverse(); changed = arr.map((_, i) => i); last = `<code>nums.reverse()</code> flips the order in place. <b>O(n)</b>.`; }
    render();
  });
  render();
};

W.hash = host => {
  const N = 8; let slots;
  host.innerHTML = `<div class="svg-wrap"><div class="cells" id="hSlots" style="flex-wrap:nowrap"></div></div>
  <div class="ctrl"><label for="hk">key</label><input id="hk" type="text" value="pear"><label for="hv">value</label><input id="hv" type="text" value="5" style="width:4em">
  <button class="btn pri" data-h="ins">d[key] = value</button><button class="btn" data-h="get">d[key]</button><button class="btn" data-h="reset">⟲ Reset</button></div>
  <div class="stp-note" id="hLog" style="margin-top:10px"></div>`;
  const hash = s => { let x = 7; for (const ch of s) x = (Math.imul(x, 31) + ch.codePointAt(0)) >>> 0; return x; };
  let busy = false;
  function render(hi = -1, cls = "hit") {
    $("#hSlots", host).innerHTML = slots.map((e, i) => `<div class="cell hcell ${i === hi ? cls + " flash" : ""}"><small>slot ${i}</small>${e ? esc(e[0]) + ": " + esc(e[1]) : "·"}</div>`).join("");
  }
  function reset() { slots = Array(N).fill(null); for (const [k, v] of [["apple", "3"], ["kiwi", "7"], ["fig", "1"]]) put(k, v, true); render(); $("#hLog", host).innerHTML = "The dict already holds apple, kiwi and fig. Insert or look up a key and watch where it goes."; }
  function put(k, v, silent) { let i = hash(k) % N; for (let n = 0; n < N; n++, i = (i + 1) % N) { if (!slots[i] || slots[i][0] === k) { slots[i] = [k, v]; return i; } } return -1; }
  async function walk(k, mode) {
    if (busy) return; busy = true;
    const h = hash(k), log = $("#hLog", host); let i = h % N;
    let msg = `hash("${esc(k)}") = ${h} → ${h} % ${N} = <b>slot ${i}</b>`;
    log.innerHTML = msg;
    for (let n = 0; n < N; n++, i = (i + 1) % N) {
      render(i); await new Promise(r => setTimeout(r, 650));
      const e = slots[i];
      if (mode === "get") {
        if (!e) { msg += ` → empty: <b>KeyError: '${esc(k)}'</b>`; render(i, "miss"); break; }
        if (e[0] === k) { msg += ` → found! value = <b>${esc(e[1])}</b> (${n + 1} probe${n ? "s" : ""})`; break; }
        msg += ` → holds "${esc(e[0])}", probe slot ${(i + 1) % N}`;
      } else {
        if (!e || e[0] === k) { slots[i] = [k, $("#hv", host).value]; msg += e ? ` → same key: value replaced` : ` → empty: stored here`; render(i); break; }
        msg += ` → taken by "${esc(e[0])}" (collision), try slot ${(i + 1) % N}`;
        if (n === N - 1) msg += " → table full (real dicts grow automatically)";
      }
      log.innerHTML = msg;
    }
    log.innerHTML = msg; busy = false;
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-h]"); if (!b) return;
    const k = $("#hk", host).value.trim(); if (b.dataset.h === "reset") { reset(); return; }
    if (!k) { $("#hLog", host).textContent = "Type a key first."; return; }
    walk(k, b.dataset.h);
  });
  reset();
};

W.venn = host => {
  host.innerHTML = `<div class="svg-wrap"><svg viewBox="0 0 400 220" width="100%" style="max-width:520px" role="img" aria-label="Venn diagram of sets a and b">
  <defs><clipPath id="vcA"><circle cx="150" cy="115" r="85"/></clipPath><clipPath id="vcB"><circle cx="250" cy="115" r="85"/></clipPath>
  <mask id="vmNB"><rect width="400" height="220" fill="#fff"/><circle cx="250" cy="115" r="85" fill="#000"/></mask>
  <mask id="vmNA"><rect width="400" height="220" fill="#fff"/><circle cx="150" cy="115" r="85" fill="#000"/></mask></defs>
  <circle class="venn-r" data-r="a" cx="150" cy="115" r="85" mask="url(#vmNB)"/>
  <circle class="venn-r" data-r="ab" cx="150" cy="115" r="85" clip-path="url(#vcB)"/>
  <circle class="venn-r" data-r="b" cx="250" cy="115" r="85" mask="url(#vmNA)"/>
  <circle class="vc" cx="150" cy="115" r="85"/><circle class="vc" cx="250" cy="115" r="85"/>
  <g font-family="JetBrains Mono, monospace" font-size="17" font-weight="600" fill="var(--ink)" text-anchor="middle">
  <text x="110" y="110">1</text><text x="110" y="135">2</text><text x="200" y="110">3</text><text x="200" y="135">4</text><text x="290" y="110">5</text><text x="290" y="135">6</text></g>
  <g font-size="15" font-weight="800" fill="var(--muted)"><text x="70" y="30">a = {1, 2, 3, 4}</text><text x="230" y="30">b = {3, 4, 5, 6}</text></g>
  </svg></div>
  <div class="ctrl">${[["a | b", "union", ["a", "ab", "b"], "{1, 2, 3, 4, 5, 6}"], ["a & b", "intersection", ["ab"], "{3, 4}"], ["a - b", "difference", ["a"], "{1, 2}"], ["b - a", "difference", ["b"], "{5, 6}"], ["a ^ b", "symmetric difference", ["a", "b"], "{1, 2, 5, 6}"]]
      .map(([op, name, r, res]) => `<button class="btn" data-v="${r.join(",")}" data-op="${esc(op)}" data-name="${name}" data-res="${res}">${esc(op)}</button>`).join("")}</div>
  <div class="stp-note" id="vOut" style="margin-top:10px"></div>`;
  function pick(b) {
    const on = b.dataset.v.split(",");
    $$(".venn-r", host).forEach(c => c.classList.toggle("on", on.includes(c.dataset.r)));
    $$("[data-v]", host).forEach(x => x.classList.toggle("pri", x === b));
    $("#vOut", host).innerHTML = `<code>${esc(b.dataset.op)}</code> (${b.dataset.name}) → <b>${b.dataset.res}</b>`;
  }
  host.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) pick(b); });
  pick($("[data-v]", host));
};

W.stack = host => {
  const F = [];
  const R = (fr, out = "", isNew = false) => `<div class="stack"><div class="frame" style="border-color:var(--muted)">&lt;module&gt; <small>print(fact(4))</small></div>${fr.map((f, k) => `<div class="frame ${k === fr.length - 1 ? "top" : ""} ${isNew && k === fr.length - 1 ? "new" : ""}">fact(n=${f.n}) <small>${f.s}</small></div>`).join("")}</div><pre class="console">${out}</pre>`;
  const cp = fr => fr.map(f => ({ ...f }));
  F.push({ l: 6, s: R([]), n: "The program calls <b>fact(4)</b>. Press Play." });
  let fr = [];
  for (let n = 4; n >= 1; n--) {
    fr.push({ n, s: "running" });
    F.push({ l: 1, s: R(cp(fr), "", true), n: `A new frame for <b>fact(${n})</b> is pushed, with its own local <b>n = ${n}</b>.` });
    if (n > 1) {
      F.push({ l: 2, s: R(cp(fr)), n: `${n} &lt;= 1 is False.` });
      fr[fr.length - 1].s = `waiting for fact(${n - 1})`;
      F.push({ l: 4, s: R(cp(fr)), n: `It needs <b>fact(${n - 1})</b> first, so this frame pauses and the function calls itself.` });
    } else {
      F.push({ l: 2, s: R(cp(fr)), n: "1 &lt;= 1 is True: the <b>base case</b> stops the recursion." });
      fr[fr.length - 1].s = "returns 1";
      F.push({ l: 3, s: R(cp(fr)), n: "fact(1) returns 1 and its frame is popped." });
    }
  }
  let val = 1;
  for (let n = 2; n <= 4; n++) {
    fr.pop(); const prev = val; val *= n;
    fr[fr.length - 1].s = `returns ${n} × ${prev} = ${val}`;
    F.push({ l: 4, s: R(cp(fr)), n: `Back in fact(${n}): ${n} * ${prev} = <b>${val}</b>. It returns and its frame pops.` });
  }
  F.push({ l: 6, s: R([], "24"), n: "Every fact frame is gone. <b>print</b> shows 24." });
  Stepper(host, "def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(4))", F);
};

W.legb = host => {
  host.innerHTML = `<div class="legb">
  <div class="nest" data-lv="B" style="--c:var(--adv)"><span class="tag">B · Built-in: len, print, range, int, …</span>
   <div class="nest" data-lv="G" style="--c:var(--accent)"><span class="tag">G · Global (module): x = "global"</span>
    <div class="nest" data-lv="E" style="--c:var(--warn)"><span class="tag">E · Enclosing: def outer(): prefix = "&gt;&gt;"</span>
     <div class="nest" data-lv="L" style="--c:var(--good)"><span class="tag">L · Local: def inner(): count = 1</span><code id="lgCode">print(count)</code></div>
    </div></div></div></div>
  <div class="ctrl"><span class="stp-count">Look up:</span>${["count", "prefix", "x", "len", "total"].map(n => `<button class="btn" data-n="${n}">${n}</button>`).join("")}</div>
  <div class="stp-note" id="lgOut" style="margin-top:10px">Pick a name used inside <code>inner()</code>.</div>`;
  const where = { count: "L", prefix: "E", x: "G", len: "B" }, names = { L: "Local", E: "Enclosing", G: "Global", B: "Built-in" };
  let busy = false;
  host.addEventListener("click", async e => {
    const b = e.target.closest("[data-n]"); if (!b || busy) return; busy = true;
    const n = b.dataset.n, out = $("#lgOut", host);
    $("#lgCode", host).textContent = `print(${n})`;
    $$(".nest", host).forEach(x => x.classList.remove("here", "found"));
    let trail = [];
    for (const lv of ["L", "E", "G", "B"]) {
      const box = $(`[data-lv="${lv}"]`, host);
      $$(".nest", host).forEach(x => x.classList.remove("here"));
      box.classList.add("here");
      await new Promise(r => setTimeout(r, 600));
      if (where[n] === lv) { box.classList.remove("here"); box.classList.add("found"); trail.push(`<b>${names[lv]}</b> ✓`); out.innerHTML = trail.join(" → ") + ` Found <code>${n}</code>.`; busy = false; return; }
      trail.push(`${names[lv]} ✗`); out.innerHTML = trail.join(" → ");
    }
    $$(".nest", host).forEach(x => x.classList.remove("here"));
    out.innerHTML = trail.join(" → ") + ` <b style="color:var(--bad)">NameError: name '${n}' is not defined</b>`;
    busy = false;
  });
};

W.trypath = host => {
  host.innerHTML = `<div class="ctrl" style="margin-top:0"><label for="tryIn">b_text =</label><select id="tryIn"><option value="10">"10"  (works)</option><option value="0">"0"  (division by zero)</option><option value="abc">"abc"  (not a number)</option></select></div><div class="trysub" style="margin-top:12px"></div>`;
  const codeFor = v => `def divide(a, b_text):\n    try:\n        b = int(b_text)\n        result = a / b\n    except ValueError:\n        print("Not a number")\n    except ZeroDivisionError:\n        print("Can't divide by zero")\n    else:\n        print("Result:", result)\n    finally:\n        print("Done")\n\ndivide(100, "${v}")`;
  const S = (exc, out) => `<div class="kv" style="margin-top:0"><span>exception: ${exc ? `<span class="pill bad">${exc}</span>` : `<span class="pill ok">none</span>`}</span></div><pre class="console">${esc(out)}</pre>`;
  function frames(v) {
    const F = [{ l: 14, s: S(null, ""), n: `Call <code>divide(100, "${v}")</code>.` }, { l: 2, s: S(null, ""), n: "Enter the <b>try</b> block." }];
    if (v === "10") F.push({ l: 3, s: S(null, ""), n: 'int("10") → 10' }, { l: 4, s: S(null, ""), n: "100 / 10 → 10.0" }, { l: 9, s: S(null, ""), n: "No exception happened, so the <b>else</b> block runs." }, { l: 10, s: S(null, "Result: 10.0"), n: "Prints the result." }, { l: 11, s: S(null, "Result: 10.0"), n: "<b>finally</b> always runs." }, { l: 12, s: S(null, "Result: 10.0\nDone"), n: "Cleanup done. Function returns normally." });
    if (v === "0") F.push({ l: 3, s: S(null, ""), n: 'int("0") → 0' }, { l: 4, s: S("ZeroDivisionError", ""), n: "100 / 0 raises <b>ZeroDivisionError</b>. The rest of try is skipped." }, { l: 5, s: S("ZeroDivisionError", ""), n: "Is it a ValueError? No, keep looking." }, { l: 7, s: S("ZeroDivisionError", ""), n: "Is it a ZeroDivisionError? Yes: handled here." }, { l: 8, s: S(null, "Can't divide by zero"), n: "The handler runs and the exception is cleared. <b>else</b> is skipped because there was an error." }, { l: 11, s: S(null, "Can't divide by zero"), n: "<b>finally</b> always runs." }, { l: 12, s: S(null, "Can't divide by zero\nDone"), n: "Done." });
    if (v === "abc") F.push({ l: 3, s: S("ValueError", ""), n: 'int("abc") raises <b>ValueError</b>. Line 4 never runs.' }, { l: 5, s: S("ValueError", ""), n: "Matches ValueError: handled here." }, { l: 6, s: S(null, "Not a number"), n: "The handler prints a message." }, { l: 11, s: S(null, "Not a number"), n: "<b>finally</b> always runs." }, { l: 12, s: S(null, "Not a number\nDone"), n: "Done." });
    return F;
  }
  const st = Stepper($(".trysub", host), codeFor("10"), frames("10"));
  $("#tryIn", host).addEventListener("change", e => st.set(codeFor(e.target.value), frames(e.target.value)));
};

W.comp = host => {
  const F = [], out = [], rej = [];
  const R = (cur, note) => `<div class="cells">${[0, 1, 2, 3, 4, 5, 6].map(x => `<div class="cell ${x === cur ? "hit" : ""} ${rej.includes(x) ? "miss" : ""}">${x}</div>`).join("")}</div>
    <div class="gate">${note || "&nbsp;"}</div><div class="cells">${out.length ? out.map((v, k) => `<div class="cell ${k === out.length - 1 && cur !== null ? "flash hit" : ""}">${v}<small>[${k}]</small></div>`).join("") : '<span class="stp-count">result = [ ]</span>'}</div>`;
  F.push({ l: 0, s: R(null), n: "Top row: <code>range(7)</code>. Bottom row: the list being built." });
  for (let x = 0; x < 7; x++) {
    F.push({ l: 2, s: R(x, `x = ${x}`), n: `<b>for</b> takes x = ${x}.` });
    if (x % 2 === 0) {
      F.push({ l: 3, s: R(x, `${x} % 2 == 0 → True ✓`), n: "The <b>if</b> filter passes." });
      out.push(x * x);
      F.push({ l: 1, s: R(x, `${x} * ${x} = ${x * x}`), n: `The expression <b>x * x</b> is added: ${x * x}.` });
    } else {
      rej.push(x);
      F.push({ l: 3, s: R(x, `${x} % 2 == 0 → False ✗ skipped`), n: "Filtered out; nothing is added." });
    }
  }
  F.push({ l: [1, 2, 3], s: R(null, "done"), n: "result = <b>[0, 4, 16, 36]</b>" });
  Stepper(host, "result = [x * x\n          for x in range(7)\n          if x % 2 == 0]", F);
};

W.gen = host => {
  const G = (caller, state, n, out, cls = "mid") => `<div style="display:grid;gap:8px"><div class="nest" style="--c:var(--accent)"><span class="tag">caller</span><code>${esc(caller)}</code></div>
    <div class="nest" style="--c:var(--adv)"><span class="tag">generator object · countdown</span>state: <span class="pill ${cls}">${state}</span> &nbsp; n = <b>${n}</b></div></div><pre class="console">${out}</pre>`;
  Stepper(host, "def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\ngen = countdown(3)\nprint(next(gen))\nprint(next(gen))\nfor x in gen:\n    print(x)", [
    { l: 0, s: G("—", "not created", "—", ""), n: "Press Play and watch the function pause and resume." },
    { l: 6, s: G("gen = countdown(3)", "created, not started", 3, ""), n: "Calling a generator function runs <b>none</b> of its body. You get a generator object, paused before line 1." },
    { l: [7, 2], s: G("next(gen)", "running", 3, "", "ok"), n: "<b>next()</b> resumes it. n &gt; 0 is True." },
    { l: [7, 3], s: G("next(gen) → 3", "paused at yield", 3, "3"), n: "<b>yield</b> hands 3 to the caller and freezes the function, local variables included." },
    { l: [8, 4], s: G("next(gen)", "running", 2, "3", "ok"), n: "The next next() continues right after the yield: n becomes 2." },
    { l: [8, 3], s: G("next(gen) → 2", "paused at yield", 2, "3\n2"), n: "Back around the while loop, yield 2." },
    { l: [9, 4], s: G("for x in gen  (calls next)", "running", 1, "3\n2", "ok"), n: "A <b>for</b> loop calls next() for you." },
    { l: [10, 3], s: G("x = 1", "paused at yield", 1, "3\n2\n1"), n: "yield 1; the loop body prints it." },
    { l: [9, 4], s: G("for x in gen  (calls next)", "running", 0, "3\n2\n1", "ok"), n: "n becomes 0." },
    { l: [9, 2], s: G("loop ends", "finished", 0, "3\n2\n1", "bad"), n: "n &gt; 0 is False, the function ends and raises <b>StopIteration</b>. The for loop catches it and stops quietly." }
  ]);
};

W.deco = host => {
  const D = (act, out) => `<div class="deco"><div class="nest ${act === "t" ? "act" : ""}"><span class="tag">timer · wrapper</span>
    <div class="nest ${act === "l" ? "act" : ""}"><span class="tag">log · wrapper</span>
    <div class="nest ${act === "g" ? "act" : ""}"><span class="tag">greet (original)</span><code>return f"Hello {name}"</code></div></div></div></div><pre class="console">${esc(out)}</pre>`;
  const o1 = "calling greet('Ada',)", o2 = o1 + "\ngreet took 0.0001s";
  Stepper(host, '@timer\n@log\ndef greet(name):\n    return f"Hello {name}"\n\nmsg = greet("Ada")   # really timer(log(greet))("Ada")', [
    { l: [1, 2, 3], s: D("", ""), n: "Decorating happens once, when the function is defined: <code>greet = timer(log(greet))</code>. The name greet now points at the outer wrapper." },
    { l: 6, s: D("t", ""), n: "Calling <code>greet(\"Ada\")</code> enters <b>timer's wrapper</b> first. It starts the clock." },
    { l: 6, s: D("l", o1), n: "timer calls the function it wrapped: <b>log's wrapper</b>, which prints a message." },
    { l: 4, s: D("g", o1), n: "log calls the <b>original greet</b>, which returns \"Hello Ada\"." },
    { l: 6, s: D("l", o1), n: "The return value travels back out through log's wrapper…" },
    { l: 6, s: D("t", o2), n: "…and through timer's wrapper, which stops the clock and prints the time." },
    { l: 6, s: D("", o2), n: "msg = <b>\"Hello Ada\"</b>. The caller never saw the layers." }
  ]);
};

W.copies = host => {
  const sl = (a, b) => `[<span class="slot" data-ref="${a}"></span>, <span class="slot" data-ref="${b}"></span>]`;
  const o = c => O("o", "outer list", sl("i1", "i2"), c), s = c => O("s", "outer list", sl("i1", "i2"), c), d = c => O("d", "outer list", sl("d1", "d2"), c);
  const i1 = (v = "[1, 2]", c = "") => O("i1", "inner list", v, c), i2 = c => O("i2", "inner list", "[3, 4]", c);
  const d1 = c => O("d1", "inner list", "[1, 2]", c), d2 = c => O("d2", "inner list", "[3, 4]", c);
  Stepper(host, "original = [[1, 2], [3, 4]]\nalias = original\nshallow = original.copy()\ndeep = copy.deepcopy(original)\noriginal[0].append(99)", [
    { l: 0, s: mem([], [[], []]), n: "Press Play. Gray dots are references stored inside a list." },
    { l: 1, s: mem([["original", "o"]], [[o("new")], [i1("[1, 2]", "new"), i2("new")]]), n: "One outer list holding references to two inner lists." },
    { l: 2, s: mem([["original", "o"], ["alias", "o"]], [[o()], [i1(), i2()]]), n: "<b>alias</b> is just another name for the same outer list." },
    { l: 3, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"]], [[o(), s("new")], [i1(), i2()]]), n: "<b>copy()</b> makes a new <b>outer</b> list, but its slots point to the <b>same</b> inner lists." },
    { l: 4, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"], ["deep", "d"]], [[o(), s(), d("new")], [i1(), i2(), d1("new"), d2("new")]]), n: "<b>deepcopy()</b> recursively copies the inner lists too." },
    { l: 5, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"], ["deep", "d"]], [[o(), s(), d()], [i1("[1, 2, 99]", "new"), i2(), d1(), d2()]]), n: "Mutating <code>original[0]</code> changes the shared inner list, which original, alias <b>and</b> shallow all reach. Only deep is unaffected." }
  ]);
};

W.async = host => {
  const T = [["A", 2], ["B", 1], ["C", 3]], MAX = 6;
  let mode = "seq", raf = null;
  host.innerHTML = `<div class="ctrl" style="margin-top:0"><button class="chip" data-m="seq" aria-pressed="true">Sequential (await one by one)</button><button class="chip" data-m="async" aria-pressed="false">asyncio.gather (concurrent)</button><button class="btn pri" data-m="play">▶ Play</button><b id="aClock" style="font-family:var(--font-mono)"></b></div>
  <div class="bars">${T.map(t => `<div class="bar-row"><span>task ${t[0]} · ${t[1]}s</span><div class="bar-track" data-t="${t[0]}"><div class="bar-seg"></div></div></div>`).join("")}
  <div class="bar-row"><span></span><div style="display:flex;justify-content:space-between;font:.72rem var(--font-mono);color:var(--muted)">${[0, 1, 2, 3, 4, 5, 6].map(s => `<span>${s}s</span>`).join("")}</div></div></div>
  <div class="stp-note" id="aNote" style="margin-top:10px"></div>`;
  const sched = () => { let c = 0; return T.map(([n, d]) => mode === "seq" ? [c, (c += d)] : [0, d]); };
  function draw(t) {
    const S = sched(), total = Math.max(...S.map(x => x[1]));
    $$(".bar-track", host).forEach((tr, k) => {
      const [a, b] = S[k], seg = $(".bar-seg", tr), end = Math.min(b, t);
      seg.style.left = (a / MAX * 100) + "%"; seg.style.width = (t > a ? (end - a) / MAX * 100 : 0) + "%";
      seg.classList.toggle("wait", mode === "async");
    });
    $("#aClock", host).textContent = `t = ${Math.min(t, total).toFixed(1)}s`;
    $("#aNote", host).innerHTML = mode === "seq"
      ? `Each <code>await download()</code> finishes before the next starts. Total: <b>${total.toFixed(1)}s</b> (2 + 1 + 3).`
      : `All three start at once; while one waits on the network the loop runs the others. Total: <b>${total.toFixed(1)}s</b>, the longest single task. Hatched = waiting, not using the CPU.`;
    return total;
  }
  function play() {
    cancelAnimationFrame(raf); const t0 = performance.now(), total = draw(0);
    const tick = now => { const t = (now - t0) / 700; draw(t); if (t < total) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    if (b.dataset.m === "play") { play(); return; }
    mode = b.dataset.m; $$(".chip", host).forEach(c => c.setAttribute("aria-pressed", c === b)); cancelAnimationFrame(raf); draw(99);
  });
  draw(99);
};

W.bigo = host => {
  const P = { x0: 50, x1: 500, y0: 260, y1: 20 }, NX = 32, NY = 160;
  const fs = [["O(1)", n => 1, "var(--good)"], ["O(log n)", n => Math.log2(n), "var(--accent)"], ["O(n)", n => n, "var(--warn)"], ["O(n log n)", n => n * Math.log2(n), "var(--adv)"], ["O(n²)", n => n * n, "var(--bad)"]];
  const X = n => P.x0 + (n / NX) * (P.x1 - P.x0), Y = v => P.y0 - (Math.min(v, NY) / NY) * (P.y0 - P.y1);
  let g = "";
  for (let v = 0; v <= NY; v += 40) g += `<line x1="${P.x0}" x2="${P.x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${P.x0 - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  for (let n = 0; n <= NX; n += 8) g += `<text x="${X(n)}" y="${P.y0 + 18}" text-anchor="middle" font-size="11" fill="var(--muted)">${n}</text>`;
  g += `<text x="${(P.x0 + P.x1) / 2}" y="${P.y0 + 36}" text-anchor="middle" font-size="12" fill="var(--muted)">input size n</text><text x="14" y="${P.y1 + 4}" font-size="12" fill="var(--muted)">ops</text>`;
  let lines = "";
  fs.forEach(([name, f, c]) => {
    let d = "", lx = P.x1, ly;
    for (let n = 1; n <= NX; n += 0.25) {
      const v = f(n);
      d += (d ? "L" : "M") + X(n).toFixed(1) + " " + Y(v).toFixed(1);
      if (v > NY) { lx = X(n); ly = P.y1; break; }
      lx = X(n); ly = Y(v);
    }
    lines += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5"/><text x="${Math.min(lx + 6, P.x1 + 6)}" y="${ly < P.y1 + 6 ? P.y1 + 12 : ly + 4}" font-size="12" font-weight="700" fill="${c}">${name}</text>`;
  });
  host.innerHTML = `<div class="svg-wrap"><svg viewBox="0 0 590 300" width="100%" style="min-width:480px" role="img" aria-label="Growth of common complexity classes">${g}${lines}<line id="boM" y1="${P.y1}" y2="${P.y0}" stroke="var(--ink)" stroke-dasharray="4 4"/></svg></div>
  <div class="ctrl"><label for="boN">n =</label><input id="boN" type="range" min="1" max="32" value="16" style="flex:1;max-width:300px"><b id="boV" style="font-family:var(--font-mono)"></b></div><div class="kv" id="boK"></div>`;
  const r = $("#boN", host);
  function upd() {
    const n = +r.value; $("#boV", host).textContent = n;
    const m = $("#boM", host); m.setAttribute("x1", X(n)); m.setAttribute("x2", X(n));
    $("#boK", host).innerHTML = fs.map(([name, f, c]) => `<span style="color:${c}">${name}: <b style="color:inherit">${Math.round(f(n) * 10) / 10}</b></span>`).join("");
  }
  r.addEventListener("input", upd); upd();
};

$$(".widget").forEach(w => { const f = W[w.dataset.w]; if (f) f(w); });

/* ---------- table of contents, progress, filters ---------- */
const lessons = $$(".lesson");
const toc = $("#toc");
let html = "", grp = "";
lessons.forEach((s, k) => {
  if (s.dataset.group !== grp) { grp = s.dataset.group; html += `<h4>${grp}</h4>`; }
  html += `<a href="#${s.id}" data-id="${s.id}"><span class="n">${String(k + 1).padStart(2, "0")}</span>${$("h2", s).textContent}</a>`;
});
toc.innerHTML = `<a href="#top" data-id="top" style="font-weight:600"><span class="n">▶</span>Playground</a>` + html;

let done = new Set(store.get("pyvis-done", []));
const countable = lessons.filter(s => s.id !== "cheatsheet");
function paintDone() {
  $$(".toc a").forEach(a => a.classList.toggle("done", done.has(a.dataset.id)));
  $("#prog").style.width = (countable.filter(s => done.has(s.id)).length / countable.length * 100) + "%";
}
countable.forEach(s => {
  const row = document.createElement("div"); row.className = "done-row";
  row.innerHTML = `<button class="done-btn" type="button" aria-pressed="${done.has(s.id)}">${done.has(s.id) ? "✓ Done" : "Mark lesson as done"}</button>`;
  s.append(row);
  row.firstChild.addEventListener("click", e => {
    const on = !done.has(s.id); on ? done.add(s.id) : done.delete(s.id);
    e.target.setAttribute("aria-pressed", on); e.target.textContent = on ? "✓ Done" : "Mark lesson as done";
    store.set("pyvis-done", [...done]); paintDone();
  });
});
paintDone();

const io = new IntersectionObserver(ents => {
  ents.forEach(en => { if (en.isIntersecting) $$(".toc a").forEach(a => a.classList.toggle("on", a.dataset.id === en.target.id)); });
}, { rootMargin: "-30% 0px -60% 0px" });
lessons.forEach(s => io.observe(s));

const menuBtn = $("#menuBtn"), scrim = $("#scrim");
const setMenu = open => { toc.classList.toggle("open", open); scrim.classList.toggle("on", open); menuBtn.setAttribute("aria-expanded", open); };
menuBtn.addEventListener("click", () => setMenu(!toc.classList.contains("open")));
scrim.addEventListener("click", () => setMenu(false));
toc.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });

let level = "all";
const empty = document.createElement("p"); empty.className = "empty-msg"; empty.textContent = "No lessons match. Try a shorter search term."; $("#main").insertBefore(empty, $("footer"));
function applyFilter() {
  const q = $("#q").value.trim().toLowerCase();
  let shown = 0;
  lessons.forEach(s => {
    let vis = level === "all" || s.dataset.level === level || s.dataset.level === "ref";
    if (vis && q) {
      if (s.id === "cheatsheet") {
        let any = false;
        $$(".cc", s).forEach(c => { const m = c.textContent.toLowerCase().includes(q); c.hidden = !m; any = any || m; });
        vis = any;
      } else vis = s.textContent.toLowerCase().includes(q);
    } else if (s.id === "cheatsheet") $$(".cc", s).forEach(c => { c.hidden = false; });
    s.hidden = !vis; if (vis && s.id !== "cheatsheet") shown++;
    const a = $(`.toc a[data-id="${s.id}"]`); if (a) a.hidden = !vis;
  });
  empty.style.display = shown || !$("#cheatsheet").hidden ? "none" : "block";
  $$(".toc h4").forEach(h => { let n = h.nextElementSibling, any = false; while (n && n.tagName === "A") { any = any || !n.hidden; n = n.nextElementSibling; } h.hidden = !any; });
  setTimeout(redrawAll, 30);
}
let qt; $("#q").addEventListener("input", () => { clearTimeout(qt); qt = setTimeout(applyFilter, 150); });
$$(".chip[data-f]").forEach(c => c.addEventListener("click", () => {
  level = c.dataset.f; $$(".chip[data-f]").forEach(x => x.setAttribute("aria-pressed", x === c)); applyFilter();
  const first = lessons.find(s => !s.hidden); if (first && level !== "all") first.scrollIntoView({ behavior: "smooth" });
}));
document.fonts && document.fonts.ready.then(redrawAll);
})();
