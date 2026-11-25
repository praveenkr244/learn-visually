/* JavaScript, Visually — interactive diagrams and widgets.
   Runnable code, the playground, search and the Stepper/mem helpers come from /assets/jsts.js (window.LV). */
(() => {
"use strict";
const { $, $$, esc, Stepper, mem, O } = window.LV;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = {};

W.vars = host => {
  const code = 'let x = 10;\nlet y = x;\nx = x + 5;\nconst a = [1, 2];\nconst b = a;\nb.push(3);\nconst c = [...a];\nc.push(4);';
  const base = [O("p1", "number", "10"), O("p2", "number", "15")];
  const n = (...pairs) => pairs;
  Stepper(host, code, [
    { l: 0, s: mem([], [[]], "Variables"), n: "Press <b>Next</b> or <b>Play</b> to run the code one line at a time." },
    { l: 1, s: mem(n(["x", "p1"]), [[O("p1", "number", "10", "new")]], "Variables"), n: "The variable <b>x</b> holds the primitive value 10." },
    { l: 2, s: mem(n(["x", "p1"], ["y", "p1b"]), [[O("p1", "number", "10"), O("p1b", "number", "10", "new")]], "Variables"), n: "<b>y = x</b> copies the <b>value</b>. Primitives are always copied, so y has its own 10." },
    { l: 3, s: mem(n(["x", "p2"], ["y", "p1b"]), [[O("p2", "number", "15", "new"), O("p1b", "number", "10")]], "Variables"), n: "x now holds 15. y is untouched: it was a copy." },
    { l: 4, s: mem(n(["x", "p2"], ["y", "p1b"], ["a", "o1"]), [[O("p2", "number", "15"), O("p1b", "number", "10")], [O("o1", "array", "[1, 2]", "new")]], "Variables"), n: "An array is an <b>object</b>. It lives in memory once and <b>a</b> holds a <b>reference</b> (an arrow) to it." },
    { l: 5, s: mem(n(["x", "p2"], ["y", "p1b"], ["a", "o1"], ["b", "o1"]), [[O("p2", "number", "15"), O("p1b", "number", "10")], [O("o1", "array", "[1, 2]")]], "Variables"), n: "<b>b = a</b> copies the <b>reference</b>, not the array. Two names, one array." },
    { l: 6, s: mem(n(["x", "p2"], ["y", "p1b"], ["a", "o1"], ["b", "o1"]), [[O("p2", "number", "15"), O("p1b", "number", "10")], [O("o1", "array", "[1, 2, 3]", "new")]], "Variables"), n: "<b>push</b> changes the shared array, so <code>a</code> shows [1, 2, 3] too. (const only stops reassigning the name.)" },
    { l: 7, s: mem(n(["x", "p2"], ["y", "p1b"], ["a", "o1"], ["b", "o1"], ["c", "o2"]), [[O("p2", "number", "15"), O("p1b", "number", "10")], [O("o1", "array", "[1, 2, 3]"), O("o2", "array", "[1, 2, 3]", "new")]], "Variables"), n: "Spread <code>[...a]</code> builds a <b>new</b> array with the same items." },
    { l: 8, s: mem(n(["x", "p2"], ["y", "p1b"], ["a", "o1"], ["b", "o1"], ["c", "o2"]), [[O("p2", "number", "15"), O("p1b", "number", "10")], [O("o1", "array", "[1, 2, 3]"), O("o2", "array", "[1, 2, 3, 4]", "new")]], "Variables"), n: "Only c's array changed. <code>a === b</code> → true, <code>a === c</code> → false." }
  ]);
};

W.coerce = host => {
  const vals = [["0", 0], ['""', ""], ['"0"', "0"], ['"42"', "42"], ['" "', " "], ["null", null], ["undefined", undefined], ["NaN", NaN], ["[]", []], ["[5]", [5]], ["{}", {}], ["true", true]];
  const show = v => v === undefined ? "undefined" : typeof v === "string" ? JSON.stringify(v) : Number.isNaN(v) ? "NaN" : Array.isArray(v) ? `[${v}]`.replace(/^\[\]$/, "[]") : typeof v === "object" && v ? "{}" : String(v);
  host.innerHTML = `<div class="ctrl" style="margin-top:0">${vals.map(([l], i) => `<button class="btn" data-c="${i}">${esc(l)}</button>`).join("")}</div>
  <div class="tbl" id="coT"></div>`;
  const pick = i => {
    const [label, v] = vals[i];
    $$("[data-c]", host).forEach(b => b.classList.toggle("pri", +b.dataset.c === i));
    const rows = [
      ["typeof v", JSON.stringify(typeof v)], ["Boolean(v)  (truthy?)", String(Boolean(v))], ["Number(v)", show(Number(v))], ["String(v)", JSON.stringify(String(v))],
      ["v == 0", String(v == 0)], ["v === 0", String(v === 0)], ["v == null", String(v == null)], ["v ?? \"default\"", show(v ?? "default")], ["v || \"default\"", show(v || "default")]
    ];
    $("#coT", host).innerHTML = `<table><tr><th>Expression (v = <code>${esc(label)}</code>)</th><th>Result</th></tr>${rows.map(([e, r]) => `<tr><td><code>${esc(e)}</code></td><td><b>${esc(r)}</b></td></tr>`).join("")}</table>`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (b) pick(+b.dataset.c); });
  pick(0);
};

W.flow = host => {
  host.innerHTML = `<div class="svg-wrap"><svg viewBox="0 0 690 250" width="100%" style="min-width:560px" role="img" aria-label="Flowchart of if, else if, else on temperature">
  <path id="fe1" class="fl-e" d="M130 115 H178"/><path id="fe2" class="fl-e" d="M250 75 V30 H378"/><path id="fe3" class="fl-e" d="M320 115 H368"/><path id="fe4" class="fl-e" d="M510 115 H558"/><path id="fe5" class="fl-e" d="M440 155 V198"/>
  <text class="fl-lab" x="258" y="60">true</text><text class="fl-lab" x="326" y="108">false</text><text class="fl-lab" x="516" y="108">true</text><text class="fl-lab" x="448" y="182">false</text>
  <g class="fl-n" id="fnS"><rect x="10" y="95" width="120" height="40" rx="20"/><text x="70" y="120" id="fnST">temp = 22</text></g>
  <g class="fl-n" id="fnD1"><polygon points="250,75 320,115 250,155 180,115"/><text x="250" y="120">temp &gt; 30</text></g>
  <g class="fl-n" id="fnD2"><polygon points="440,75 510,115 440,155 370,115"/><text x="440" y="120">temp &gt; 15</text></g>
  <g class="fl-n res" id="fnH"><rect x="370" y="10" width="140" height="40" rx="8"/><text x="440" y="35">log("hot")</text></g>
  <g class="fl-n res" id="fnP"><rect x="560" y="95" width="124" height="40" rx="8"/><text x="622" y="120">log("pleasant")</text></g>
  <g class="fl-n res" id="fnC"><rect x="370" y="200" width="140" height="40" rx="8"/><text x="440" y="225">log("cold")</text></g>
  </svg></div>
  <div class="ctrl"><label for="tempR">temp</label><input id="tempR" type="range" min="-10" max="45" value="22" style="flex:1;max-width:320px"><b id="tempV" style="font-family:var(--font-mono)"></b></div>
  <div class="stp-note" id="tempOut" style="margin-top:10px"></div>`;
  const r = $("#tempR", host);
  function render() {
    const t = +r.value;
    $("#tempV", host).textContent = t + "°C"; $("#fnST", host).textContent = "temp = " + t;
    let nodes, edges, msg;
    if (t > 30) { nodes = ["fnS", "fnD1", "fnH"]; edges = ["fe1", "fe2"]; msg = `<code>${t} &gt; 30</code> is <b>true</b> → logs <b>hot</b>. The else if and else are skipped.`; }
    else if (t > 15) { nodes = ["fnS", "fnD1", "fnD2", "fnP"]; edges = ["fe1", "fe3", "fe4"]; msg = `<code>${t} &gt; 30</code> is false → <code>${t} &gt; 15</code> is <b>true</b> → logs <b>pleasant</b>.`; }
    else { nodes = ["fnS", "fnD1", "fnD2", "fnC"]; edges = ["fe1", "fe3", "fe5"]; msg = "Both conditions are false → the <b>else</b> block logs <b>cold</b>."; }
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
  F.push({ l: 1, s: st(-1), n: "The array <b>nums</b> is created." });
  let total = 0;
  F.push({ l: 2, s: st(-1, null, 0), n: "<b>total</b> starts at 0. It uses <code>let</code> because it will change." });
  nums.forEach((v, k) => {
    F.push({ l: 3, s: st(k, v, total), n: `<b>for…of</b> takes the next item: a fresh <b>const n = ${v}</b> for this round.` });
    total += v;
    F.push({ l: 4, s: st(k, v, total), n: `The body runs: total = ${total - v} + ${v} = <b>${total}</b>.` });
  });
  F.push({ l: 5, s: st(-1, null, total), n: "No items left, so the loop ends. (n only existed inside the loop.)" });
  F.push({ l: 6, s: st(-1, null, total, "27"), n: "Execution continues after the loop." });
  Stepper(host, "const nums = [4, 8, 15];\nlet total = 0;\nfor (const n of nums) {\n  total += n;\n}\nconsole.log(total);", F);
};

W.arrayops = host => {
  let arr = [5, 2, 9], pool = [7, 1, 10, 3, 6, 4], pi = 0, changed = [], last = "";
  const ops = ["push(x)", "unshift(x)", "pop()", "shift()", "splice(1, 1)", "sort()", "sort((a,b)=>a-b)", "reverse()", "reset"];
  host.innerHTML = `<div class="cells" id="aoCells"></div>
  <div class="ctrl">${ops.map(o => `<button class="btn ${o === "push(x)" ? "pri" : ""}" data-o="${esc(o)}">${o === "reset" ? "⟲ Reset" : "nums." + esc(o)}</button>`).join("")}</div>
  <div class="stp-note" id="aoNote" style="margin-top:10px"></div>`;
  const all = () => arr.map((_, i) => i);
  function render() {
    $("#aoCells", host).innerHTML = arr.length ? arr.map((v, i) => `<div class="cell ${changed.includes(i) ? "hit flash" : ""}">${v}<small>[${i}]</small></div>`).join("") : `<span class="stp-count">[] (empty array)</span>`;
    $("#aoNote", host).innerHTML = last || "nums = [5, 2, 9]. Try the buttons; x is the next number from a pool.";
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-o]"); if (!b) return;
    const o = b.dataset.o; changed = [];
    const full = arr.length >= 10;
    if (o === "reset") { arr = [5, 2, 9]; last = ""; }
    else if (o === "push(x)") { if (full) last = "Kept short for the demo: pop something first."; else { const x = pool[pi++ % pool.length]; arr.push(x); changed = [arr.length - 1]; last = `<code>nums.push(${x})</code> adds at the end and returns the new length (${arr.length}). Fast: nothing else moves.`; } }
    else if (o === "unshift(x)") { if (full) last = "Kept short for the demo: pop something first."; else { const x = pool[pi++ % pool.length]; arr.unshift(x); changed = all(); last = `<code>nums.unshift(${x})</code> adds at the start: every other item moves up one index. Slower for big arrays.`; } }
    else if (o === "pop()") { const v = arr.pop(); last = v === undefined ? "<code>pop()</code> on an empty array returns <b>undefined</b> (no error)." : `<code>nums.pop()</code> removed and returned <b>${v}</b> from the end.`; }
    else if (o === "shift()") { const v = arr.shift(); changed = all(); last = v === undefined ? "<code>shift()</code> on an empty array returns <b>undefined</b>." : `<code>nums.shift()</code> returned <b>${v}</b>; every other item moved down one index.`; }
    else if (o === "splice(1, 1)") { if (arr.length < 2) last = "Needs at least 2 items."; else { const r = arr.splice(1, 1); changed = all().slice(1); last = `<code>nums.splice(1, 1)</code> removed <b>[${r}]</b> at index 1 and closed the gap.`; } }
    else if (o === "sort()") { arr.sort(); changed = all(); last = `<code>nums.sort()</code> with no function compares items <b>as strings</b>: "10" comes before "2"!`; }
    else if (o === "sort((a,b)=>a-b)") { arr.sort((p, q) => p - q); changed = all(); last = "<code>sort((a, b) =&gt; a - b)</code> sorts numerically, in place. Negative result → a first."; }
    else if (o === "reverse()") { arr.reverse(); changed = all(); last = "<code>reverse()</code> flips the order in place."; }
    render();
  });
  render();
};

