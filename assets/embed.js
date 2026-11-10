/* Loaded by every tutorial page. Lets the tab shell switch the page's light/dark theme.
   Works on its own too: when a page is opened directly it uses the last saved theme. */
(function () {
  var KEY = "lv-theme";
  function apply(theme) {
    var root = document.documentElement;
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }
  try { apply(localStorage.getItem(KEY)); } catch (e) {}
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "lv-theme") apply(e.data.theme);
  });
})();
