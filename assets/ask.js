/* "Ask a question" window, shared by every tutorial page.
   A floating button opens a chat panel. Questions go to Claude (Anthropic's API) with the current lesson's
   text as context, plus any text selected on the page. The site is static, so each learner pastes their own
   Anthropic API key; it is kept in this browser's localStorage and sent only to api.anthropic.com.
   The official SDK (@anthropic-ai/sdk) is loaded from jsDelivr on the first question.
   Load it with <script src="../../assets/ask.js" defer></script> and ../../assets/ask.css. */
(() => {
"use strict";
if (window.__lvAsk || /[?&]film\b/.test(location.search)) return;   // once per page; never in the MCP video stage
window.__lvAsk = true;

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.8.0/+esm";
const MODEL = "claude-opus-5-5";
const KEY = "lv-ask-key", CHAT = "lv-ask-chat:" + location.pathname, KEEP = 30;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
};
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- a small, safe Markdown renderer for answers (escapes first, then formats) ---------- */
function inline(s) {
  return s.split(/(`[^`\n]+`)/).map(part => {
    if (/^`[^`\n]+`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
    return esc(part)
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>")
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }).join("");
}
const LIST = /^\s*([-*+]|\d+[.)])\s+/;
function md(src) {
  const lines = src.replace(/\r/g, "").split("\n"), out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {                       // fenced code (may be unclosed while streaming)
      const buf = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) buf.push(lines[i]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
    } else if (!line.trim()) {
      i++;
    } else if (/^#{1,6}\s/.test(line)) {
      out.push(`<h4>${inline(line.replace(/^#+\s+/, ""))}</h4>`); i++;
    } else if (LIST.test(line)) {
      const ordered = /^\s*\d/.test(line), items = [];
      while (i < lines.length && (LIST.test(lines[i]) || (items.length && /^\s{2,}\S/.test(lines[i])))) {
        if (LIST.test(lines[i])) items.push(lines[i].replace(LIST, "")); else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map(x => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^\s*```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !LIST.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${buf.map(inline).join("<br>")}</p>`);
    }
  }
  return out.join("");
}

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
const lessonTitle = el => (el && (el.dataset.title || el.querySelector("h1, h2, h3")?.textContent || "").trim()) || "";
function contextText() {
  const el = currentLesson();
  if (el) return { label: lessonTitle(el) || "this section", text: el.innerText.trim() };
  const intro = document.querySelector("#top, .hero, header, main");
  return { label: "the home screen", text: intro ? intro.innerText.trim() : "" };
}
function systemPrompt() {
  const { label, text } = contextText();
  return `You are a friendly, patient programming tutor built into "Learn Visually", a site of animated, interactive tutorials. The learner is reading one of its pages and asks you questions or shares doubts.

How to answer:
- Answer what they asked, grounded in the lesson below when it is relevant. Match their level: plain words first, then detail.
- Keep answers focused: usually a few short paragraphs. Show a short code example when it helps, in the language of the tutorial.
- Use Markdown: short paragraphs, bullet lists, \`inline code\` and fenced code blocks with a language name. Avoid tables and big headings.
- If they paste code with a bug, explain what is wrong and show the fix.
- If you are not sure, say so. If the question is unrelated to programming, answer briefly and kindly.

The page: ${pageTitle()}
The part on screen: ${label}

<lesson>
${text}
</lesson>`;
}

/* ---------- state ---------- */
let history = [];   // [{ role: "user", text, quote } | { role: "assistant", content: [...blocks], text }]
try { history = JSON.parse(store.get(CHAT) || "[]"); } catch (e) { history = []; }
const save = () => store.set(CHAT, JSON.stringify(history.slice(-KEEP)));
const apiMessages = () => history.map(m => m.role === "user"
  ? { role: "user", content: m.quote ? `I selected this on the page:\n<selection>\n${m.quote}\n</selection>\n\n${m.text}` : m.text }
  : { role: "assistant", content: m.content });   // whole content, thinking and fallback blocks included, passed back unchanged
let selection = "", stream = null, sdk = null;
const loadSdk = () => (sdk ??= import(SDK_URL).catch(e => { sdk = null; throw e; }));

/* ---------- UI ---------- */
const fab = document.createElement("button");
fab.type = "button"; fab.className = "ask-fab"; fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-controls", "askPanel");
fab.title = "Ask a question about this page (select text first to ask about it)";
fab.innerHTML = '<span aria-hidden="true">💬</span> Ask';