W.stack = host => {
  const F = [];
  const R = (fr, out = "", isNew = false) => `<div class="stack"><div class="frame" style="border-color:var(--muted)">(script) <small>console.log(fact(4))</small></div>${fr.map((f, k) => `<div class="frame ${k === fr.length - 1 ? "top" : ""} ${isNew && k === fr.length - 1 ? "new" : ""}">fact(n=${f.n}) <small>${f.s}</small></div>`).join("")}</div><pre class="console">${out}</pre>`;
  const cp = fr => fr.map(f => ({ ...f }));
  F.push({ l: 5, s: R([]), n: "The script calls <b>fact(4)</b>. Press Play." });
  const fr = [];
  for (let n = 4; n >= 1; n--) {
    fr.push({ n, s: "running" });
    F.push({ l: 1, s: R(cp(fr), "", true), n: `A new frame for <b>fact(${n})</b> is pushed on the call stack, with its own <b>n = ${n}</b>.` });
    if (n > 1) {
      F.push({ l: 2, s: R(cp(fr)), n: `${n} &lt;= 1 is false.` });
      fr[fr.length - 1].s = `waiting for fact(${n - 1})`;
      F.push({ l: 3, s: R(cp(fr)), n: `It needs <b>fact(${n - 1})</b> first, so this frame pauses and the function calls itself.` });
    } else {
      F.push({ l: 2, s: R(cp(fr)), n: "1 &lt;= 1 is true: the <b>base case</b> stops the recursion." });
      fr[fr.length - 1].s = "returns 1";
      F.push({ l: 2, s: R(cp(fr)), n: "fact(1) returns 1 and its frame is popped off the stack." });
    }
  }
  let val = 1;
  for (let n = 2; n <= 4; n++) {
    fr.pop(); const prev = val; val *= n;
    fr[fr.length - 1].s = `returns ${n} × ${prev} = ${val}`;
    F.push({ l: 3, s: R(cp(fr)), n: `Back in fact(${n}): ${n} * ${prev} = <b>${val}</b>. It returns and its frame pops.` });
  }
  F.push({ l: 5, s: R([], "24"), n: "Every fact frame is gone. <b>console.log</b> prints 24." });
  Stepper(host, "function fact(n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}\nconsole.log(fact(4));", F);
};

