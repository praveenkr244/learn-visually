/* Runnable code for the JavaScript and TypeScript tutorials.
   The page sets <body data-lang="js"> or <body data-lang="ts"> and loads this after course.js.

   Markup:
     <pre class="code" data-run>…</pre>          console code: runs in a fresh Web Worker, output shown below
     <pre class="code" data-run="page">…</pre>    a small HTML page (markup, <style>, <script>): runs in a sandboxed iframe preview
     <pre class="code">…</pre>                   example only (Copy button)
     <pre class="mini">…</pre>                   highlighted cheat-sheet snippet
   In TypeScript pages the code (or the page's <script>) is type-checked with the real compiler (loaded from jsDelivr
   on the first Run), then compiled to JavaScript and run. Type errors are listed and the code is not run.

   Also provides the playground (#playCode/#playRun/#playClear/#playOut), the lesson search (#q) and, as window.LV,
   the helpers the page's own script.js uses for its diagrams: hl, Stepper, mem, O, drawArrows, $, $$, esc. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NS = "http://www.w3.org/2000/svg";
const TS = document.body.dataset.lang === "ts";

/* ---------- syntax highlighter (JavaScript + TypeScript, plus HTML/CSS for page blocks) ---------- */
const KW = new Set(("break case catch class const continue debugger default delete do else export extends finally for function if import in " +
  "instanceof let new of return super switch throw try typeof var void while with yield async await static get set from null undefined true false " +
  "type interface enum implements readonly keyof infer is as satisfies declare namespace abstract private public protected override unique asserts").split(" "));
const TY = new Set("string number boolean bigint symbol object any unknown never void".split(" "));
const BI = new Set(("console Math JSON Object Array Promise Map Set WeakMap WeakSet Date String Number Boolean Symbol BigInt RegExp Error TypeError RangeError " +
  "SyntaxError ReferenceError AggregateError parseInt parseFloat isNaN setTimeout setInterval clearTimeout clearInterval queueMicrotask fetch structuredClone " +
  "document window localStorage globalThis Intl Reflect Proxy performance requestAnimationFrame HTMLElement HTMLInputElement HTMLButtonElement Event " +
  "Record Partial Required Readonly Pick Omit Exclude Extract NonNullable ReturnType Parameters Awaited InstanceType Uppercase Lowercase Capitalize").split(" "));
const RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@[A-Za-z_][\w.]*)|(\b(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)n?\b)|\b(function\*?|class)(\s+)([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)/g;
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
      out += KW.has(w) ? `<span class="tok-k">${w}</span>` : TY.has(w) ? `<span class="tok-t">${w}</span>` : BI.has(w) ? `<span class="tok-b">${w}</span>` : w === "this" ? `<span class="tok-self">${w}</span>` : w;
    }
    last = RE.lastIndex;
  }
  return out + esc(code.slice(last));
}
const hlCss = css => esc(css).replace(/(\/\*[\s\S]*?\*\/)|([\w-]+)(\s*:)(?![^{}]*\{)/g, (all, c, p, colon) => c ? `<span class="tok-c">${c}</span>` : `<span class="tok-b">${p}</span>${colon}`);
const hlTag = tag => {
  if (tag.startsWith("<!--")) return `<span class="tok-c">${esc(tag)}</span>`;
  const m = /^<(\/?)([\w-]+)([\s\S]*?)(\/?)>$/.exec(tag);
  if (!m) return esc(tag);
  const attrs = m[3].replace(/([\w:-]+)(?:(=)("[^"]*"|'[^']*'|[^\s>]+))?/g, (a, n, eq, v) => `\u0001${n}\u0002${eq ? "=\u0003" + v + "\u0004" : ""}`);
  return `<span class="tok-tag">&lt;${m[1]}${m[2]}</span>${esc(attrs).replace(/\u0001/g, '<span class="tok-attr">').replace(/\u0002/g, "</span>").replace(/\u0003/g, '<span class="tok-s">').replace(/\u0004/g, "</span>")}<span class="tok-tag">${m[4]}&gt;</span>`;
};
function hlPage(src) {
  return src.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i).map(part => {
    const sm = /^(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)$/i.exec(part);
    if (sm) return hlTag(sm[1]) + (sm[2].toLowerCase() === "script" ? hl(sm[3]) : hlCss(sm[3])) + hlTag(sm[4]);
    let out = "", last = 0, m; const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
    while ((m = re.exec(part))) { out += esc(part.slice(last, m.index)) + hlTag(m[0]); last = re.lastIndex; }
    return out + esc(part.slice(last));
  }).join("");
}
const isPage = pre => pre.dataset.run === "page";
const paint = (pre, src) => { pre.innerHTML = isPage(pre) ? hlPage(src) : hl(src); };

/* ---------- code blocks ---------- */
function setupBlock(pre) {
  const code = pre.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
  pre.dataset.src = code; pre.dataset.orig = code;
  paint(pre, code);
  const wrap = document.createElement("div");
  wrap.className = "code-wrap";
  pre.before(wrap); wrap.append(pre);
  const run = pre.hasAttribute("data-run");
  const bar = document.createElement("div");
  bar.className = "code-bar";
  bar.innerHTML = `<span class="lab">${run ? (isPage(pre) ? "runnable page" : "runnable") : "example"}${TS ? " · ts" : ""}</span><button type="button" data-a="copy">Copy</button>` +
    (run ? `<button type="button" data-a="edit">Edit</button><button type="button" data-a="reset" hidden>Reset</button>${TS ? '<button type="button" data-a="js">JS</button>' : ""}<button type="button" class="run" data-a="run">▶ Run</button>` : "");
  wrap.append(bar);
  if (run) {
    if (isPage(pre)) { const pv = document.createElement("div"); pv.className = "preview"; wrap.append(pv); }
    const out = document.createElement("pre"); out.className = "out"; out.dataset.base = "out"; out.setAttribute("aria-live", "polite"); wrap.append(out);
  }
}
$$("pre.code").forEach(setupBlock);
$$("pre.mini").forEach(pre => { pre.innerHTML = hl(pre.textContent.replace(/\s+$/, "")); });

/* ---------- console formatting (runs inside the worker and the page preview, so it is kept as source text) ---------- */
const INSPECT = String.raw`
const __isId = k => /^[A-Za-z_$][\w$]*$/.test(k);
const __q = s => "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
function __fmt(v, d = 0, seen = new Set()) {
  const t = typeof v;
  if (t === "string") return d ? __q(v) : v;
  if (t === "number") return Object.is(v, -0) ? "-0" : String(v);
  if (t === "bigint") return v + "n";
  if (t === "symbol") return v.toString();
  if (v === undefined || v === null || t === "boolean") return String(v);
  if (t === "function") {
    const src = Function.prototype.toString.call(v);
    const kind = /^class[\s{]/.test(src) ? "class" : "Function";
    return "[" + kind + (v.name ? (kind === "class" ? " " : ": ") + v.name : " (anonymous)") + "]";
  }
  if (seen.has(v)) return "[Circular]";
  if (v instanceof Error) return (v.name || "Error") + ": " + v.message + (v.cause !== undefined ? " { cause: " + __fmt(v.cause, d + 1, seen) + " }" : "");
  if (v instanceof Date) return isNaN(v) ? "Invalid Date" : v.toISOString();
  if (v instanceof RegExp) return String(v);
  if (v instanceof Promise) return "Promise { … }";
  if (typeof WeakMap !== "undefined" && (v instanceof WeakMap || v instanceof WeakSet)) return (v instanceof WeakMap ? "WeakMap" : "WeakSet") + " { <items unknown> }";
  if (typeof Node !== "undefined" && v instanceof Node) return v.nodeType === 1 ? "<" + v.tagName.toLowerCase() + (v.id ? "#" + v.id : "") + (v.className && typeof v.className === "string" ? "." + v.className.trim().split(/\s+/).join(".") : "") + ">" : "[" + v.nodeName + "]";
  if (d > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.add(v);
  const wrap = (open, items, close) => {
    seen.delete(v);
    if (!items.length) return open + (open.endsWith("[") ? "]" : "}");
    const one = open + " " + items.join(", ") + " " + close;
    if (one.length <= 72 && !one.includes("\n")) return one;
    const pad = "  ".repeat(d + 1);
    return open + "\n" + items.map(x => pad + x.replace(/\n/g, "\n" + pad)).join(",\n") + "\n" + "  ".repeat(d) + close;
  };
  if (Array.isArray(v)) {
    const items = []; let holes = 0;
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) { holes++; continue; }
      if (holes) { items.push("<" + holes + " empty item" + (holes > 1 ? "s" : "") + ">"); holes = 0; }
      if (items.length >= 100) { items.push("... " + (v.length - i) + " more items"); break; }
      items.push(__fmt(v[i], d + 1, seen));
    }
    if (holes) items.push("<" + holes + " empty item" + (holes > 1 ? "s" : "") + ">");
    return wrap("[", items, "]");
  }
  if (ArrayBuffer.isView(v)) return wrap(v.constructor.name + "(" + v.length + ") [", Array.from(v, x => __fmt(x, d + 1, seen)), "]");
  if (v instanceof Map) return wrap("Map(" + v.size + ") {", [...v].map(([k, x]) => __fmt(k, d + 1, seen) + " => " + __fmt(x, d + 1, seen)), "}");
  if (v instanceof Set) return wrap("Set(" + v.size + ") {", [...v].map(x => __fmt(x, d + 1, seen)), "}");
  const proto = Object.getPrototypeOf(v);
  const name = proto === null ? "[Object: null prototype]" : proto.constructor && proto.constructor !== Object ? proto.constructor.name : "";
  const items = [];
  for (const k of Reflect.ownKeys(v)) {
    const desc = Object.getOwnPropertyDescriptor(v, k);
    if (!desc.enumerable) continue;
    const key = typeof k === "symbol" ? "[" + k.toString() + "]" : __isId(k) ? k : __q(k);
    items.push(key + ": " + ("value" in desc ? __fmt(desc.value, d + 1, seen) : desc.set ? "[Getter/Setter]" : "[Getter]"));
  }
  return wrap((name ? name + " " : "") + "{", items, "}");
}
function __table(data) {
  if (data === null || typeof data !== "object") return __fmt(data);
  const rows = data instanceof Map ? [...data] : Object.entries(data), cols = [], hasVal = { v: false };
  for (const [, r] of rows) if (r !== null && typeof r === "object") { for (const c of Object.keys(r)) if (!cols.includes(c)) cols.push(c); } else hasVal.v = true;
  const head = ["(index)", ...cols, ...(hasVal.v ? ["Values"] : [])];
  const body = rows.map(([k, r]) => [Array.isArray(data) ? k : String(k), ...cols.map(c => r !== null && typeof r === "object" && c in r ? __fmt(r[c], 1) : ""), ...(hasVal.v ? [r !== null && typeof r === "object" ? "" : __fmt(r, 1)] : [])].map(String));
  const w = head.map((h, i) => Math.max(h.length, ...body.map(r => r[i].length)) + 2);
  const cell = (s, i) => { const t = w[i] - s.length, l = Math.floor(t / 2); return " ".repeat(l) + s + " ".repeat(t - l); };
  const line = (a, b, c) => a + w.map(n => "─".repeat(n)).join(b) + c;
  return [line("┌", "┬", "┐"), "│" + head.map(cell).join("│") + "│", line("├", "┼", "┤"), ...body.map(r => "│" + r.map(cell).join("│") + "│"), line("└", "┴", "┘")].join("\n");
}
function __console(send) {
  let depth = 0; const counts = {}, times = {};
  const out = kind => (...a) => send(kind, "  ".repeat(depth) + a.map(x => typeof x === "string" ? x : __fmt(x)).join(" "));
  return {
    log: out("log"), info: out("info"), debug: out("log"), warn: out("warn"), error: out("error"), dir: out("log"), trace: out("log"),
    table: d => send("log", __table(d).split("\n").map(l => "  ".repeat(depth) + l).join("\n")),
    group: (...a) => { if (a.length) out("log")(...a); depth++; }, groupCollapsed: (...a) => { if (a.length) out("log")(...a); depth++; },
    groupEnd: () => { depth = Math.max(0, depth - 1); },
    assert: (c, ...a) => { if (!c) out("error")("Assertion failed" + (a.length ? ":" : ""), ...a); },
    count: (l = "default") => { counts[l] = (counts[l] || 0) + 1; out("log")(l + ": " + counts[l]); },
    countReset: (l = "default") => { counts[l] = 0; },
    time: (l = "default") => { times[l] = performance.now(); },
    timeEnd: (l = "default") => { if (l in times) { out("log")(l + ": " + (performance.now() - times[l]).toFixed(3) + "ms"); delete times[l]; } },
    timeLog: (l = "default") => { if (l in times) out("log")(l + ": " + (performance.now() - times[l]).toFixed(3) + "ms"); },
    clear: () => {}
  };
}
function __errText(e) {
  if (e instanceof Error || (e && typeof e === "object" && "message" in e && "name" in e)) return "Uncaught " + __fmt(e);
  return "Uncaught " + __fmt(e, 1);
}`;

/* ---------- console runner: one Web Worker per run ---------- */
const WORKER_SRC = INSPECT + String.raw`
const __send = (k, s) => postMessage({ k, s });
self.console = __console(__send);
const __ids = new Set(), __st = setTimeout, __ct = clearTimeout, __si = setInterval, __ci = clearInterval;
let __main = false, __inflight = 0;
const __report = e => {
  let where = "";
  const m = e && e.stack && /(?:<anonymous>|AsyncFunction|Function):(\d+):(\d+)/.exec(e.stack);
  if (m && self.__lineOffset !== null) where = "    (line " + (m[1] - 2 - self.__lineOffset) + ")";
  __send("error", __errText(e) + where);
};
const __check = () => { if (__main && !__ids.size && !__inflight) __st(() => { if (!__ids.size && !__inflight) __send("done", ""); }, 25); };
self.setTimeout = (fn, ms, ...a) => { const id = __st(() => { __ids.delete(id); try { typeof fn === "function" && fn(...a); } catch (e) { __report(e); } __check(); }, ms); __ids.add(id); return id; };
self.clearTimeout = id => { __ct(id); __ids.delete(id); __check(); };
self.setInterval = (fn, ms, ...a) => { const id = __si(() => { try { fn(...a); } catch (e) { __report(e); __ci(id); __ids.delete(id); __check(); } }, ms); __ids.add(id); return id; };
self.clearInterval = id => { __ci(id); __ids.delete(id); __check(); };
if (self.fetch) { const f = self.fetch.bind(self); self.fetch = (...a) => { __inflight++; return f(...a).finally(() => { __inflight--; __st(__check, 0); }); }; }
self.addEventListener("unhandledrejection", e => { e.preventDefault(); __report(e.reason); });
self.onmessage = async e => {
  self.__lineOffset = e.data.lineOffset;
  try {
    const AsyncFunction = (async () => {}).constructor;
    await new AsyncFunction('"use strict";' + e.data.code)();
  } catch (err) { __report(err); }
  __main = true; __check();
};`;
let workerUrl = null;
const LIMIT = 8000;
function runConsole(js, outEl, { lineOffset = 0 } = {}) {
  workerUrl = workerUrl || URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  return new Promise(resolve => {
    const w = new Worker(workerUrl);
    let any = false;
    const finish = note => {
      clearTimeout(timer); w.terminate();
      if (note) addLine(outEl, note, "o-dim");
      else if (!any) addLine(outEl, "(no output)", "o-dim");
      resolve();
    };
    const timer = setTimeout(() => finish(`⏱ Stopped after ${LIMIT / 1000} s: the code was still running (an endless loop, or a timer that is never cleared).`), LIMIT);
    w.onmessage = e => {
      const { k, s } = e.data;
      if (k === "done") return finish();
      any = true; addLine(outEl, s, k === "error" ? "o-err" : k === "warn" ? "o-warn" : k === "info" ? "o-info" : "");
      if (k === "error") outEl.classList.add("err");
    };
    w.onerror = e => { e.preventDefault(); any = true; addLine(outEl, "Uncaught " + (e.message || "error"), "o-err"); finish(); };
    w.postMessage({ code: js, lineOffset });
  });
}
function addLine(outEl, text, cls) {
  if (outEl.dataset.fresh) { outEl.textContent = ""; delete outEl.dataset.fresh; }
  const s = document.createElement("span"); if (cls) s.className = cls; s.textContent = text + "\n"; outEl.append(s);
  outEl.scrollTop = outEl.scrollHeight;
}

/* ---------- page runner: sandboxed iframe, console forwarded to the output panel ---------- */
let pageSeq = 0;
const pages = new Map();
addEventListener("message", e => {
  const d = e.data; if (!d || d.lvPage === undefined) return;
  const p = pages.get(d.lvPage); if (!p || e.source !== p.frame.contentWindow) return;
  if (d.k === "height") { p.frame.style.height = Math.min(Math.max(d.s, 120), 640) + "px"; return; }
  addLine(p.out, d.s, d.k === "error" ? "o-err" : d.k === "warn" ? "o-warn" : d.k === "info" ? "o-info" : "");
});
function runPage(html, previewEl, outEl) {
  const id = ++pageSeq;
  const prelude = `<script>(() => {${INSPECT}
    const send = (k, s) => parent.postMessage({ lvPage: ${id}, k, s }, "*");
    window.console = __console(send);
    addEventListener("error", e => send("error", __errText(e.error || e.message)));
    addEventListener("unhandledrejection", e => send("error", __errText(e.reason)));
    try { window.localStorage.length; } catch (err) {
      const mem = new Map(), api = { getItem: k => mem.has(String(k)) ? mem.get(String(k)) : null, setItem: (k, v) => { mem.set(String(k), String(v)); },
        removeItem: k => { mem.delete(String(k)); }, clear: () => mem.clear(), key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
      try { Object.defineProperty(window, "localStorage", { value: api, configurable: true }); } catch (e2) {}
    }
    const size = () => send("height", Math.ceil(document.documentElement.getBoundingClientRect().height));
    addEventListener("load", size); new ResizeObserver(size).observe(document.documentElement);
  })();<\/script>`;
  const doc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + prelude)
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${prelude}<style>body{font:16px/1.5 system-ui,sans-serif;margin:14px;color:#1b2333;background:#fff}</style></head><body>${html}</body></html>`;
  previewEl.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.title = "Preview of this code"; frame.setAttribute("sandbox", "allow-scripts allow-forms allow-modals");
  for (const [k, p] of pages) if (!p.frame.isConnected) pages.delete(k);
  pages.set(id, { frame, out: outEl });
  frame.srcdoc = doc; previewEl.append(frame);
}

/* ---------- TypeScript: type-check with the real compiler, then compile to JavaScript ---------- */
const TS_VER = "5.8.3", TS_LIB = `https://cdn.jsdelivr.net/npm/typescript@${TS_VER}/lib/`;
const ENV_DTS = `declare var console: { log(...data: any[]): void; info(...data: any[]): void; warn(...data: any[]): void; error(...data: any[]): void;
  debug(...data: any[]): void; dir(item?: any): void; table(data: any): void; group(...label: any[]): void; groupEnd(): void;
  assert(condition?: boolean, ...data: any[]): void; count(label?: string): void; time(label?: string): void; timeEnd(label?: string): void; timeLog(label?: string): void };
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function queueMicrotask(callback: () => void): void;
declare function structuredClone<T>(value: T): T;
declare var performance: { now(): number };
interface Response { ok: boolean; status: number; json(): Promise<any>; text(): Promise<string> }
declare function fetch(input: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }): Promise<Response>;
interface AbortSignal { readonly aborted: boolean }
declare class AbortController { readonly signal: AbortSignal; abort(reason?: any): void }`;
let tsPromise = null;
const libText = new Map(), libFile = new Map();
function setRt(state, text) { const d = $("#rtDot"), t = $("#rtText"); if (d) d.className = "dot " + state; if (t) t.textContent = text; }
function loadTs() {
  if (!tsPromise) {
    setRt("load", "Loading the TypeScript compiler (≈1.6 MB, once)…");
    tsPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = TS_LIB + "typescript.js";
      s.onload = () => window.ts ? res(window.ts) : rej(new Error("the compiler did not start"));
      s.onerror = () => rej(new Error("the compiler script was blocked"));
      document.head.append(s);
    }).then(async ts => { await loadLibs(["lib.es2022.d.ts"]); setRt("ok", `TypeScript ${ts.version} ready`); return ts; })
      .catch(e => { tsPromise = null; setRt("err", "TypeScript failed to load"); throw e; });
  }
  return tsPromise;
}
// each lib file is fetched once; concurrent runs wait for the same promise (lib references form a tree, never a cycle)
const libLoads = new Map();
function loadLibs(names) {
  return Promise.all(names.map(n => {
    if (!libLoads.has(n)) {
      libLoads.set(n, fetch(TS_LIB + n).then(r => {
        if (!r.ok) throw new Error("couldn't fetch " + n);
        return r.text();
      }).then(text => {
        libText.set(n, text);
        return loadLibs([...text.matchAll(/\/\/\/\s*<reference lib="([^"]+)"/g)].map(m => `lib.${m[1].toLowerCase()}.d.ts`));
      }).catch(e => { libLoads.delete(n); throw e; }));
    }
    return libLoads.get(n);
  }));
}
let oldProgram;
async function checkTs(code, dom) {
  const ts = await loadTs();
  const libs = dom ? ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"] : ["lib.es2022.d.ts"];
  if (dom) { setRt("load", "Loading DOM types (once)…"); await loadLibs(libs); setRt("ok", `TypeScript ${ts.version} ready`); }
  const files = { "main.ts": code }; if (!dom) files["env.d.ts"] = ENV_DTS;
  const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleDetection: ts.ModuleDetectionKind.Force, strict: true,
    noEmit: true, lib: libs, types: [], skipLibCheck: true, noFallthroughCasesInSwitch: true };
  const name = f => f.replace(/^\/+/, "");
  const host = {
    getSourceFile(f, lv) {
      f = name(f);
      if (f in files) return ts.createSourceFile(f, files[f], lv, true);
      if (!libText.has(f)) return undefined;
      if (!libFile.has(f)) libFile.set(f, ts.createSourceFile(f, libText.get(f), lv, true));
      return libFile.get(f);
    },
    getDefaultLibFileName: () => "lib.es2022.d.ts", getDefaultLibLocation: () => "",
    writeFile() {}, getCurrentDirectory: () => "", getDirectories: () => [], getCanonicalFileName: f => f,
    useCaseSensitiveFileNames: () => true, getNewLine: () => "\n",
    fileExists: f => name(f) in files || libText.has(name(f)), readFile: f => files[name(f)] ?? libText.get(name(f))
  };
  const program = ts.createProgram({ rootNames: Object.keys(files), options, host, oldProgram });
  oldProgram = program;
  const diags = ts.getPreEmitDiagnostics(program).filter(d => !d.file || d.file.fileName === "main.ts").map(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
    if (!d.file) return `error TS${d.code}: ${msg}`;
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    return `main.ts:${line + 1}:${character + 1} - error TS${d.code}: ${msg}`;
  });
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleDetection: ts.ModuleDetectionKind.Force } })
    .outputText.replace(/^export \{\};\s*$/m, "").replace(/\n+$/, "");
  return { diags, js };
}
const SCRIPT_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi;
async function compilePage(html) {
  const parts = [...html.matchAll(SCRIPT_RE)];
  let diags = [], out = html;
  for (const m of parts) {
    const r = await checkTs(m[2], true);
    diags = diags.concat(r.diags.map(d => d.replace(/^main\.ts:/, "<script> line ")));
    out = out.replace(m[0], () => m[1] + r.js + m[3]);
  }
  return { diags, js: out };
}

