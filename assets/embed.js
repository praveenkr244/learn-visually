/* Loaded by every tutorial page. Lets the tab shell switch the page's light/dark theme.
   Works on its own too: when a page is opened directly it uses the last saved theme. */
(function () {
  var KEY = "lv-theme";
  function apply(theme) {
    var root = document.documentElement;
    var palette = /^(sepia|ocean|forest)$/.test(theme);
    if (theme === "light" || theme === "dark" || palette) root.setAttribute("data-theme", palette ? "light" : theme);
    else root.removeAttribute("data-theme");
    if (palette) root.setAttribute("data-palette", theme); else root.removeAttribute("data-palette");
  }
  try { apply(localStorage.getItem(KEY)); } catch (e) {}
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "lv-theme") apply(e.data.theme);
  });
})();