W.scope = host => {
  host.innerHTML = `<div class="legb">
  <div class="nest" data-lv="G" style="--c:var(--adv)"><span class="tag">Global: Math, console, JSON, … · const appName = "Todo"</span>
   <div class="nest" data-lv="F" style="--c:var(--accent)"><span class="tag">function render() { const title = "My list" }</span>
    <div class="nest" data-lv="B" style="--c:var(--good)"><span class="tag">block if (…) { const count = 3 }</span><code id="scCode">console.log(count)</code></div>
   </div></div></div>
  <div class="ctrl"><span class="stp-count">Look up:</span>${["count", "title", "appName", "Math", "total"].map(n => `<button class="btn" data-n="${n}">${n}</button>`).join("")}</div>
  <div class="stp-note" id="scOut" style="margin-top:10px">Pick a name used inside the block.</div>`;
  const where = { count: "B", title: "F", appName: "G", Math: "G" }, names = { B: "Block", F: "Function", G: "Global" };
  let busy = false;
  host.addEventListener("click", async e => {
    const b = e.target.closest("[data-n]"); if (!b || busy) return; busy = true;
    const n = b.dataset.n, out = $("#scOut", host), trail = [];
    $("#scCode", host).textContent = `console.log(${n})`;
    $$(".nest", host).forEach(x => x.classList.remove("here", "found"));
    for (const lv of ["B", "F", "G"]) {
      const box = $(`[data-lv="${lv}"]`, host);
      $$(".nest", host).forEach(x => x.classList.remove("here"));
      box.classList.add("here");
      await sleep(600);
      if (where[n] === lv) { box.classList.replace("here", "found"); trail.push(`<b>${names[lv]}</b> ✓`); out.innerHTML = trail.join(" → ") + ` Found <code>${n}</code>.`; busy = false; return; }
      trail.push(`${names[lv]} ✗`); out.innerHTML = trail.join(" → ");
    }
    $$(".nest", host).forEach(x => x.classList.remove("here"));
    out.innerHTML = trail.join(" → ") + ` <b style="color:var(--bad)">ReferenceError: ${n} is not defined</b>`;
    busy = false;
  });
};