const panel = document.createElement("section");
panel.className = "ask-panel"; panel.id = "askPanel"; panel.hidden = true; panel.setAttribute("aria-label", "Ask a question");
panel.innerHTML = `
  <div class="ask-head"><b>Ask a question</b><span class="ask-sp"></span>
    <button type="button" class="ask-icon" data-ask="new" title="Start a new conversation">New</button>
    <button type="button" class="ask-icon" data-ask="key" title="API key settings">Key</button>
    <button type="button" class="ask-icon" data-ask="close" aria-label="Close">✕</button></div>
  <div class="ask-ctx"></div>
  <div class="ask-log" aria-live="polite"></div>
  <div class="ask-key" hidden></div>
  <div class="ask-sel" hidden><span></span><button type="button" class="ask-icon" data-ask="unsel" aria-label="Don't include the selection">✕</button></div>
  <form class="ask-form"><textarea rows="1" placeholder="Ask about this lesson…" aria-label="Your question"></textarea><button class="ask-send" type="submit">Send</button></form>`;
document.body.append(fab, panel);

const $ = s => panel.querySelector(s);
const log = $(".ask-log"), keyBox = $(".ask-key"), form = $(".ask-form"), input = $("textarea"), sendBtn = $(".ask-send"), selBox = $(".ask-sel");

function scrollDown() { log.scrollTop = log.scrollHeight; }
function bubble(cls, html) {
  const d = document.createElement("div");
  d.className = "ask-msg " + cls; d.innerHTML = html;
  log.append(d); scrollDown();
  return d;
}
function userHtml(m) {
  return (m.quote ? `<span class="ask-quote">${esc(m.quote)}</span>` : "") + esc(m.text);
}
function renderLog() {
  log.innerHTML = "";
  if (!history.length) {
    bubble("note ask-hint", `<p>Stuck or curious? Ask about the lesson on screen. Your question is sent with this lesson's text, so “why does this print 3?” just works.</p>
      <p>Tip: <b>select</b> some code or text on the page first to ask about exactly that.</p>
      <div class="ask-sugg">${["Explain this lesson in simpler words", "Give me another example", "What mistakes do beginners make here?", "Quiz me with 3 questions"].map(q => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>`);
    return;
  }
  for (const m of history) {
    if (m.role === "user") bubble("me", userHtml(m));
    else bubble("ai", md(m.text || ""));
  }
}
function updateContext() {
  const { label } = contextText();
  $(".ask-ctx").textContent = `About: ${pageTitle()} › ${label}`;
}
function showSelection(text) {
  selection = text;
  selBox.hidden = !text;
  selBox.querySelector("span").textContent = text ? `Selected: ${text.replace(/\s+/g, " ")}` : "";
}

function showKey(message = "") {
  const has = !!store.get(KEY);
  keyBox.hidden = false; log.hidden = true; form.hidden = true; selBox.hidden = true;
  keyBox.innerHTML = `
    <p><b>Answers come from Claude</b>, Anthropic's AI model, using <b>your own</b> Anthropic API key.</p>
    <p>1. Create a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com → API keys</a> (the account needs some prepaid credit).<br>2. Paste it below.</p>
    <input type="password" autocomplete="off" spellcheck="false" placeholder="${has ? "A key is saved. Paste a new one to replace it" : "sk-ant-…"}" aria-label="Anthropic API key">
    <div class="ask-row"><button type="button" class="ask-send" data-ask="savekey">Save key</button>
      ${has ? '<button type="button" class="ask-btn2" data-ask="forget">Remove saved key</button>' : ""}
      <button type="button" class="ask-btn2" data-ask="back">Back</button></div>
    ${message ? `<p class="ask-msg err">${esc(message)}</p>` : ""}
    <p class="ask-small">The key is stored only in this browser (localStorage) and sent only to api.anthropic.com. Questions are billed to your account, usually a few cents each with model ${MODEL}. Don't save a key on a shared computer, and remove it when you're done.</p>`;
  keyBox.querySelector("input").focus();
}
function hideKey() {
  keyBox.hidden = true; log.hidden = false; form.hidden = false; showSelection(selection);
  input.focus();
}

function open() {
  const sel = String(getSelection() || "").trim();
  if (sel && !panel.contains(getSelection().anchorNode)) showSelection(sel);
  panel.hidden = false; fab.setAttribute("aria-expanded", "true");
  updateContext(); renderLog();
  if (!store.get(KEY)) showKey(); else hideKey();
}
function close() {
  panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.focus();
}