/* ---------- run any block ---------- */
async function run(code, outEl, previewEl, page) {
  outEl.className = outEl.dataset.base || "out"; outEl.textContent = ""; outEl.dataset.fresh = "1";
  let js = code;
  if (TS) {
    outEl.textContent = tsPromise ? "Checking types…" : "Loading the TypeScript compiler… (first run takes a few seconds)";
    let r;
    try { r = page ? await compilePage(code) : await checkTs(code, false); }
    catch (e) { outEl.classList.add("err"); outEl.textContent = "Couldn't load the TypeScript compiler here (" + e.message + "). Copy the code into the TypeScript Playground at typescriptlang.org/play."; return; }
    outEl.textContent = ""; outEl.dataset.fresh = "";
    if (r.diags.length) {
      outEl.classList.add("err");
      r.diags.forEach(d => addLine(outEl, d, "o-err"));
      addLine(outEl, `✗ ${r.diags.length} type error${r.diags.length > 1 ? "s" : ""}: the code was not run. Fix ${r.diags.length > 1 ? "them" : "it"} and press Run again.`, "o-dim");
      if (previewEl) previewEl.innerHTML = "";
      return;
    }
    addLine(outEl, "✓ tsc: no type errors", "o-ok");
    js = r.js;
  }
  if (page) { if (!TS) outEl.textContent = ""; runPage(js, previewEl, outEl); return; }
  await runConsole(js, outEl, { lineOffset: TS ? null : 0 });
}