W.pipeline = host => {
  const items = [{ n: "Laptop", p: 1200, s: true }, { n: "Mouse", p: 25, s: false }, { n: "Desk", p: 300, s: true }, { n: "Lamp", p: 45, s: true }];
  const card = (x, cls = "") => `<div class="cell ${cls}" style="min-width:74px">${x.n}<small>$${x.p}${x.s ? "" : " · out"}</small></div>`;
  const row = (label, html) => `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;margin:6px 0"><span class="stp-count">${label}</span><div class="cells">${html}</div></div>`;
  const F = [];
  const kept = [], names = [];
  let sum = null;
  const S = (cur, stage) => row("products", items.map((x, i) => card(x, stage === "f" && i === cur ? "hit" : stage === "f" && i < cur && !x.s ? "miss" : !x.s && stage !== "f" ? "miss" : "")).join("")) +
    row(".filter", kept.map((x, i) => card(x, stage === "m" && i === cur ? "hit" : "")).join("") || '<span class="stp-count">[ ]</span>') +
    row(".map", names.map((x, i) => `<div class="cell ${stage === "r" && i === cur ? "hit" : ""}">${x}</div>`).join("") || '<span class="stp-count">[ ]</span>') +
    row(".reduce", sum === null ? '<span class="stp-count">—</span>' : `<div class="cell hit">${sum}</div>`);
  F.push({ l: 0, s: S(-1), n: "Three steps, each producing a new array (or value). Press Play." });
  items.forEach((x, i) => {
    if (x.s) kept.push(x);
    F.push({ l: 2, s: S(i, "f"), n: `filter: <code>p.inStock</code> is <b>${x.s}</b> for ${x.n} → ${x.s ? "kept" : "dropped"}.` });
  });
  kept.forEach((x, i) => {
    names.push(x.n.toUpperCase());
    F.push({ l: 3, s: S(i, "m"), n: `map: ${x.n} → <b>"${x.n.toUpperCase()}"</b>. map always returns one item per input item.` });
  });
  let acc = 0;
  kept.forEach((x, i) => {
    sum = `${acc} + ${x.p} = ${acc + x.p}`; acc += x.p;
    F.push({ l: 4, s: S(i, "r"), n: `reduce: the accumulator was ${acc - x.p}, add ${x.n}'s price → <b>${acc}</b>.` });
  });
  sum = String(acc);
  F.push({ l: [2, 3, 4], s: S(-1, "done"), n: `Result: names = [${names.map(n => `"${n}"`).join(", ")}], total = <b>${acc}</b>. The original array is unchanged.` });
  Stepper(host, "const inStock = products\n  .filter(p => p.inStock);\nconst names = inStock.map(p => p.name.toUpperCase());\nconst total = inStock.reduce((sum, p) => sum + p.price, 0);", F);
};

