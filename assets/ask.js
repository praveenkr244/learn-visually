/* "Ask a question" window, shared by every tutorial page.
   A floating button opens a chat panel. Sending a question opens Claude.ai in a new tab with the question
   already written, plus the tutorial, the lesson on screen, its key idea and any text selected on the page.
   No API key and no server: answers come from the learner's own (free or paid) Claude.ai account.
   The question is also copied to the clipboard, in case Claude.ai doesn't fill it in (for example after signing in).
   Load it with <script src="../../assets/ask.js" defer></script> and ../../assets/ask.css. */
(() => {
"use strict";
if (window.__lvAsk || /[?&]film\b/.test(location.search)) return;   // once per page; never in the MCP video stage
window.__lvAsk = true;

const CLAUDE_URL = "https://claude.ai/new?q=";
const MAX_SELECTION = 4000;            // keeps the link short enough for Claude.ai to accept it
const HISTORY = "lv-ask-q:" + location.pathname, KEEP = 30;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
};
// An earlier version asked for an API key; never keep one around
store.set("lv-ask-key", null);
store.set("lv-ask-chat:" + location.pathname, null);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- what the learner is looking at ---------- */
function currentLesson() {
  const cur = document.querySelector("[data-lesson].cur");     // course mode: the lesson on screen
  if (cur) return cur;
  if (document.body.dataset.view === "home") return null;       // course home screen
  let best = null;                                              // other pages: the section at the top of the view
  for (const s of document.querySelectorAll("main section[id], section[id]")) {
    if (!s.offsetParent) continue;
    const r = s.getBoundingClientRect();
    if (r.top <= innerHeight * 0.45 && r.bottom > 90) best = s;
  }
  return best;
}
const pageTitle = () => (document.title || "this tutorial").replace(/\s*·.*$/, "");
function context() {
  const el = currentLesson();
  if (!el) return { label: "", keyIdea: "" };
  const label = (el.dataset.title || el.querySelector("h1, h2, h3")?.textContent || "").trim();
  const key = el.querySelector(".c-key");
  const keyIdea = key ? key.textContent.replace(/^\s*Key idea\s*/i, "").trim() : "";
  return { label, keyIdea };
}
// A public link to the lesson, so Claude.ai can open it; local files and localhost links aren't useful there
function publicLink() {
  if (!/^https:$/.test(location.protocol) || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return "";
  const el = currentLesson();
  return location.origin + location.pathname + (el && el.id ? "#" + el.id : location.hash);
}

function buildPrompt(question, quote) {
  const { label, keyIdea } = context();
  const lines = [`I'm learning with the "${pageTitle()}" tutorial on Learn Visually${label ? `, lesson "${label}"` : ""}.`];
  if (keyIdea) lines.push(`The lesson's key idea: ${keyIdea}`);
  const link = publicLink();
  if (link) lines.push(`Lesson page: ${link}`);
  if (quote) lines.push("", "This is the part I'm asking about:", "```", quote, "```");
  lines.push("", `My question: ${question}`, "", "Please explain it clearly for a learner, with a short example if it helps.");
  return lines.join("\n");
}

/* ---------- state ---------- */
let asked = [];   // [{ q, quote }]
try { asked = JSON.parse(store.get(HISTORY) || "[]"); } catch (e) { asked = []; }
const save = () => store.set(HISTORY, JSON.stringify(asked.slice(-KEEP)));
let selection = "";

/* ---------- UI ---------- */
const fab = document.createElement("button");
fab.type = "button"; fab.className = "ask-fab"; fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-controls", "askPanel");
fab.title = "Ask a question about this page (select text first to ask about it)";
fab.innerHTML = '<span aria-hidden="true">💬</span> Ask';

const panel = document.createElement("section");
panel.className = "ask-panel"; panel.id = "askPanel"; panel.hidden = true; panel.setAttribute("aria-label", "Ask a question");
panel.innerHTML = `
  <div class="ask-head"><b>Ask a question</b><span class="ask-sp"></span>
    <button type="button" class="ask-icon" data-ask="new" title="Clear your past questions on this page">Clear</button>
    <button type="button" class="ask-icon" data-ask="close" aria-label="Close">✕</button></div>
  <div class="ask-ctx"></div>
  <div class="ask-log" aria-live="polite"></div>
  <div class="ask-sel" hidden><span></span><button type="button" class="ask-icon" data-ask="unsel" aria-label="Don't include the selection">✕</button></div>
  <form class="ask-form"><textarea rows="1" placeholder="Ask about this lesson…" aria-label="Your question"></textarea><button class="ask-send" type="submit">Ask ↗</button></form>`;
document.body.append(fab, panel);

const $ = s => panel.querySelector(s);
const log = $(".ask-log"), form = $(".ask-form"), input = $("textarea"), selBox = $(".ask-sel");

function scrollDown() { log.scrollTop = log.scrollHeight; }
function bubble(cls, html) {
  const d = document.createElement("div");
  d.className = "ask-msg " + cls; d.innerHTML = html;
  log.append(d); scrollDown();
  return d;
}
const userHtml = m => (m.quote ? `<span class="ask-quote">${esc(m.quote)}</span>` : "") + esc(m.q);
const sentHtml = (i, note = "") => `Opened in <b>Claude.ai</b> in a new tab. The question is also copied: if it isn't filled in there (for example after signing in), paste it with Ctrl/⌘ + V.${note}
  <div class="ask-sugg"><button type="button" data-again="${i}">Open again ↗</button></div>`;

function renderLog() {
  log.innerHTML = "";
  bubble("note ask-hint", `<p>Stuck or curious? Type your question and press <b>Ask</b>. It opens in <b>Claude.ai</b> in a new tab, already written, together with this tutorial's name, the lesson on screen and its key idea. You need a Claude.ai account (the free plan works); nothing else to set up.</p>
    <p>Tip: <b>select</b> some code or text on the page first to ask about exactly that.</p>
    ${asked.length ? "" : `<div class="ask-sugg">${["Explain this lesson in simpler words", "Give me another example", "What mistakes do beginners make here?", "Quiz me with 3 questions"].map(q => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>`}`);
  asked.forEach((m, i) => { bubble("me", userHtml(m)); bubble("ai", sentHtml(i)); });
}
function updateContext() {
  const { label } = context();
  $(".ask-ctx").textContent = `About: ${pageTitle()}${label ? " › " + label : ""}`;
}
function showSelection(text) {
  selection = text;
  selBox.hidden = !text;
  selBox.querySelector("span").textContent = text ? `Selected: ${text.replace(/\s+/g, " ")}` : "";
}

function open() {
  const sel = String(getSelection() || "").trim();
  if (sel && !panel.contains(getSelection().anchorNode)) showSelection(sel);
  panel.hidden = false; fab.setAttribute("aria-expanded", "true");
  updateContext(); renderLog(); input.focus();
}
function close() {
  panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.focus();
}

/* ---------- asking: copy the prompt and open Claude.ai (both inside the click, so pop-up blockers allow it) ---------- */
function openInClaude(prompt) {
  if (navigator.clipboard) navigator.clipboard.writeText(prompt).catch(() => {});
  return window.open(CLAUDE_URL + encodeURIComponent(prompt), "_blank", "noopener");
}
function ask(question) {
  let quote = selection, note = "";
  if (quote.length > MAX_SELECTION) {
    quote = quote.slice(0, MAX_SELECTION);
    note = `<br><i>Your selection was long, so only its first ${MAX_SELECTION.toLocaleString()} characters were included. Paste the rest in Claude.ai if needed.</i>`;
  }
  const entry = { q: question, quote: quote || undefined };
  openInClaude(buildPrompt(entry.q, entry.quote));
  log.querySelector(".ask-hint .ask-sugg")?.remove();
  asked.push(entry); save();
  bubble("me", userHtml(entry));
  bubble("ai", sentHtml(asked.length - 1, note));
  showSelection("");
}

/* ---------- events ---------- */
fab.addEventListener("click", open);
form.addEventListener("submit", e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) { input.focus(); return; }
  input.value = ""; input.style.height = "";
  ask(q);
});
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
});
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; });
panel.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
panel.addEventListener("click", e => {
  const q = e.target.closest("[data-q]");
  if (q) { ask(q.dataset.q); return; }
  const again = e.target.closest("[data-again]");
  if (again) { const m = asked[+again.dataset.again]; if (m) openInClaude(buildPrompt(m.q, m.quote)); return; }
  const b = e.target.closest("[data-ask]");
  if (!b) return;
  const a = b.dataset.ask;
  if (a === "close") close();
  else if (a === "new") { asked = []; save(); renderLog(); input.focus(); }
  else if (a === "unsel") showSelection("");
});
// While the panel is open, selecting text on the page attaches it to the next question
document.addEventListener("selectionchange", () => {
  if (panel.hidden) return;
  const s = getSelection();
  const text = String(s || "").trim();
  if (text && !panel.contains(s.anchorNode)) showSelection(text);
});
addEventListener("hashchange", () => { if (!panel.hidden) updateContext(); });
addEventListener("course:show", () => { if (!panel.hidden) updateContext(); });
})();