const srcOf = wrap => { const ta = $("textarea.edit", wrap), pre = $("pre.code", wrap); return ta && !ta.hidden ? ta.value : pre.dataset.src; };
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const wrap = b.closest(".code-wrap"), pre = $("pre.code", wrap), a = b.dataset.a;
  if (a === "copy") {
    try { await navigator.clipboard.writeText(srcOf(wrap)); b.textContent = "Copied ✓"; }
    catch (err) { const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = "Selected, press Ctrl+C"; }
    setTimeout(() => { b.textContent = "Copy"; }, 1600);
  } else if (a === "edit") {
    let ta = $("textarea.edit", wrap);
    if (!ta) {
      ta = document.createElement("textarea"); ta.className = "edit"; ta.spellcheck = false; ta.value = pre.dataset.src; ta.hidden = true;
      ta.setAttribute("aria-label", "Edit this code");
      ta.addEventListener("keydown", ev => {
        if (ev.key === "Tab" && !ev.shiftKey) { ev.preventDefault(); ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end"); }
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); $("[data-a=run]", wrap).click(); }
      });
      pre.after(ta);
    }
    if (ta.hidden) { ta.hidden = false; pre.hidden = true; ta.rows = Math.min(30, ta.value.split("\n").length + 1); ta.focus(); b.textContent = "Done"; }
    else { pre.dataset.src = ta.value; paint(pre, ta.value); ta.hidden = true; pre.hidden = false; b.textContent = "Edit"; }
    $("[data-a=reset]", wrap).hidden = false;
  } else if (a === "reset") {
    pre.dataset.src = pre.dataset.orig; paint(pre, pre.dataset.orig);
    const ta = $("textarea.edit", wrap); if (ta) { ta.value = pre.dataset.orig; ta.hidden = true; }
    pre.hidden = false; $("[data-a=edit]", wrap).textContent = "Edit"; b.hidden = true;
  } else if (a === "js") {
    let view = $(".jsview", wrap);
    if (view && !b.classList.contains("on")) view.remove(), view = null;
    if (view) { view.remove(); b.classList.remove("on"); return; }
    b.disabled = true;
    try {
      const r = isPage(pre) ? await compilePage(srcOf(wrap)) : await checkTs(srcOf(wrap), false);
      view = document.createElement("pre"); view.className = "jsview";
      view.innerHTML = isPage(pre) ? hlPage(r.js) : hl(r.js);
      $(".code-bar", wrap).after(view); b.classList.add("on");
    } catch (err) { const o = $(".out", wrap); o.className = "out err"; o.textContent = "Couldn't load the TypeScript compiler (" + err.message + ")."; }
    b.disabled = false;
  } else if (a === "run") {
    b.disabled = true;
    await run(srcOf(wrap), $(".out", wrap), $(".preview", wrap), isPage(pre));
    b.disabled = false;
  }
});