W.closure = host => {
  const env = (envs, out = "") => `<div style="display:grid;gap:8px">${envs.map(e => `<div class="nest" style="--c:${e.c}"><span class="tag">${e.t}</span>${e.v}</div>`).join("")}</div><pre class="console">${out}</pre>`;
  const A = (n, st = "kept alive by counterA") => ({ t: `scope of makeCounter() call #1 · ${st}`, v: `count = <b>${n}</b>`, c: "var(--accent)" });
  const B = (n) => ({ t: "scope of makeCounter() call #2 · kept alive by counterB", v: `count = <b>${n}</b>`, c: "var(--adv)" });
  Stepper(host, "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counterA = makeCounter();\nconst counterB = makeCounter();\nconsole.log(counterA(), counterA());\nconsole.log(counterB());", [
    { l: 0, s: env([]), n: "Press Play to see where <code>count</code> lives." },
    { l: [5, 2], s: env([A(0, "running")]), n: "Calling makeCounter() creates a new <b>scope</b> with <code>count = 0</code>." },
    { l: [5, 3], s: env([A(0)]), n: "It returns an arrow function. The function <b>remembers</b> the scope it was created in. That pair is a <b>closure</b>. The scope stays alive after makeCounter returns." },
    { l: [6, 2], s: env([A(0), B(0)]), n: "A second call makes a <b>second, separate</b> scope with its own count." },
    { l: [7, 3], s: env([A(1), B(0)], "1"), n: "counterA() runs <code>++count</code> in <b>its</b> scope: 1." },
    { l: [7, 3], s: env([A(2), B(0)], "1 2"), n: "Again: 2. The value survives between calls because the scope is still referenced." },
    { l: [8, 3], s: env([A(2), B(1)], "1 2\n1"), n: "counterB has its own count, so it prints 1. Nothing outside can reach <code>count</code> directly: it's private." }
  ]);
};