/* ---------- asking ---------- */
function setBusy(on) {
  input.disabled = on;
  sendBtn.textContent = on ? "Stop" : "Send";
  sendBtn.dataset.mode = on ? "stop" : "send";
}
function errorText(err, Anthropic) {
  if (err instanceof Anthropic.APIUserAbortError) return null;
  if (err instanceof Anthropic.AuthenticationError) return "Your API key was rejected. Check it under Key, or create a new one.";
  if (err instanceof Anthropic.PermissionDeniedError) return "This key isn't allowed to use the model. Check the key's workspace and permissions in the Anthropic console.";
  if (err instanceof Anthropic.RateLimitError) return "Too many requests right now (rate limit). Wait a moment and try again.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach api.anthropic.com. Check your internet connection (or an ad/script blocker) and try again.";
  if (err instanceof Anthropic.APIError) {
    if (err.status === 402 || err.type === "billing_error") return "Your Anthropic account is out of credit. Add credit in the console, then try again.";
    if (err.status === 529 || err.status >= 500) return "The API is busy or having a problem. Try again in a minute.";
    return `The API returned an error (${err.status ?? "?"}): ${err.message}`;
  }
  return "Something went wrong: " + (err && err.message ? err.message : err);
}

async function ask(question) {
  const key = store.get(KEY);
  if (!key) return showKey();
  if (log.querySelector(".ask-hint")) log.innerHTML = "";
  const entry = { role: "user", text: question, quote: selection || undefined };
  history.push(entry);
  bubble("me", userHtml(entry));
  showSelection("");
  const out = bubble("ai ask-typing", "");
  setBusy(true);
  let Anthropic = null;
  try {
    ({ default: Anthropic } = await loadSdk());
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",                    // if a request is declined by a safety check, the API retries on a fallback model
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },    // the lesson text is cached across follow-up questions
      system: systemPrompt(),
      messages: apiMessages(),
    });
    stream.on("text", (_delta, snapshot) => { out.innerHTML = md(snapshot); scrollDown(); });
    const msg = await stream.finalMessage();
    let text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    out.classList.remove("ask-typing");
    if (msg.stop_reason === "refusal") {
      history.pop();
      out.className = "ask-msg err";
      out.textContent = "Claude declined to answer this one. Try rephrasing the question.";
    } else {
      if (msg.stop_reason === "max_tokens") text += "\n\n*(The answer was cut off because it got very long. Ask for the rest, or a shorter version.)*";
      out.innerHTML = md(text);
      history.push({ role: "assistant", content: msg.content, text });
      save();
    }
  } catch (err) {
    history.pop();                             // keep user/assistant turns paired for the next request
    out.classList.remove("ask-typing");
    const message = Anthropic ? errorText(err, Anthropic) : "Couldn't load the Claude SDK from cdn.jsdelivr.net. Check your connection and try again.";
    if (message === null) { out.classList.add("note"); out.innerHTML = (out.innerHTML ? out.innerHTML : "") + "<p><i>Stopped.</i></p>"; }
    else { out.className = "ask-msg err"; out.textContent = message; }
    if (Anthropic && err instanceof Anthropic.AuthenticationError) showKey(message);
  } finally {
    stream = null; setBusy(false); scrollDown();
    if (!input.disabled && !panel.hidden && keyBox.hidden) input.focus();
  }
}

/* ---------- events ---------- */
fab.addEventListener("click", open);
form.addEventListener("submit", e => {
  e.preventDefault();
  if (sendBtn.dataset.mode === "stop") { stream?.abort(); return; }
  const q = input.value.trim();
  if (!q) return;
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
  const b = e.target.closest("[data-ask]");
  if (!b) return;
  const a = b.dataset.ask;
  if (a === "close") close();
  else if (a === "new") { stream?.abort(); history = []; save(); renderLog(); hideKey(); }
  else if (a === "key") showKey();
  else if (a === "back") { if (store.get(KEY)) hideKey(); else close(); }
  else if (a === "unsel") showSelection("");
  else if (a === "forget") { store.set(KEY, null); showKey("Key removed from this browser."); }
  else if (a === "savekey") {
    const v = keyBox.querySelector("input").value.trim();
    if (!v.startsWith("sk-ant-")) { showKey("That doesn't look like an Anthropic API key (they start with sk-ant-)."); return; }
    store.set(KEY, v); hideKey(); renderLog();
  }
});
keyBox.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); keyBox.querySelector("[data-ask=savekey]").click(); } });
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
