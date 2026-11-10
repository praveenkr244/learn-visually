/* Runnable Java examples for the Java tutorials.
   Markup: <pre class="jrun" data-title="What it shows">class Main { ... }</pre>
   Each block gets Edit / Reset / Run buttons. Run sends the code to the free Wandbox
   compiler (https://wandbox.org), which compiles and runs it with a real JDK. */
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

async function runJava(src, out) {
  out.className = "jr-out wait";
  out.textContent = "Compiling and running on wandbox.org…";
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const res = await fetch(API, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compiler: JDK, code: src })
    });
    if (!res.ok) throw new Error("the compiler service answered " + res.status);
    const r = await res.json();
    const parts = [];
    if (r.compiler_error) parts.push(["Compile error", r.compiler_error]);
    if (r.program_output) parts.push(["", r.program_output]);
    if (r.program_error) parts.push(["Error", r.program_error]);
    if (r.signal) parts.push(["", "Stopped by " + r.signal + " (time or memory limit)"]);
    out.className = "jr-out" + (r.status !== "0" || r.compiler_error ? " err" : "");
    out.innerHTML = parts.length
      ? parts.map(([h, t]) => (h ? `<b>${h}</b>` : "") + esc(t.replace(/\s+$/, ""))).join("\n")
      : "(no output)";
    if (r.status && r.status !== "0" && !r.compiler_error) out.insertAdjacentHTML("beforeend", `\n<b>exit code ${esc(r.status)}</b>`);
  } catch (e) {
    out.className = "jr-out err";
    out.textContent = (e.name === "AbortError" ? "The compiler took too long to answer." : "Couldn't reach the online compiler (" + e.message + ").") +
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
