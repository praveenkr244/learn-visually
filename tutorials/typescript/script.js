/* TypeScript, Visually — interactive diagrams and widgets.
   Runnable code (type-checked with the real compiler), the playground, search and the Stepper helper
   come from /assets/jsts.js (window.LV). */
(() => {
"use strict";
const { $, $$, esc, hl, Stepper } = window.LV;
const W = {};

// Source with [[type annotations]] marked, so they can be faded out on "Compile"
W.erase = host => {
  const src = 'interface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user[[: User]])[[: string]] {\n  return "Hi " + user.name;\n}\n\nconst ada[[: User]] = { name: "Ada", age: 36 };\nconsole.log(greet(ada));';
  const withTypes = src.split(/(\[\[[\s\S]*?\]\])/).map(p => p.startsWith("[[") ? `<span class="ty">${esc(p.slice(2, -2))}</span>` : hl(p)).join("");
  const iface = /interface User \{[\s\S]*?\}\n\n/;
  const tsHtml = withTypes.replace(/(<span class="tok-k">interface<\/span> User \{[\s\S]*?\}\n\n)/, '<span class="ty">$1</span>');
  const js = src.replace(iface, "").replace(/\[\[[\s\S]*?\]\]/g, "");
  host.innerHTML = `<div class="erase" id="erBox"><div><h5>app.ts · what you write</h5><pre>${tsHtml}</pre></div><div><h5>app.js · what runs</h5><pre id="erJs" style="opacity:.25">${hl(js)}</pre></div></div>
  <div class="ctrl"><button class="btn pri" data-e="go">▶ Compile</button><button class="btn" data-e="back">⟲ Show types again</button><span class="stp-count" id="erNote">Green = type information. It only exists for the checker.</span></div>`;
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-e]"); if (!b) return;
    const go = b.dataset.e === "go";
    $("#erBox", host).classList.toggle("gone", go);
    $("#erJs", host).style.opacity = go ? 1 : .25;
    $("#erNote", host).textContent = go ? "tsc checked the types, then erased them. The JavaScript on the right is all that runs." : "Green = type information. It only exists for the checker.";
  });
};

W.infer = host => {
  const rows = [
    ['let color = "red"', 'string', "let can be reassigned, so the type widens to string."],
    ['const color = "red"', '"red"', "const can never change, so its type is the literal itself."],
    ["let n = 42", "number", "Numbers widen to number."],
    ["const list = [1, 2, 3]", "number[]", "The array's element type is inferred from its items."],
    ['const mixed = [1, "a", null]', "(string | number | null)[]", "Mixed items give a union element type."],
    ["const pair = [1, \"a\"] as const", 'readonly [1, "a"]', "as const keeps exact literals and makes it a readonly tuple."],
    ['const user = { name: "Ada", age: 36 }', "{ name: string; age: number }", "Object properties are mutable, so they widen too."],
    ["const sum = (a: number, b: number) => a + b", "(a: number, b: number) => number", "The return type is inferred from the body."],
    ["const found = [1, 2].find(n => n > 1)", "number | undefined", "find may not find anything."],
    ["const p = fetch(url).then(r => r.ok)", "Promise<boolean>", "Inference flows through then callbacks."]
  ];
  host.innerHTML = `<div class="ctrl" style="margin-top:0;flex-direction:column;align-items:stretch">${rows.map((r, i) => `<button class="btn" data-i="${i}" style="text-align:left;font-family:var(--font-mono);font-weight:500">${esc(r[0])}</button>`).join("")}</div>
  <div class="stp-note" id="inOut" style="margin-top:10px"></div>`;
  const pick = i => {
    $$("[data-i]", host).forEach(b => b.classList.toggle("pri", +b.dataset.i === i));
    const [code, type, why] = rows[i];
    $("#inOut", host).innerHTML = `<code>${esc(code)}</code><br>inferred type: <b style="font-family:var(--font-mono)">${esc(type)}</b><br>${why}`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) pick(+b.dataset.i); });
  pick(0);
};

W.narrow = host => {
  const T = (ty, removed = "") => `<div class="tyrow"><span>type of <b>value</b>:</span><span class="tb">${esc(ty)}</span>${removed ? `<span>ruled out:</span><span style="color:var(--bad);text-decoration:line-through">${esc(removed)}</span>` : ""}</div>`;
  Stepper(host, 'function show(value: string | number | null) {\n  if (value === null) {\n    return "nothing";\n  }\n  if (typeof value === "string") {\n    return value.toUpperCase();\n  }\n  return value.toFixed(2);\n}', [
    { l: 1, s: T("string | number | null"), n: "At the start, value could be any member of the union. Only operations valid for <b>all three</b> are allowed." },
    { l: 2, s: T("string | number | null"), n: "The check <code>value === null</code> splits the possibilities." },
    { l: 3, s: T("null"), n: "Inside this block TypeScript knows value is <b>null</b>." },
    { l: 5, s: T("string | number", "null"), n: "After the <code>return</code>, null is impossible here, so it's removed from the union." },
    { l: 6, s: T("string", "null, number"), n: "Inside <code>typeof value === \"string\"</code>, value is <b>string</b>: <code>toUpperCase()</code> is allowed." },
    { l: 8, s: T("number", "null, string"), n: "Only <b>number</b> is left, so <code>toFixed</code> is allowed without any check. This is called <b>control-flow analysis</b>." }
  ]);
};