W.proto = host => {
  host.innerHTML = `<div class="chain" id="pcChain">
    <div class="nest" data-p="o" style="--c:var(--good)"><span class="tag">rex (the object)</span><code>name: "Rex"</code></div><span class="ar2">→</span>
    <div class="nest" data-p="d" style="--c:var(--accent)"><span class="tag">Dog.prototype</span><code>bark()</code></div><span class="ar2">→</span>
    <div class="nest" data-p="a" style="--c:var(--warn)"><span class="tag">Animal.prototype</span><code>eat()</code></div><span class="ar2">→</span>
    <div class="nest" data-p="b" style="--c:var(--adv)"><span class="tag">Object.prototype</span><code>toString() hasOwnProperty()</code></div><span class="ar2">→</span>
    <span class="pill bad">null</span></div>
  <div class="ctrl"><span class="stp-count">Read rex.</span>${["name", "bark", "eat", "toString", "fly"].map(n => `<button class="btn" data-n="${n}">${n}</button>`).join("")}</div>
  <div class="stp-note" id="pcOut" style="margin-top:10px">Pick a property to look up. <code>class Dog extends Animal</code>; <code>const rex = new Dog("Rex")</code>.</div>`;
  const where = { name: "o", bark: "d", eat: "a", toString: "b" }, label = { o: "rex itself", d: "Dog.prototype", a: "Animal.prototype", b: "Object.prototype" };
  let busy = false;
  host.addEventListener("click", async e => {
    const b = e.target.closest("[data-n]"); if (!b || busy) return; busy = true;
    const n = b.dataset.n, out = $("#pcOut", host), trail = [];
    $$("[data-p]", host).forEach(x => x.classList.remove("here", "found"));
    for (const p of ["o", "d", "a", "b"]) {
      const box = $(`[data-p="${p}"]`, host);
      $$("[data-p]", host).forEach(x => x.classList.remove("here"));
      box.classList.add("here"); await sleep(550);
      if (where[n] === p) { box.classList.replace("here", "found"); trail.push(`<b>${label[p]}</b> ✓`); out.innerHTML = trail.join(" → ") + ` <code>rex.${n}</code> found.`; busy = false; return; }
      trail.push(`${label[p]} ✗`); out.innerHTML = trail.join(" → ");
    }
    $$("[data-p]", host).forEach(x => x.classList.remove("here"));
    out.innerHTML = trail.join(" → ") + ` → null: <code>rex.${n}</code> is <b>undefined</b> (reading a missing property is not an error).`;
    busy = false;
  });
  host.classList.add("legb");
};