/* ---------- playground ---------- */
const playOut = $("#playOut");
if (playOut) {
  playOut.dataset.base = "console out";
  $("#playRun").addEventListener("click", async e => { e.target.disabled = true; await run($("#playCode").value, playOut, null, false); e.target.disabled = false; });
  $("#playClear").addEventListener("click", () => { playOut.textContent = ""; });
  $("#playCode").addEventListener("keydown", e => {
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const t = e.target; t.setRangeText("  ", t.selectionStart, t.selectionEnd, "end"); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("#playRun").click(); }
  });
}

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
function mem(names, cols, title = "Names") {
  return `<div class="mem"><div><h5>${title}</h5><div class="names">${names.map(([n, r]) => `<div class="nm" data-ref="${r}">${n}</div>`).join("")}</div></div>` +
    `<div><h5>Values in memory</h5><div class="heap">${cols.map(c => `<div class="hcol">${c.map(o => `<div class="ob ${o.c}" data-id="${o.id}"><small>${o.t}</small>${o.v}</div>`).join("")}</div>`).join("")}</div></div></div>`;
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
      timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } i++; render(); }, 1700);
    }
  });
  setCode(code); render();
  return { set(c, fr) { stop(); setCode(c); frames = fr; i = 0; render(); } };
}

/* ---------- search (course mode lives in assets/course.js) ---------- */
const lessons = $$(".lesson");
const q = $("#q");
if (q) {
  const empty = document.createElement("p"); empty.className = "empty-msg"; empty.textContent = "No lessons match. Try a shorter search term."; $("#main").insertBefore(empty, $("footer"));
  let searchOpened = false;
  const applyFilter = () => {
    const v = q.value.trim().toLowerCase();
    // searching shows every matching lesson on one page; clearing the box goes back to one lesson at a time
    if (v && !document.body.classList.contains("all")) { searchOpened = true; window.course && course.setAll(true); }
    if (!v && searchOpened) { searchOpened = false; window.course && course.setAll(false); }
    let shown = 0;
    lessons.forEach(s => {
      let vis = true;
      if (v) {
        if (s.id === "cheatsheet") {
          let any = false;
          $$(".cc", s).forEach(c => { const m = c.textContent.toLowerCase().includes(v); c.hidden = !m; any = any || m; });
          vis = any;
        } else vis = s.textContent.toLowerCase().includes(v);
      } else if (s.id === "cheatsheet") $$(".cc", s).forEach(c => { c.hidden = false; });
      s.hidden = !vis; if (vis && s.id !== "cheatsheet") shown++;
    });
    const cs = $("#cheatsheet");
    empty.style.display = shown || (cs && !cs.hidden) ? "none" : "block";
    setTimeout(redrawAll, 30);
  };
  let qt; q.addEventListener("input", () => { clearTimeout(qt); qt = setTimeout(applyFilter, 150); });
}
addEventListener("course:show", () => setTimeout(redrawAll, 30));
document.fonts && document.fonts.ready.then(redrawAll);

window.LV = { $, $$, esc, hl, Stepper, mem, O, drawArrows };
})();