W.structural = host => {
  const cases = [
    ['{ x: 1, y: 2 }', true, "Exactly the required properties."],
    ['const p3 = { x: 1, y: 2, z: 3 }; use(p3)', true, "A variable with <b>extra</b> properties still fits: it has everything Point needs."],
    ['{ x: 1, y: 2, z: 3 }  (written inline)', false, "An object literal written directly is checked for <b>excess properties</b>: z is probably a typo. Error TS2353."],
    ['{ x: 1 }', false, "y is missing. Error TS2741: Property 'y' is missing."],
    ['{ x: "1", y: 2 }', false, "x has the wrong type: string is not assignable to number."],
    ['new Vector(1, 2)  // class with x, y', true, "Classes are compared by shape too. The class never mentioned Point."],
    ['{ x: 1, y: 2, toString() {…} }  (as a variable)', true, "Methods are just more properties."]
  ];
  host.innerHTML = `<pre class="mini" style="margin:0 0 8px">interface Point { x: number; y: number }\nfunction use(p: Point) { … }</pre>
  <div class="ctrl" style="margin-top:0;flex-direction:column;align-items:stretch">${cases.map((c, i) => `<button class="btn" data-i="${i}" style="text-align:left;font-family:var(--font-mono);font-weight:500">use(${esc(c[0])})</button>`).join("")}</div>
  <div class="stp-note" id="stOut" style="margin-top:10px"></div>`;
  const pick = i => {
    $$("[data-i]", host).forEach(b => b.classList.toggle("pri", +b.dataset.i === i));
    const [, fits, why] = cases[i];
    $("#stOut", host).innerHTML = `${fits ? '<span class="pill ok">✓ fits Point</span>' : '<span class="pill bad">✗ type error</span>'} ${why}`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) pick(+b.dataset.i); });
  pick(0);
};

W.generic = host => {
  const args = [["[10, 20, 30]", "number"], ['["a", "b"]', "string"], ["[true, false]", "boolean"], ['[{ id: 1 }, { id: 2 }]', "{ id: number }"], ['[1, "two"]', "string | number"], ["[]", "never"]];
  host.innerHTML = `<pre class="mini" style="margin:0 0 8px">function first&lt;T&gt;(items: T[]): T | undefined</pre>
  <div class="ctrl" style="margin-top:0">${args.map((a, i) => `<button class="btn" data-i="${i}"><code style="background:none;padding:0">first(${esc(a[0])})</code></button>`).join("")}</div>
  <div class="viz-title" style="margin-top:14px">How TypeScript fills in T</div>
  <div id="geOut" class="props"></div>`;
  const pick = i => {
    $$("[data-i]", host).forEach(b => b.classList.toggle("pri", +b.dataset.i === i));
    const [arg, t] = args[i];
    const ret = t === "never" ? "undefined" : `${t.includes("|") ? `(${t})` : t} | undefined`;
    $("#geOut", host).innerHTML = [
      `1 · the argument <b>${esc(arg)}</b> has type <b>${esc(t === "never" ? "never[]" : (t.includes("|") ? `(${t})` : t) + "[]")}</b>`,
      `2 · match it against <b>T[]</b> → <span class="flag">T = ${esc(t)}</span>`,
      `3 · substitute T in the return type → <b>${esc(ret)}</b>`
    ].map((x, k) => `<div class="new" style="animation-delay:${k * 120}ms">${x}</div>`).join("");
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) pick(+b.dataset.i); });
  pick(0);
};

