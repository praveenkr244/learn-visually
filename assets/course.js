/* Course mode shared by the Java Strings, Java Arrays and Python tabs.
   Shows one lesson per screen with a progress bar, a lesson menu, ← → keys, saved progress,
   and adds to every lesson: a key idea, a "Remember" box, practice exercises and a quick check.

   The page sets window.COURSE before loading this file:
     key     localStorage prefix ("js", "ja", "pyvis")
     title   shown in the bar on the home screen
     lang    "java" (practice uses <pre class="jrun">) or "python" (<pre class="code" data-run>)
     parts   [{ name, color }]
     tag()   marks the page: [data-lesson] with id, data-part (index), data-title;
             optional [data-head] inside a lesson (the key idea goes after it),
             [data-only-home] (home screen only), [data-only-all] (hidden in course mode),
             [data-wrap] (a container of lessons), [data-parts] (part cards), [data-cta] (continue buttons)
     data    { lessonId: { e: emoji, k: key idea HTML, r: [remember HTML ×3],
                           q: [question, [options], answerIndex, why],
                           p: [{ t: task HTML, c: starter code, s: solution code, o: expected output }] } }
   Load it after the page markup and before the code runner, so practice blocks get Run buttons. */
(() => {
"use strict";
const C = window.COURSE; if (!C) return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
const K = C.key, DONE = K + "-done", LAST = K + "-last";

C.tag();
document.body.classList.add("course");
// fold long blocks (C.fold: selector, C.foldLabel(el): summary HTML) so a lesson fits on fewer screens
if (C.fold) $$(C.fold).forEach(el => {
  const d = document.createElement("details"); d.className = "c-fold";
  d.innerHTML = `<summary>${C.foldLabel ? C.foldLabel(el) : "Show more"}</summary>`;
  el.before(d); d.append(el);
});
const lessons = $$("[data-lesson]"), N = lessons.length;
const countable = lessons.filter(s => !s.hasAttribute("data-nocount"));
const done = new Set((store(DONE) || []).filter(id => countable.some(s => s.id === id)));
const markDone = id => { if (done.has(id) || !countable.some(s => s.id === id)) return; done.add(id); store(DONE, [...done]); paint(); };
const part = s => C.parts[+s.dataset.part];
const D = s => C.data[s.id] || {};

/* top bar and lesson menu */
const bar = document.createElement("div"); bar.className = "c-bar";
bar.innerHTML = `<button type="button" class="c-btn c-menu" aria-expanded="false" aria-controls="cDrawer">☰ <span>Lessons</span></button>
  <a class="c-where" href="#home"></a>
  <div class="c-prog" role="progressbar" aria-label="Lessons done" aria-valuemin="0" aria-valuemax="${countable.length}"><i></i></div>
  <button type="button" class="c-btn c-nav" data-go="-1" aria-label="Previous lesson">‹</button><button type="button" class="c-btn pri c-nav" data-go="1" aria-label="Next lesson">›</button>`;
(C.barIn ? $(C.barIn) : document.body).insertAdjacentElement(C.barIn ? "beforeend" : "afterbegin", bar);
const drawer = document.createElement("nav"); drawer.className = "c-drawer"; drawer.id = "cDrawer"; drawer.hidden = true; drawer.setAttribute("aria-label", "All lessons");
document.body.append(drawer);
const menuBtn = $(".c-menu", bar);
const openDrawer = open => {
  drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open);
  if (open) { drawer.style.top = Math.max(0, bar.getBoundingClientRect().bottom) + "px"; const c = $("a.cur", drawer); (c || $("a", drawer)).focus(); c && c.scrollIntoView({ block: "center" }); }
};
menuBtn.addEventListener("click", () => openDrawer(drawer.hidden));
document.addEventListener("click", e => { if (!drawer.hidden && !drawer.contains(e.target) && !menuBtn.contains(e.target)) openDrawer(false); });

/* what each lesson gets */
const codeBlock = (src, title) => C.lang === "java"
  ? Object.assign(document.createElement("pre"), { className: "jrun", textContent: src }).outerHTML.replace("<pre", `<pre data-title="${esc(title)}"`)
  : `<pre class="code" data-run>${esc(src)}</pre>`;
lessons.forEach((s, i) => {
  const d = D(s), p = part(s);
  s.style.setProperty("--pc", p.color);
  s.insertAdjacentHTML("afterbegin", `<p class="c-crumb"><span class="c-pill">${esc(p.name)}</span> Lesson ${i + 1} of ${N}${d.e ? ` <span class="c-emoji" aria-hidden="true">${d.e}</span>` : ""}</p>`);
  const head = $("[data-head]", s);
  if (d.k) (head || $("h2, h3", s)).insertAdjacentHTML("afterend", `<p class="c-key"><span class="c-kl">Key idea</span> ${d.k}</p>`);
  let html = "";
  if (d.r) html += `<ul class="c-remember">${d.r.map(x => `<li>${x}</li>`).join("")}</ul>`;
  (d.p || []).forEach((x, k) => {
    html += `<div class="c-practice"><p class="c-ph">🏋️ Practice ${k + 1}${d.p.length > 1 ? ` of ${d.p.length}` : ""} · your turn</p><p class="c-pt">${x.t}</p>
      ${codeBlock(x.c, "Your turn: edit, then Run")}
      ${x.o ? `<p class="c-po">Expected output: <code>${esc(x.o)}</code></p>` : ""}
      ${x.s ? `<details class="c-ps"><summary>Stuck? Show a solution</summary>${codeBlock(x.s, "One solution")}</details>` : ""}</div>`;
  });
  if (d.q) {
    const [q, o] = d.q;
    html += `<div class="c-check"><p class="c-ch">Quick check</p><p class="c-cq">${esc(q)}</p><div class="c-opts">${o.map((t, k) => `<button type="button" data-k="${k}">${esc(t)}</button>`).join("")}</div><p class="c-why" hidden></p></div>`;
  }
  const prev = lessons[i - 1], next = lessons[i + 1];
  html += `<div class="c-foot">${prev ? `<a class="c-btn" href="#${prev.id}">‹ ${esc(prev.dataset.title)}</a>` : `<a class="c-btn" href="#home">‹ Home</a>`}
    ${next ? `<a class="c-btn pri" href="#${next.id}" data-cdone="${s.id}">Next: ${esc(next.dataset.title)} ›</a>` : `<a class="c-btn pri" href="#home" data-cdone="${s.id}">Finish 🎉</a>`}</div>`;
  s.insertAdjacentHTML("beforeend", `<div class="c-extra">${html}</div>`);
  const ck = $(".c-check", s);
  if (ck) ck.addEventListener("click", e => {
    const b = e.target.closest("button[data-k]"); if (!b || ck.dataset.answered) return;
    const [, , a, why] = d.q, k = +b.dataset.k, ok = k === a;
    if (ok) ck.dataset.answered = 1;
    b.classList.add(ok ? "right" : "wrong");
    const w = $(".c-why", ck); w.hidden = false; w.innerHTML = ok ? `✓ ${why}` : "Not quite. Try another answer.";
    if (ok) { ck.classList.add("passed"); markDone(s.id); }
  });
  const h = $("h2, h3", s); if (h) h.tabIndex = -1;
});
document.addEventListener("click", e => { const a = e.target.closest("[data-cdone]"); if (a) markDone(a.dataset.cdone); });

/* progress, menu and home cards */
function paint() {
  const cur = location.hash.slice(1), n = done.size, all = document.body.classList.contains("all");
  $(".c-prog i", bar).style.width = `${n / countable.length * 100}%`;
  $(".c-prog", bar).setAttribute("aria-valuenow", n);
  $(".c-prog", bar).title = `${n} of ${countable.length} lessons done`;
  drawer.innerHTML = `<a href="#home" class="c-home">🏠 Home · ${n}/${countable.length} done</a>` + C.parts.map((p, pi) => {
    const ls = lessons.filter(s => +s.dataset.part === pi);
    return ls.length ? `<p class="c-dpart" style="--pc:${p.color}">${esc(p.name)}</p>` + ls.map(s => `<a href="#${s.id}" class="${s.id === cur ? "cur" : ""}"><span class="c-mk">${done.has(s.id) ? "✓" : D(s).e || "•"}</span> <span>${lessons.indexOf(s) + 1}. ${esc(s.dataset.title)}</span></a>`).join("") : "";
  }).join("") + `<div class="c-dtools"><button type="button" class="c-btn" data-all>${all ? "One lesson at a time" : "Show all on one page"}</button><button type="button" class="c-btn" data-reset>Reset progress</button></div>`;
  const cards = $("[data-parts]");
  if (cards) cards.innerHTML = C.parts.map((p, pi) => {
    const ls = lessons.filter(s => +s.dataset.part === pi); if (!ls.length) return "";
    const cnt = ls.filter(s => done.has(s.id)).length, first = ls.find(s => !done.has(s.id) && !s.hasAttribute("data-nocount")) || ls[0];
    return `<a class="c-card" href="#${first.id}" style="--pc:${p.color}"><span class="c-cn">Part ${pi + 1}</span><b>${esc(p.name)}</b><span class="c-ce">${ls.map(s => `<i class="${done.has(s.id) ? "d" : ""}" title="${esc(s.dataset.title)}">${D(s).e || "•"}</i>`).join("")}</span><span class="c-cp">${cnt}/${ls.length} done</span></a>`;
  }).join("");
  const cta = $("[data-cta]");
  if (cta) {
    const last = store(LAST), nextUp = countable.find(s => !done.has(s.id));
    cta.innerHTML = last && lessons.some(s => s.id === last)
      ? `<a class="c-btn pri" href="#${last}">Continue: ${esc($("#" + CSS.escape(last)).dataset.title)} →</a> <a class="c-btn" href="#${(nextUp || lessons[0]).id}">${nextUp ? "First unfinished lesson" : "Start again"}</a>`
      : `<a class="c-btn pri" href="#${lessons[0].id}">Start lesson 1 →</a> <button type="button" class="c-btn" data-all>Show everything on one page</button>`;
  }
}
const setAll = on => { document.body.classList.toggle("all", on); route(); };
document.addEventListener("click", e => {
  if (e.target.closest("[data-all]")) { setAll(!document.body.classList.contains("all")); return; }
  if (e.target.closest("[data-reset]")) {
    done.clear(); store(DONE, []); store(LAST, "");
    $$(".c-check").forEach(c => { delete c.dataset.answered; c.classList.remove("passed"); $$("button", c).forEach(b => b.className = ""); $(".c-why", c).hidden = true; });
    paint(); return;
  }
  if (drawer.contains(e.target) && e.target.closest("a")) openDrawer(false);
});

/* routing: #home, #<lesson id>, or any id inside a lesson */
function route() {
  const id = decodeURIComponent(location.hash.slice(1)), all = document.body.classList.contains("all");
  let el = id && document.getElementById(id), i = el ? lessons.findIndex(s => s === el || s.contains(el)) : -1;
  lessons.forEach((s, k) => s.classList.toggle("cur", k === i));
  document.body.dataset.view = i < 0 ? "home" : "lesson";
  const s = lessons[i];
  $(".c-where", bar).innerHTML = s ? `<span class="c-pill" style="--pc:${part(s).color}">${esc(part(s).name)}</span> <b>${i + 1}/${N}</b> <span class="c-wt">${esc(s.dataset.title)}</span>` : `<b>${esc(C.title)}</b>`;
  $$(".c-nav", bar).forEach(b => b.disabled = (b.dataset.go === "-1" && i < 0) || (b.dataset.go === "1" && i === N - 1));
  if (s) store(LAST, s.id);
  paint();
  if (all && el) el.scrollIntoView();
  else if (s && el !== s) el.scrollIntoView();
  else { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ""; }
  if (s && !all && el === s) { const h = $("h2, h3", s); h && h.focus({ preventScroll: true }); }
  dispatchEvent(new Event("resize"));   // diagrams that measure themselves redraw now that they are visible
  dispatchEvent(new CustomEvent("course:show", { detail: s ? s.id : null }));
}
const step = d => {
  const i = lessons.findIndex(s => s.classList.contains("cur"));
  if (d > 0 && i >= 0) markDone(lessons[i].id);
  const j = i < 0 ? (d > 0 ? 0 : -1) : i + d;
  location.hash = j < 0 ? "home" : lessons[Math.min(N - 1, j)].id;
};
bar.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) step(+b.dataset.go); });
addEventListener("keydown", e => {
  if (e.key === "Escape") return openDrawer(false);
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || /input|select|textarea/i.test(e.target.tagName) || e.target.isContentEditable) return;
  if (document.body.classList.contains("all")) return;
  if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
});
addEventListener("hashchange", route);
window.course = { setAll, route, markDone };
route();
})();