W.thisw = host => {
  const cases = [
    ["user.greet()", "user", "Called as a method <b>on user</b>: this is the object before the dot."],
    ["const f = user.greet; f()", "undefined", "Called on its own: no object before the dot, so this is <b>undefined</b> (in strict mode, which modules and classes always use)."],
    ["user.greet.call(admin)", "admin", "<code>call</code> and <code>apply</code> run the function once with this set explicitly."],
    ["user.greet.bind(admin)()", "admin", "<code>bind</code> returns a new function with this locked forever."],
    ["setTimeout(user.greet, 0)", "undefined", "The timer calls the function on its own later: this is lost. Fix: <code>() =&gt; user.greet()</code>."],
    ["new Greeter()", "the new object", "With <code>new</code>, this is the brand-new object being built."],
    ["arrow inside greet()", "same as greet's this", "Arrow functions have no this of their own: they use the surrounding function's."]
  ];
  host.innerHTML = `<pre class="mini" style="margin:0 0 8px">const user = { name: "Ada", greet() { return this; } };\nconst admin = { name: "Root" };</pre>
  <div class="ctrl" style="margin-top:0">${cases.map((c, i) => `<button class="btn" data-t="${i}"><code style="background:none;padding:0">${esc(c[0])}</code></button>`).join("")}</div>
  <div class="stp-note" id="thOut" style="margin-top:10px"></div>`;
  const pick = i => {
    const [call, v, why] = cases[i];
    $$("[data-t]", host).forEach(b => b.classList.toggle("pri", +b.dataset.t === i));
    $("#thOut", host).innerHTML = `<code>${esc(call)}</code> → this is <b>${esc(v)}</b><br>${why}`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) pick(+b.dataset.t); });
  pick(0);
};

W.eventloop = host => {
  const lane = (title, items, c) => `<div class="lane"><h5>${title}</h5>${items.map(x => `<div class="it" style="--c:${c}">${esc(x)}</div>`).join("")}</div>`;
  const S = (stack, micro, tasks, out, web = []) => `<div class="loop-grid">${lane("Call stack (running now)", stack, "var(--accent)")}${lane("Microtask queue (promises)", micro, "var(--good)")}${lane("Task queue (timers, events)", tasks, "var(--warn)")}</div>
    ${web.length ? `<div class="kv"><span>Browser / Node timer: <b>${esc(web.join(", "))}</b></span></div>` : ""}<pre class="console">${out}</pre>`;
  Stepper(host, 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");', [
    { l: 0, s: S([], [], [], ""), n: "Press Play. The whole script is itself one task on the call stack." },
    { l: 1, s: S(["script", 'console.log("A")'], [], [], "A"), n: "Synchronous code runs right away: <b>A</b>." },
    { l: 2, s: S(["script", "setTimeout(…, 0)"], [], [], "A", ["0 ms timer"]), n: "setTimeout hands the callback to the timer system and returns immediately." },
    { l: 2, s: S(["script"], [], ["() => log(\"B\")"], "A"), n: "The 0 ms timer is done, so its callback joins the <b>task queue</b>. It must wait for the stack to empty." },
    { l: 3, s: S(["script", "Promise…then(…)"], ["() => log(\"C\")"], ["() => log(\"B\")"], "A"), n: "The promise is already resolved, so the then-callback goes into the <b>microtask queue</b>." },
    { l: 4, s: S(["script", 'console.log("D")'], ["() => log(\"C\")"], ["() => log(\"B\")"], "A\nD"), n: "Still synchronous: <b>D</b>." },
    { l: 4, s: S([], ["() => log(\"C\")"], ["() => log(\"B\")"], "A\nD"), n: "The script finishes and the stack is empty. The event loop now checks the queues: <b>microtasks first</b>, all of them." },
    { l: 3, s: S(['() => log("C")'], [], ["() => log(\"B\")"], "A\nD\nC"), n: "The promise callback runs: <b>C</b>." },
    { l: 2, s: S(['() => log("B")'], [], [], "A\nD\nC\nB"), n: "Microtasks are empty, so the loop takes the next <b>task</b>: the timer callback logs <b>B</b>." },
    { l: [1, 2, 3, 4], s: S([], [], [], "A\nD\nC\nB"), n: "Final order: <b>A D C B</b>. Sync code → microtasks → tasks." }
  ]);
};