W.mapped = host => {
  const base = [["id", "number", false, false], ["name", "string", false, false], ["email", "string", false, false], ["bio", "string", true, false]];
  const ops = {
    "User": { f: p => p, note: "The original interface. bio is already optional." },
    "Partial<User>": { f: p => p.map(([k, t, , r]) => [k, t, true, r]), note: "Every property becomes optional (<code>?</code>). Perfect for update functions." },
    "Required<User>": { f: p => p.map(([k, t, , r]) => [k, t, false, r]), note: "Removes every <code>?</code> (written <code>-?</code> in a mapped type)." },
    "Readonly<User>": { f: p => p.map(([k, t, o]) => [k, t, o, true]), note: "Every property becomes <code>readonly</code>." },
    'Pick<User, "id" | "name">': { f: p => p.filter(([k]) => k === "id" || k === "name"), note: "Keeps only the listed keys." },
    'Omit<User, "email">': { f: p => p.filter(([k]) => k !== "email"), note: "Drops the listed keys." },
    "Record<keyof User, boolean>": { f: p => p.map(([k]) => [k, "boolean", false, false]), note: "Same keys (all required), every value type replaced." },
    "{ [K in keyof User]: () => User[K] }": { f: p => p.map(([k, t, o, r]) => [k, `() => ${t}${o ? " | undefined" : ""}`, o, r]), note: "A custom mapped type: each property becomes a getter function returning the original type." }
  };
  host.innerHTML = `<div class="ctrl" style="margin-top:0">${Object.keys(ops).map((k, i) => `<button class="btn ${i ? "" : "pri"}" data-k="${esc(k)}"><code style="background:none;padding:0">${esc(k)}</code></button>`).join("")}</div>
  <pre class="mini" id="maType" style="margin:12px 0 6px"></pre><div class="props" id="maProps"></div><div class="stp-note" id="maNote" style="margin-top:10px"></div>`;
  const pick = key => {
    $$("[data-k]", host).forEach(b => b.classList.toggle("pri", b.dataset.k === key));
    const props = ops[key].f(base.map(r => [...r]));
    const kept = new Set(props.map(p => p[0]));
    $("#maType", host).innerHTML = hl(`type Result = ${key};`);
    $("#maProps", host).innerHTML = base.map(([k]) => {
      const p = props.find(x => x[0] === k);
      if (!p) return `<div class="off">${k}</div>`;
      const [, t, o, r] = p;
      return `<div class="new">${r ? '<span class="flag">readonly </span>' : ""}${k}${o ? '<span class="flag">?</span>' : ""}: <span style="color:var(--accent)">${esc(t)}</span>;</div>`;
    }).join("");
    $("#maNote", host).innerHTML = ops[key].note + (kept.size < base.length ? ` <span style="color:var(--muted)">(struck-through keys are removed)</span>` : "");
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) pick(b.dataset.k); });
  pick("User");
};

W.cond = host => {
  const inputs = ['"hello"', "42", "string[]", "Promise<number>", "() => boolean", "null", '"a" | 1'];
  const rules = [
    ["T extends string", t => /^".*"$/.test(t) || t === "string", '"text"'],
    ["T extends number", t => /^\d+$/.test(t) || t === "number", '"number"'],
    ["T extends (infer E)[]", t => /\[\]$/.test(t), t => `Array of ${t.slice(0, -2)}`],
    ["T extends Promise<infer V>", t => /^Promise</.test(t), t => `Promise of ${t.slice(8, -1)}`],
    ["T extends (...a: any[]) => infer R", t => /=>/.test(t), t => `Function returning ${t.split("=>")[1].trim()}`]
  ];
  host.innerHTML = `<pre class="mini" style="margin:0 0 8px">type Describe&lt;T&gt; =
  T extends string ? "text" :
  T extends number ? "number" :
  T extends (infer E)[] ? \`Array of \${E}\` :
  T extends Promise&lt;infer V&gt; ? \`Promise of \${V}\` :
  T extends (...a: any[]) =&gt; infer R ? \`Function returning \${R}\` :
  "something else";</pre>
  <div class="ctrl" style="margin-top:0"><span class="stp-count">Describe&lt;T&gt; with T =</span>${inputs.map((t, i) => `<button class="btn" data-i="${i}"><code style="background:none;padding:0">${esc(t)}</code></button>`).join("")}</div>
  <div class="props" id="coSteps" style="margin-top:10px"></div><div class="stp-note" id="coOut" style="margin-top:10px"></div>`;
  const evalOne = t => {
    const steps = [];
    for (const [test, f, res] of rules) {
      const hit = f(t);
      steps.push(`${hit ? "✓" : "✗"} ${t} ${test.replace("T ", "")}?`);
      if (hit) return { steps, result: typeof res === "function" ? res(t) : res };
    }
    steps.push("→ no branch matched");
    return { steps, result: '"something else"' };
  };
  const pick = i => {
    $$("[data-i]", host).forEach(b => b.classList.toggle("pri", +b.dataset.i === i));
    const t = inputs[i];
    if (t.includes("|")) {
      const parts = t.split("|").map(s => s.trim()).map(p => ({ p, ...evalOne(p) }));
      $("#coSteps", host).innerHTML = parts.map(x => `<div class="new">${esc(x.p)}: ${esc(x.steps.at(-1))} → <b>${esc(x.result.startsWith('"') ? x.result : '"' + x.result + '"')}</b></div>`).join("");
      $("#coOut", host).innerHTML = `A union <b>distributes</b>: the condition runs once per member and the results are joined: <b>${esc(parts.map(x => x.result.startsWith('"') ? x.result : `"${x.result}"`).join(" | "))}</b>`;
      return;
    }
    const { steps, result } = evalOne(t);
    $("#coSteps", host).innerHTML = steps.map((s, k) => `<div class="new" style="animation-delay:${k * 90}ms">${esc(s)}</div>`).join("");
    $("#coOut", host).innerHTML = `Describe&lt;${esc(t)}&gt; = <b>${esc(result.startsWith('"') ? result : `"${result}"`)}</b>${/infer/.test(steps.at(-1)) ? " — <code>infer</code> captured part of the type." : ""}`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) pick(+b.dataset.i); });
  pick(0);
};

$$(".widget").forEach(w => { const f = W[w.dataset.w]; if (f) f(w); });
})();
