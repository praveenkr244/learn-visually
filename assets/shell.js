/* Builds the tabs from TUTORIALS, lazy-loads each tutorial into its own iframe,
   keeps the URL hash in sync (#strings, #arrays, #python) and passes the theme down. */
(function () {
  "use strict";
  var list = window.TUTORIALS || [];
  var tabs = document.getElementById("tabs");
  var panels = document.getElementById("panels");
  var newTab = document.getElementById("newTab");
  var THEME_KEY = "lv-theme";

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  list.forEach(function (t, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "tab"; b.id = "tab-" + t.id;
    b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "panel-" + t.id);
    b.style.setProperty("--c", t.color || "var(--accent)");
    b.innerHTML = "<b></b><small></small>";
    b.querySelector("b").textContent = t.label;
    b.querySelector("small").textContent = t.note || "";
    b.addEventListener("click", function () { select(t.id, true); });
    tabs.appendChild(b);

    var p = document.createElement("section");
    p.className = "panel"; p.id = "panel-" + t.id; p.hidden = true;
    p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", b.id);
    panels.appendChild(p);
  });

  function load(t, panel) {
    if (panel.querySelector("iframe")) return;
    var msg = document.createElement("div"); msg.className = "loading"; msg.textContent = "Loading " + t.label + "…";
    var f = document.createElement("iframe");
    f.title = t.label; f.src = t.path; f.loading = "eager";
    f.addEventListener("load", function () { msg.remove(); sendTheme(f); });
    panel.appendChild(msg); panel.appendChild(f);
  }

  function select(id, push) {
    var t = list.filter(function (x) { return x.id === id; })[0] || list[0];
    if (!t) return;
    list.forEach(function (x) {
      var on = x.id === t.id;
      var b = document.getElementById("tab-" + x.id), p = document.getElementById("panel-" + x.id);
      b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; p.hidden = !on;
      if (on) { load(x, p); b.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    });
    newTab.href = t.path;
    document.title = t.label + " · Learn Visually";
    if (push && location.hash !== "#" + t.id) history.replaceState(null, "", "#" + t.id);
    store("lv-last-tab", t.id);
  }

  tabs.addEventListener("keydown", function (e) {
    var i = list.findIndex(function (x) { return document.getElementById("tab-" + x.id) === document.activeElement; });
    if (i < 0) return;
    var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (n === null) return;
    e.preventDefault(); n = (n + list.length) % list.length;
    select(list[n].id, true); document.getElementById("tab-" + list[n].id).focus();
  });

  /* theme: auto / light / dark, or a light color palette (sepia / ocean / forest),
     applied to the shell and every loaded tutorial */
  function sendTheme(frame) {
    var theme = store(THEME_KEY) || "auto";
    try { frame.contentWindow.postMessage({ type: "lv-theme", theme: theme }, "*"); } catch (e) {}
  }
  function applyTheme(theme) {
    var root = document.documentElement;
    var palette = /^(sepia|ocean|forest)$/.test(theme);
    if (theme === "light" || theme === "dark" || palette) root.setAttribute("data-theme", palette ? "light" : theme); else root.removeAttribute("data-theme");
    if (palette) root.setAttribute("data-palette", theme); else root.removeAttribute("data-palette");
    document.querySelectorAll("[data-theme-btn]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.themeBtn === theme); });
    store(THEME_KEY, theme);
    document.querySelectorAll(".panel iframe").forEach(sendTheme);
  }
  document.querySelectorAll("[data-theme-btn]").forEach(function (b) {
    b.addEventListener("click", function () { applyTheme(b.dataset.themeBtn); });
  });
  applyTheme(store(THEME_KEY) || "auto");

  document.querySelector("[data-home]").addEventListener("click", function (e) { e.preventDefault(); select(list[0].id, true); });
  window.addEventListener("hashchange", function () { select(location.hash.slice(1), false); });
  select(location.hash.slice(1) || store("lv-last-tab") || (list[0] && list[0].id), true);
})();