W.asyncbars = host => {
  const T = [["A", 2], ["B", 1], ["C", 3]], MAX = 6;
  let mode = "seq", raf = null;
  host.innerHTML = `<div class="ctrl" style="margin-top:0"><button class="chip" data-m="seq" aria-pressed="true">await one by one</button><button class="chip" data-m="par" aria-pressed="false">await Promise.all([…])</button><button class="btn pri" data-m="play">▶ Play</button><b id="abClock" style="font-family:var(--font-mono)"></b></div>
  <div class="bars">${T.map(t => `<div class="bar-row"><span>${t[0]} · ${t[1]}00ms</span><div class="bar-track"><div class="bar-seg"></div></div></div>`).join("")}
  <div class="bar-row"><span></span><div style="display:flex;justify-content:space-between;font:.72rem var(--font-mono);color:var(--muted)">${[0, 1, 2, 3, 4, 5, 6].map(s => `<span>${s}00</span>`).join("")}</div></div></div>
  <div class="stp-note" id="abNote" style="margin-top:10px"></div>`;
  const sched = () => { let c = 0; return T.map(([, d]) => mode === "seq" ? [c, (c += d)] : [0, d]); };
  function draw(t) {
    const S = sched(), total = Math.max(...S.map(x => x[1]));
    $$(".bar-track", host).forEach((tr, k) => {
      const [a, b] = S[k], seg = $(".bar-seg", tr), end = Math.min(b, t);
      seg.style.left = (a / MAX * 100) + "%"; seg.style.width = (t > a ? (end - a) / MAX * 100 : 0) + "%";
      seg.classList.toggle("wait", mode === "par");
    });
    $("#abClock", host).textContent = `t = ${Math.round(Math.min(t, total) * 100)} ms`;
    $("#abNote", host).innerHTML = mode === "seq"
      ? `Each <code>await download()</code> finishes before the next one starts. Total: <b>${total}00 ms</b> (200 + 100 + 300).`
      : `All three start at once; while they wait on the network, the thread is free. Total: <b>${total}00 ms</b>, the slowest one. Hatched = waiting, not using the CPU.`;
    return total;
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    if (b.dataset.m === "play") {
      cancelAnimationFrame(raf); const t0 = performance.now(), total = draw(0);
      const tick = now => { const t = (now - t0) / 600; draw(t); if (t < total) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick); return;
    }
    mode = b.dataset.m; $$(".chip", host).forEach(c => c.setAttribute("aria-pressed", c === b)); cancelAnimationFrame(raf); draw(99);
  });
  draw(99);
};

W.copies = host => {
  const sl = (k) => `{ name, <span class="slot" data-ref="${k}"></span> tags }`;
  const o = c => O("o", "object", sl("t1"), c), s = c => O("s", "object (shallow)", sl("t1"), c), d = c => O("d", "object (deep)", sl("t2"), c);
  const t1 = (v = '["math"]', c = "") => O("t1", "array", v, c), t2 = c => O("t2", "array", '["math"]', c);
  Stepper(host, 'const original = { name: "Ada", tags: ["math"] };\nconst alias = original;\nconst shallow = { ...original };\nconst deep = structuredClone(original);\noriginal.tags.push("code");', [
    { l: 0, s: mem([], [[], []]), n: "Press Play. Gray dots are references stored inside an object." },
    { l: 1, s: mem([["original", "o"]], [[o("new")], [t1('["math"]', "new")]]), n: "One object whose <code>tags</code> property points at an array." },
    { l: 2, s: mem([["original", "o"], ["alias", "o"]], [[o()], [t1()]]), n: "<b>alias</b> is another name for the same object. Nothing was copied." },
    { l: 3, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"]], [[o(), s("new")], [t1()]]), n: "Spread makes a <b>new outer object</b>, but its <code>tags</code> still points to the <b>same array</b>." },
    { l: 4, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"], ["deep", "d"]], [[o(), s(), d("new")], [t1(), t2("new")]]), n: "<b>structuredClone</b> copies nested objects too: deep has its own array." },
    { l: 5, s: mem([["original", "o"], ["alias", "o"], ["shallow", "s"], ["deep", "d"]], [[o(), s(), d()], [t1('["math", "code"]', "new"), t2()]]), n: "Pushing to <code>original.tags</code> changes the shared array, which original, alias <b>and</b> shallow all see. Only deep is unaffected." }
  ]);
};

$$(".widget").forEach(w => { const f = W[w.dataset.w]; if (f) f(w); });
})();
