/* Runnable Java examples for the Java tutorials.
   Markup: <pre class="jrun" data-title="What it shows">class Main { ... }</pre>
   Each block gets Edit / Reset / Run buttons. Run sends the code to a free online compiler
   (Compiler Explorer at https://godbolt.org, or https://wandbox.org if that fails), which runs it with a real JDK 21. */
(() => {
"use strict";
const API = "https://wandbox.org/api/compile.json";
const JDK = "openjdk-jdk-21+35";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const KW = new Set(("abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if " +
  "implements import instanceof int interface long new null package private protected public record return short static super switch " +
  "synchronized this throw throws transient true false try var void volatile while yield").split(" "));
const RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])+')|\b([A-Za-z_]\w*)\b/g;
function hl(code) {
  let out = "", last = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    if (m[3] && !KW.has(m[3])) continue;
    out += esc(code.slice(last, m.index));
    out += `<span class="${m[1] ? "c" : m[2] ? "s" : "k"}">${esc(m[0])}</span>`;
    last = RE.lastIndex;
  }
  return out + esc(code.slice(last));
}

/* Two free online compilers; each returns { compile, compiled, stdout, stderr, exit }.
   Compiler Explorer (godbolt.org) runs first; if it can't be reached, Wandbox is tried. */
const CE = "https://godbolt.org/api/compiler/java2102/compile";   // JDK 21.0.2
const lines = a => (a || []).map(x => x.text).join("\n");
async function viaGodbolt(src, signal) {
  const res = await fetch(CE, {
    method: "POST", signal, headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ source: src, lang: "java", options: { userArguments: "", executeParameters: { args: [], stdin: "" },
      compilerOptions: { executorRequest: true }, filters: { execute: true }, tools: [], libraries: [] } })
  });
  if (!res.ok) throw new Error("godbolt.org answered " + res.status);
  const r = await res.json(), b = r.buildResult || {};
  const compiled = (b.code ?? 0) === 0 && r.didExecute !== false;
  return { compile: lines(b.stderr) || (compiled ? "" : lines(r.stderr)), compiled, stdout: compiled ? lines(r.stdout) : "",
    stderr: compiled ? lines(r.stderr) : "", exit: compiled ? String(r.code ?? 0) : String(b.code ?? 1), host: "godbolt.org" };
}
async function viaWandbox(src, signal) {
  const res = await fetch(API, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ compiler: JDK, code: src }) });
  if (!res.ok) throw new Error("wandbox.org answered " + res.status);
  const r = await res.json(), exit = String(r.status ?? "0");
  const compiled = !r.compiler_error || !!(r.program_output || r.program_error) || exit === "0";
  return { compile: r.compiler_error || "", compiled, stdout: r.program_output || "",
    stderr: (r.program_error || "") + (r.signal ? "\nStopped by " + r.signal + " (time or memory limit)" : ""), exit, host: "wandbox.org" };
}

async function runJava(src, out) {
  out.className = "jr-out wait";
  out.textContent = "Compiling and running…";
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 40000);
  let r, why = [], noThreads = null;
  try {
    for (const run of [viaGodbolt, viaWandbox]) {
      try {
        r = await run(src, ctl.signal);
        // godbolt.org's sandbox can't start threads; try Wandbox for those programs
        if (r.host === "godbolt.org" && /unable to create native thread/.test(r.stderr)) { noThreads = r; r = null; continue; }
        break;
      }
      catch (e) { if (e.name === "AbortError") throw e; why.push(e.message); }
    }
    if (!r && noThreads) { r = noThreads; r.stderr += "\n\nThis example starts threads, which the godbolt.org sandbox doesn't allow, and the backup compiler (wandbox.org) couldn't be reached. Run it with: java Main.java"; }
    if (!r) throw new Error(why.join("; "));
    const parts = [];
    if (r.compile) parts.push([r.compiled ? "Compiler warning" : "Compile error", r.compile]);
    if (r.stdout) parts.push(["", r.stdout]);
    if (r.stderr) parts.push(["Error", r.stderr]);
    out.className = "jr-out" + (r.exit !== "0" || !r.compiled ? " err" : "");
    out.innerHTML = parts.length
      ? parts.map(([h, t]) => (h ? `<b>${h}</b>` : "") + esc(t.replace(/\s+$/, ""))).join("\n")
      : "(no output)";
    if (r.compiled && r.exit !== "0") out.insertAdjacentHTML("beforeend", `\n<b>exit code ${esc(r.exit)}</b>`);
    out.title = "Ran on " + r.host;
  } catch (e) {
    out.className = "jr-out err";
    out.textContent = (e.name === "AbortError" ? "The online compiler took too long to answer." : "Couldn't reach an online compiler (" + e.message + ").") +
      "\nCheck your internet connection, or copy the code into Main.java and run: java Main.java";
  } finally { clearTimeout(timer); }
}

document.querySelectorAll("pre.jrun").forEach((pre, i) => {
  const src = pre.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
  const box = document.createElement("div");
  box.className = "jr";
  box.innerHTML = `<div class="jr-head"><span class="jr-title"></span>` +
    `<button type="button" data-j="copy">Copy</button><button type="button" data-j="edit">Edit</button>` +
    `<button type="button" data-j="reset" hidden>Reset</button><button type="button" class="run" data-j="run">▶ Run</button></div>` +
    `<pre class="jsrc" tabindex="0"></pre><textarea spellcheck="false" hidden></textarea><pre class="jr-out" aria-live="polite"></pre>`;
  box.querySelector(".jr-title").innerHTML = esc(pre.dataset.title || "Example " + (i + 1)) + "<small>Java 21</small>";
  const view = box.querySelector(".jsrc"), ta = box.querySelector("textarea"), out = box.querySelector(".jr-out");
  const title = pre.dataset.title || "Java example";
  view.setAttribute("aria-label", "Java code: " + title);
  ta.setAttribute("aria-label", "Edit Java code: " + title);
  view.innerHTML = hl(src);
  ta.value = src;
  pre.replaceWith(box);

  const btn = k => box.querySelector(`[data-j="${k}"]`);
  const editing = on => {
    ta.hidden = !on; view.hidden = on;
    btn("edit").textContent = on ? "Done" : "Edit";
    btn("reset").hidden = ta.value === src;
    if (on) { ta.rows = Math.min(30, ta.value.split("\n").length + 1); ta.focus(); }
    else view.innerHTML = hl(ta.value);
  };
  box.addEventListener("click", async e => {
    const b = e.target.closest("[data-j]");
    if (!b) return;
    const a = b.dataset.j;
    if (a === "edit") editing(ta.hidden);
    else if (a === "reset") { ta.value = src; editing(false); out.textContent = ""; out.className = "jr-out"; }
    else if (a === "copy") {
      try { await navigator.clipboard.writeText(ta.value); b.textContent = "Copied ✓"; }
      catch (err) { b.textContent = "Select and copy"; }
      setTimeout(() => { b.textContent = "Copy"; }, 1600);
    } else if (a === "run") {
      b.disabled = true;
      await runJava(ta.value, out);
      b.disabled = false;
    }
  });
  ta.addEventListener("input", () => { btn("reset").hidden = ta.value === src; });
  ta.addEventListener("keydown", e => {
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); btn("reset").hidden = false; }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); btn("run").click(); }
  });
});
})();
