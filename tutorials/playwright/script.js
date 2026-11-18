/* Playwright, Visually — chapter nav, code highlighting and the interactive diagrams.
   Every widget is a function W[name](host) that builds itself inside <div class="widget" data-w="name">. */
(function () {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- code highlighting (TypeScript / shell / YAML) ---------- */
const KW = new Set("const let var await async function return import from export default new for of in if else true false null undefined type class extends typeof this while".split(" "));
const RE = /((?<!:)\/\/[^\n]*|(?<![^\s])#[^\n]*|&lt;!--[\s\S]*?--&gt;)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|((?<![\w.])@[\w-]+)|(\b\d[\d_.]*\b)|\b([A-Za-z_$][\w$]*)\b/g;
function hl(code) {
  let out = "", last = 0, m;
  code = esc(code);
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    out += code.slice(last, m.index);
    if (m[1]) out += `<span class="c">${m[1]}</span>`;
    else if (m[2]) out += `<span class="s">${m[2]}</span>`;
    else if (m[3]) out += `<span class="d">${m[3]}</span>`;
    else if (m[4]) out += `<span class="n">${m[4]}</span>`;
    else out += KW.has(m[5]) ? `<span class="k">${m[5]}</span>` : m[5];
    last = RE.lastIndex;
  }
  return out + code.slice(last);
}
$$("pre.code").forEach(p => { p.innerHTML = hl(p.textContent.replace(/^\n+|\s+$/g, "")); });

/* A tiny step player shared by several widgets: Play/Back/Next + a note line. */
function stepper(host, n, draw, { auto = 1600, loop = false } = {}) {
  const row = document.createElement("div"); row.className = "wrow";
  row.innerHTML = `<button type="button" class="btn pri" data-a="play">▶ Play</button><button type="button" class="btn" data-a="back">‹ Back</button><button type="button" class="btn" data-a="next">Next ›</button><span class="stat" aria-live="polite"></span>`;
  const note = document.createElement("div"); note.className = "stepnote"; note.setAttribute("aria-live", "polite");
  host.append(row, note);
  const play = $("[data-a=play]", row), stat = $(".stat", row);
  let i = 0, timer = null;
  const show = k => { i = Math.max(0, Math.min(n - 1, k)); note.innerHTML = draw(i) || ""; stat.textContent = `${i + 1} / ${n}`; };
  const stop = () => { clearInterval(timer); timer = null; play.textContent = "▶ Play"; };
  row.addEventListener("click", e => {
    const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
    if (a === "play") {
      if (timer) return stop();
      if (i >= n - 1) show(0);
      play.textContent = "❚❚ Pause";
      timer = setInterval(() => { if (i >= n - 1) { if (loop) show(0); else stop(); } else show(i + 1); }, auto);
    } else { stop(); show(i + (a === "next" ? 1 : -1)); }
  });
  show(0);
  return { show, stop };
}

const W = {};

/* ---------- hero: one spec, three browsers ---------- */
W.hero = host => {
  const B = [["Chromium", 46, "var(--browser)"], ["Firefox", 126, "var(--loc)"], ["WebKit", 206, "var(--runner)"]];
  host.innerHTML = `<svg class="svg" viewBox="0 0 420 260" role="img" aria-label="login.spec.ts runs in Chromium, Firefox and WebKit in parallel, each one passing">
  <rect x="10" y="70" width="150" height="120" rx="12" fill="var(--code-bg)" stroke="var(--runner)" stroke-width="2"/>
  <text x="24" y="94" class="t-m" fill="#ffcf6b">login.spec.ts</text>
  ${[0, 1, 2, 3, 4].map(k => `<rect x="24" y="${108 + k * 15}" width="${[110, 84, 120, 70, 96][k]}" height="6" rx="3" fill="${k === 2 ? "#ff8fb1" : "#3a4566"}"/>`).join("")}
  ${B.map(([name, y, c], k) => `
    <path id="hp${k}" d="M160 130 C 210 130, 210 ${y + 24}, 262 ${y + 24}" fill="none" stroke="${c}" stroke-width="2" class="dash" opacity=".7"/>
    <circle r="6" fill="${c}">${REDUCED ? "" : `<animateMotion dur="2.4s" begin="${-k * .35}s" repeatCount="indefinite"><mpath href="#hp${k}"/></animateMotion>`}</circle>
    <rect x="262" y="${y}" width="148" height="48" rx="10" fill="var(--surface)" stroke="${c}" stroke-width="2"/>
    <circle cx="284" cy="${y + 24}" r="9" fill="none" stroke="${c}" stroke-width="2.5"/>
    <text x="302" y="${y + 29}" class="t-b" fill="var(--ink)">${name}</text>
    <g opacity="${REDUCED ? 1 : 0}"><circle cx="390" cy="${y + 24}" r="10" fill="var(--assert)"/><path d="M385 ${y + 24} l4 4 l7 -8" stroke="#fff" stroke-width="2.5" fill="none"/>
      ${REDUCED ? "" : `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.55;.9;1" dur="2.4s" begin="${-k * .35}s" repeatCount="indefinite"/>`}</g>`).join("")}
  <text x="85" y="216" text-anchor="middle" class="t-s">npx playwright test</text>
  <text x="336" y="26" text-anchor="middle" class="t-s">3 projects · in parallel</text>
  </svg>`;
};

/* ---------- 2. hook order ---------- */
W.lifecycle = host => {
  const S = [
    ["beforeAll", "var(--cfg)", "<b>beforeAll</b> runs once, before the first test in the group (once per worker)."],
    ["beforeEach", "var(--cfg)", "<b>beforeEach</b> runs before every test. Playwright has already created a fresh <code>context</code> and <code>page</code> fixture for it."],
    ["test: valid login", "var(--runner)", "<b>Test 1</b> runs with its own isolated page."],
    ["afterEach", "var(--cfg)", "<b>afterEach</b> runs after test 1, pass or fail. Then the page and context are closed."],
    ["beforeEach", "var(--cfg)", "<b>beforeEach</b> again, for the second test, with a brand-new page: no cookies or state from test 1."],
    ["test: invalid login", "var(--runner)", "<b>Test 2</b> runs."],
    ["afterEach", "var(--cfg)", "<b>afterEach</b> after test 2."],
    ["afterAll", "var(--cfg)", "<b>afterAll</b> runs once, after the last test in the group."]
  ];
  const lc = document.createElement("div"); lc.className = "lc";
  lc.innerHTML = S.map(([t, c], k) => `<span style="--c:${c}">${k ? "<em aria-hidden=\"true\">→</em>" : ""}${t}</span>`).join("");
  host.append(lc);
  const items = $$("span", lc);
  stepper(host, S.length, i => { items.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("done", k < i); }); return S[i][2]; }, { auto: 1400 });
};

/* ---------- 4. config explorer ---------- */
W.config = host => {
  const L = [
    ["import { defineConfig, devices } from '@playwright/test';"], [""],
    ["export default defineConfig({"],
    ["  testDir: './tests',", "testDir"],
    ["  timeout: 30 * 1000,", "timeout"],
    ["  expect: { timeout: 5000 },", "expect"],
    ["  fullyParallel: true,", "fullyParallel"],
    ["  forbidOnly: !!process.env.CI,", "forbidOnly"],
    ["  retries: process.env.CI ? 2 : 0,", "retries"],
    ["  workers: process.env.CI ? 2 : undefined,", "workers"],
    ["  reporter: [['html', { open: 'never' }], ['list']],", "reporter"],
    ["  use: {", "use"],
    ["    baseURL: 'https://example.com',", "baseURL"],
    ["    headless: true,", "headless"],
    ["    viewport: { width: 1280, height: 720 },", "viewport"],
    ["    ignoreHTTPSErrors: true,", "ignoreHTTPSErrors"],
    ["    trace: 'on-first-retry',", "trace"],
    ["    screenshot: 'only-on-failure',", "screenshot"],
    ["    video: 'retain-on-failure',", "video"],
    ["    storageState: 'playwright/.auth/user.json',", "storageState"],
    ["  },", "use"],
    ["  projects: [", "projects"],
    ["    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },", "projects"],
    ["    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },", "projects"],
    ["    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },", "projects"],
    ["  ],", "projects"],
    ["  webServer: {", "webServer"],
    ["    command: 'npm run start',", "webServer"],
    ["    url: 'http://localhost:3000',", "webServer"],
    ["    reuseExistingServer: !process.env.CI,", "webServer"],
    ["  },", "webServer"],
    ["});"]
  ];
  const N = {
    testDir: ["testDir", "The folder Playwright searches for test files (<code>*.spec.ts</code>, <code>*.test.ts</code>)."],
    timeout: ["timeout", "Maximum time for one test, including its hooks and fixtures. Default 30 s. Exceeding it fails the test."],
    expect: ["expect.timeout", "How long web-first assertions like <code>toBeVisible()</code> keep retrying. Default 5 s."],
    fullyParallel: ["fullyParallel", "Run individual tests in parallel, not just files. Fastest, but tests must not depend on each other."],
    forbidOnly: ["forbidOnly", "Fail the run if a <code>test.only</code> was committed by mistake. <code>!!process.env.CI</code> turns it on only in CI."],
    retries: ["retries", "Re-run failed tests. Here 2 retries on CI and none locally, so flakes stay visible while you work.", ["0", "2 on CI"]],
    workers: ["workers", "Parallel worker processes. <code>undefined</code> means the default: half your CPU cores. CI machines are small, so 2 there."],
    reporter: ["reporter", "How results are reported: several at once is fine. <code>open: 'never'</code> stops the HTML report popping open.", ["list", "dot", "line", "html", "json", "junit", "blob"]],
    use: ["use", "Options for every test's browser context: shared by all projects, overridable per project. Everything inside goes to the <code>page</code> and <code>context</code> fixtures."],
    baseURL: ["baseURL", "Lets tests write <code>page.goto('/login')</code> instead of the full URL. Change environments in one place."],
    headless: ["headless", "Run without a visible window. The default is <code>true</code>; <code>--headed</code> overrides it for one run."],
    viewport: ["viewport", "Window size for each page. Device presets like <code>devices['iPhone 15']</code> set it for you."],
    ignoreHTTPSErrors: ["ignoreHTTPSErrors", "Accept invalid or self-signed certificates, handy for local and staging servers."],
    trace: ["trace", "When to record a trace for the trace viewer.", ["off", "on", "retain-on-failure", "on-first-retry", "on-all-retries"]],
    screenshot: ["screenshot", "Take a screenshot automatically at the end of a test.", ["off", "on", "only-on-failure"]],
    video: ["video", "Record a video of each test.", ["off", "on", "retain-on-failure", "on-first-retry"]],
    storageState: ["storageState", "Start every context with these cookies and local storage, e.g. already logged in. See step 6."],
    projects: ["projects", "One entry per browser or configuration. Every test runs once in each project. See steps 5 and 6."],
    webServer: ["webServer", "Start your app before the tests and wait for the URL to respond. <code>reuseExistingServer</code> uses one you already have running locally."]
  };
  host.innerHTML = `<div class="cfgx"><pre class="code">${L.map(([t, k]) => k ? `<span data-k="${k}" tabindex="0" role="button">${hl(t)}</span>` : hl(t)).join("\n")}</pre><div class="cfg-note" aria-live="polite"></div></div>`;
  const note = $(".cfg-note", host);
  const pick = k => {
    $$("[data-k]", host).forEach(s => s.classList.toggle("on", s.dataset.k === k));
    const [t, d, o] = N[k];
    note.innerHTML = `<b>${t}</b>${d}${o ? `<div class="opts">${o.map(x => `<code>${x}</code>`).join("")}</div>` : ""}`;
  };
  host.addEventListener("click", e => { const s = e.target.closest("[data-k]"); if (s) pick(s.dataset.k); });
  host.addEventListener("keydown", e => { const s = e.target.closest("[data-k]"); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(s.dataset.k); } });
  pick("timeout");
};

/* ---------- 5. browser picker ---------- */
W.browsers = host => {
  const B = {
    Chromium: ["ok", "Bundled", "CDP", "Playwright's own Chromium build, downloaded by <code>npx playwright install</code>. The default, fast and identical everywhere.", "{ name: 'chromium',\n  use: { ...devices['Desktop Chrome'] } }"],
    Chrome: ["ok", "Your installed Chrome", "CDP", "Chrome speaks the Chrome DevTools Protocol natively, so Playwright drives the copy you already have.", "{ name: 'chrome',\n  use: { ...devices['Desktop Chrome'], channel: 'chrome' } }"],
    Edge: ["ok", "Your installed Edge", "CDP", "Edge is Chromium-based: same protocol, same story as Chrome.", "{ name: 'edge',\n  use: { ...devices['Desktop Edge'], channel: 'msedge' } }"],
    Firefox: ["part", "Patched Firefox only", "patched protocol", "Stock Firefox lacks APIs Playwright needs, so Playwright ships its own patched Firefox. Your installed Firefox is never used, and there is no <code>channel: 'firefox'</code>.", "{ name: 'firefox',\n  use: { ...devices['Desktop Firefox'] } }"],
    WebKit: ["part", "Patched WebKit", "patched protocol", "WebKit is Safari's open-source engine. Playwright ships a patched build: close to Safari's rendering and JS, but not Safari.", "{ name: 'webkit',\n  use: { ...devices['Desktop Safari'] } }   // WebKit, not Safari.app"],
    Safari: ["no", "Not possible", "no protocol", "Safari is closed source and offers no protocol Playwright can use. Use WebKit as a proxy, or Selenium + SafariDriver / a cloud grid for real Safari.", "// there is no Safari option\n// closest: { name: 'webkit', use: { ...devices['Desktop Safari'] } }"],
    "Opera / Brave": ["part", "Your installed copy", "CDP", "Chromium-based, so they usually work through <code>executablePath</code>, but Playwright doesn't officially support them. If the path is wrong, the browser won't launch.", "{ name: 'brave',\n  use: { browserName: 'chromium',\n    launchOptions: { executablePath:\n      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' } } }"]
  };
  const V = { ok: "Supported", part: "Supported, with a catch", no: "Not supported" };
  host.innerHTML = `<div class="bpick" role="group" aria-label="Browser">${Object.keys(B).map(k => `<button type="button" aria-pressed="false">${k}</button>`).join("")}</div>
    <div class="two"><div class="svg-wrap"></div><div><p class="bv" style="margin:0"></p><pre class="code bcode"></pre></div></div>`;
  const show = k => {
    const [v, what, proto, why, code] = B[k];
    $$(".bpick button", host).forEach(b => b.setAttribute("aria-pressed", b.textContent === k));
    const col = v === "ok" ? "var(--assert)" : v === "part" ? "var(--cfg)" : "var(--bad)";
    $(".svg-wrap", host).innerHTML = `<svg class="svg" viewBox="0 0 360 200" role="img" aria-label="Playwright to ${k}: ${what}">
      <rect x="10" y="70" width="110" height="60" rx="10" fill="var(--surface)" stroke="var(--runner)" stroke-width="2"/><text x="65" y="105" text-anchor="middle" class="t-b" fill="var(--ink)">Playwright</text>
      <path d="M120 100 H 236" stroke="${col}" stroke-width="3" ${v === "no" ? 'stroke-dasharray="4 6"' : 'class="dash"'} fill="none"/>
      <text x="178" y="88" text-anchor="middle" class="t-m" fill="var(--muted)">${proto}</text>
      ${v === "no" ? `<text x="178" y="122" text-anchor="middle" font-size="22" fill="var(--bad)">✕</text>` : ""}
      <rect x="236" y="60" width="114" height="80" rx="10" fill="var(--surface)" stroke="${col}" stroke-width="2"/>
      <text x="293" y="96" text-anchor="middle" class="t-b" fill="var(--ink)">${k}</text>
      <text x="293" y="118" text-anchor="middle" class="t-s" font-size="12">${what}</text></svg>`;
    $(".bv", host).innerHTML = `<span class="verdict ${v}">${V[v]}</span> ${why}`;
    $(".bcode", host).innerHTML = hl(code);
  };
  host.addEventListener("click", e => { const b = e.target.closest(".bpick button"); if (b) show(b.textContent); });
  show("Chrome");
};

/* ---------- 6. auth setup flow ---------- */
W.auth = host => {
  host.insertAdjacentHTML("beforeend", `<div class="svg-scroll"><svg class="svg" viewBox="0 0 720 230" role="img" aria-label="The setup project logs in once, saves auth.json, and three browser projects start from it">
    <g class="a0"><rect x="10" y="80" width="150" height="70" rx="12" fill="var(--surface)" stroke="var(--cfg)" stroke-width="2.5"/><text x="85" y="110" text-anchor="middle" class="t-h" fill="var(--ink)">setup</text><text x="85" y="132" text-anchor="middle" class="t-m" fill="var(--muted)">auth.setup.ts</text></g>
    <path class="a1" d="M160 115 H 262" stroke="var(--cfg)" stroke-width="3" fill="none"/>
    <g class="a1"><path d="M262 82 h56 l18 18 v52 h-74 z" fill="var(--surface)" stroke="var(--cfg)" stroke-width="2.5"/><text x="299" y="128" text-anchor="middle" class="t-m" fill="var(--ink)">user.json</text><text x="299" y="172" text-anchor="middle" class="t-s" font-size="12">cookies + storage</text></g>
    ${["chromium", "firefox", "webkit"].map((p, k) => `<path class="a2" d="M336 115 C 420 115, 420 ${40 + k * 75}, 500 ${40 + k * 75}" stroke="var(--browser)" stroke-width="2.5" fill="none"/>
      <g class="a2"><rect x="500" y="${14 + k * 75}" width="200" height="52" rx="10" fill="var(--surface)" stroke="var(--browser)" stroke-width="2"/><text x="520" y="${45 + k * 75}" class="t-b" fill="var(--ink)">${p}</text>
      <g class="a3"><circle cx="676" cy="${40 + k * 75}" r="10" fill="var(--assert)"/><path d="M671 ${40 + k * 75} l4 4 l7 -8" stroke="#fff" stroke-width="2.5" fill="none"/></g></g>`).join("")}
  </svg></div>`);
  const notes = [
    "<b>1 · setup runs first.</b> Because every browser project lists <code>dependencies: ['setup']</code>, Playwright runs the setup project before anything else.",
    "<b>2 · Log in once and save.</b> The setup test logs in through the UI, then <code>page.context().storageState({ path })</code> writes cookies and local storage to <code>user.json</code>.",
    "<b>3 · Every project loads it.</b> Each browser project has <code>use: { storageState: 'playwright/.auth/user.json' }</code>, so each new context starts from that saved state.",
    "<b>4 · Tests start logged in.</b> No login steps in any test: faster runs, and a login bug fails one setup test instead of hundreds."
  ];
  stepper(host, 4, i => { for (let k = 0; k < 4; k++) $$(".a" + k, host).forEach(g => { g.style.opacity = k <= i ? 1 : .15; g.style.transition = "opacity .4s"; }); return notes[i]; }, { auto: 2000 });
};

/* ---------- 7. parallel run simulator ---------- */
W.lanes = host => {
  const FILES = [["login", [3, 2, 3]], ["cart", [4, 2]], ["search", [2, 5, 2, 1]], ["profile", [3]]];   // durations in seconds
  const FLAKY = "search·2";                // fails on its first attempt, passes on retry
  const COL = ["var(--runner)", "var(--browser)", "var(--loc)", "var(--tool)"];
  host.innerHTML = `<div class="wrow">
      <label>Workers <input type="range" min="1" max="4" value="2" data-o="w"> <b data-v="w">2</b></label>
      <label><input type="checkbox" data-o="fp"> fullyParallel</label>
      <label>Retries <select data-o="r"><option>0</option><option selected>1</option><option>2</option></select></label>
      <button type="button" class="btn pri" data-o="run">▶ Run</button>
    </div><div class="lanes"></div><div class="stepnote" aria-live="polite"></div>`;
  const lanes = $(".lanes", host), note = $(".stepnote", host);
  let runId = 0;
  function plan(workers, fp, retries) {
    // units: whole files, or single tests when fullyParallel; each worker takes the next unit when it is free
    const units = [];
    FILES.forEach(([f, ts], fi) => {
      const tests = ts.map((d, k) => ({ id: `${f}·${k + 1}`, d, fi }));
      if (fp) tests.forEach(t => units.push([t])); else units.push(tests);
    });
    const free = Array(workers).fill(0), jobs = [];
    let flakyTries = 0, failed = 0, flaky = 0;
    const queue = units.map(u => u.map(t => ({ ...t, attempt: 0 })));
    while (queue.length) {
      const u = queue.shift();
      const w = free.indexOf(Math.min(...free));
      let t0 = free[w];
      for (const t of u) {
        const fail = t.id === FLAKY && flakyTries++ === 0;
        jobs.push({ ...t, w, t0, fail });
        t0 += t.d;
        if (fail) {
          if (retries > 0) { queue.push([{ ...t, attempt: 1 }]); flaky++; } else failed++;
        }
      }
      free[w] = t0;
    }
    return { jobs, total: Math.max(...free), failed, flaky, workers };
  }
  async function run() {
    const id = ++runId;
    const workers = +$("[data-o=w]", host).value, fp = $("[data-o=fp]", host).checked, retries = +$("[data-o=r]", host).value;
    const { jobs, total, failed, flaky } = plan(workers, fp, retries);
    const span = 34;    // seconds shown across the full width (fits the slowest setup), so runs are comparable
    lanes.innerHTML = Array.from({ length: workers }, (_, w) => `<div class="lane"><span>worker ${w + 1}</span><div class="track" data-w="${w}"><i class="clock" style="left:0"></i></div></div>`).join("");
    jobs.forEach(j => {
      const el = document.createElement("div");
      el.className = "job" + (j.fail ? " fail" : "") + (j.attempt ? " retry" : "");
      el.style.cssText = `left:${j.t0 / span * 100}%;width:calc(${j.d / span * 100}% - 2px);background:${COL[j.fi]};transform:scaleX(0)`;
      el.textContent = j.id + (j.attempt ? " ↻" : "");
      el.title = `${j.id}${j.attempt ? " (retry)" : ""}: ${j.d}s${j.fail ? ", failed" : ""}`;
      $(`.track[data-w="${j.w}"]`, lanes).append(el);
      j.el = el;
    });
    note.innerHTML = "Running…";
    const stepMs = REDUCED ? 0 : 140;
    for (let t = 0; t <= Math.ceil(total * 2); t++) {
      if (id !== runId) return;
      const now = t / 2;
      $$(".clock", lanes).forEach(c => c.style.left = `${Math.min(now, span) / span * 100}%`);
      jobs.forEach(j => { j.el.style.transform = `scaleX(${Math.max(0, Math.min(1, (now - j.t0) / j.d))})`; });
      if (stepMs) await sleep(stepMs);
    }
    const res = failed ? `<b style="color:var(--bad)">${failed} failed</b>` : flaky ? `<b style="color:var(--cfg)">passed, 1 flaky</b>` : `<b style="color:var(--assert)">all passed</b>`;
    note.innerHTML = `Finished in <b>${total}s</b> with ${workers} worker${workers > 1 ? "s" : ""}${fp ? ", fully parallel" : ", one file per worker at a time"} · ${res}. ` +
      (failed ? "<code>search·2</code> failed once and there were no retries left." : flaky ? "<code>search·2</code> failed, then passed on retry (striped, then ↻), so it's reported as <b>flaky</b>." : "") +
      (!fp ? " Try <b>fullyParallel</b>: the 10-second <code>search</code> file stops holding one worker." : "");
  }
  host.addEventListener("input", e => { if (e.target.dataset.o === "w") $("[data-v=w]", host).textContent = e.target.value; });
  host.addEventListener("change", run);
  $("[data-o=run]", host).addEventListener("click", run);
  run();
};

/* ---------- 8. auto-wait inside click() ---------- */
W.autowait = host => {
  const CHECKS = ["Attached", "Visible", "Stable", "Enabled", "Receives events"];
  const S = [
    [0, "Page still loading", "", "<b>Resolve the locator.</b> <code>getByRole('button', { name: 'Buy' })</code> matches nothing yet, so Playwright keeps polling instead of failing."],
    [1, "Buy", "hidden", "<b>Attached</b> ✓: the button is in the DOM, but still <code>display: none</code>. Wait for <b>visible</b>."],
    [2, "Buy", "moving", "<b>Visible</b> ✓: it's sliding in with a CSS animation. Wait until it is <b>stable</b> (same box for two frames)."],
    [3, "Buy", "disabled", "<b>Stable</b> ✓: but it's <code>disabled</code> while prices load. Wait for <b>enabled</b>."],
    [4, "Buy", "covered", "<b>Enabled</b> ✓: a cookie banner covers it. Wait until it <b>receives events</b> at its click point."],
    [5, "Buy", "ok", "<b>All five checks pass</b> → Playwright scrolls it into view and clicks. No <code>sleep()</code> needed, and if it never gets there you get a clear timeout error naming the failed check."]
  ];
  host.insertAdjacentHTML("beforeend", `<div class="two"><svg class="svg" viewBox="0 0 320 170" role="img" aria-label="A Buy button going from missing to clickable">
    <rect x="10" y="10" width="300" height="150" rx="12" fill="var(--bg)" stroke="var(--line)"/>
    <g class="aw-load"><rect x="40" y="40" width="240" height="10" rx="5" fill="var(--soft)"/><rect x="40" y="60" width="180" height="10" rx="5" fill="var(--soft)"/></g>
    <g class="aw-btn"><rect x="105" y="92" width="110" height="42" rx="9" fill="var(--runner)"/><text x="160" y="119" text-anchor="middle" class="t-b" fill="#fff">Buy</text></g>
    <g class="aw-cover"><rect x="20" y="100" width="280" height="44" rx="8" fill="var(--cfg)" opacity=".9"/><text x="160" y="127" text-anchor="middle" class="t-b" fill="#fff">🍪 Accept cookies</text></g>
    <g class="aw-cursor"><path d="M0 0 L0 18 L5 13 L9 22 L12 21 L8 12 L15 12 Z" fill="var(--ink)" stroke="var(--surface)"/></g>
  </svg><ul class="aw-checks" style="list-style:none;padding:0;margin:0;display:grid;gap:6px">${CHECKS.map(c => `<li class="card" style="padding:6px 12px">${c}</li>`).join("")}</ul></div>`);
  const btn = $(".aw-btn", host), cover = $(".aw-cover", host), cur = $(".aw-cursor", host), lis = $$(".aw-checks li", host);
  stepper(host, S.length, i => {
    const [passed, , state, txt] = S[i];
    btn.style.transition = REDUCED ? "" : "transform .6s, opacity .4s";
    btn.style.opacity = i === 0 || state === "hidden" ? 0 : state === "disabled" ? .4 : 1;
    btn.style.transform = state === "moving" ? "translateX(-60px)" : "none";
    cover.style.opacity = state === "covered" ? 1 : 0;
    cur.setAttribute("transform", state === "ok" ? "translate(170 112)" : "translate(260 150)");
    lis.forEach((li, k) => { li.className = "card" + (k < passed ? " good" : k === passed && i < 5 ? " bad" : ""); li.textContent = (k < passed ? "✓ " : k === passed && i < 5 ? "… " : "") + CHECKS[k]; });
    return txt;
  }, { auto: 1900 });
};

/* ---------- 9. lazy, retrying locator vs one-shot lookup ---------- */
W.lazy = host => {
  host.innerHTML = `<svg class="svg" viewBox="0 0 720 210" role="img" aria-label="The element appears at 800 milliseconds. A one-shot lookup at 0 ms fails; a Playwright locator retries and clicks at about 1 second">
    <text x="10" y="20" class="t-s">time →</text>
    ${[0, 500, 1000, 1500, 2000].map(ms => `<text x="${150 + ms * .27}" y="20" text-anchor="middle" class="t-m" fill="var(--muted)">${ms}ms</text><line x1="${150 + ms * .27}" y1="28" x2="${150 + ms * .27}" y2="196" stroke="var(--line)"/>`).join("")}
    <rect x="${150 + 800 * .27}" y="30" width="${1200 * .27}" height="164" fill="var(--assert)" opacity=".08"/>
    <text x="${150 + 800 * .27 + 6}" y="190" class="t-s" font-size="12">button exists from 800ms</text>
    <text x="10" y="76" class="t-b" fill="var(--ink)">One-shot lookup</text><text x="10" y="94" class="t-s" font-size="12">findElement() style</text>
    <g class="lz-a"><circle cx="150" cy="80" r="9" fill="var(--bad)"/><text x="166" y="85" class="t-m" fill="var(--bad)">NoSuchElement ✕ test fails</text></g>
    <text x="10" y="146" class="t-b" fill="var(--ink)">Playwright locator</text><text x="10" y="164" class="t-s" font-size="12">await locator.click()</text>
    <g class="lz-b">${[0, 100, 250, 500, 1000].map((ms, k) => `<circle class="lz-p" data-k="${k}" cx="${150 + ms * .27}" cy="150" r="8" fill="${ms >= 800 ? "var(--assert)" : "var(--muted)"}" opacity="0"/>`).join("")}
      <text class="lz-ok t-m" x="${150 + 1000 * .27 + 16}" y="155" fill="var(--assert)" opacity="0">found → click ✓</text></g>
  </svg>`;
  const wrap = document.createElement("div"); host.append(wrap);
  stepper(wrap, 3, i => {
    $(".lz-a", host).style.opacity = i >= 1 ? 1 : 0;
    $$(".lz-p", host).forEach(p => { p.style.transition = "opacity .3s"; p.style.transitionDelay = i === 2 ? `${p.dataset.k * .25}s` : "0s"; p.style.opacity = i === 2 ? 1 : 0; });
    const ok = $(".lz-ok", host); ok.style.transition = "opacity .3s"; ok.style.transitionDelay = i === 2 ? "1.3s" : "0s"; ok.style.opacity = i === 2 ? 1 : 0;
    return ["The button is rendered by JavaScript 800 ms after the page loads.",
      "A one-shot lookup checks <b>once</b>, at 0 ms. The button isn't there yet, so it throws, and people add <code>sleep(2000)</code> to “fix” it.",
      "A Playwright locator <b>re-checks</b> (0, 100, 250, 500, 1000 ms…) until the element is ready, then acts. Fast when the page is fast, patient when it's slow."][i];
  }, { auto: 2400 });
};

/* ---------- 11. locator playground ---------- */
W.playground = host => {
  const R = (n, c) => ({ n, c });
  const LV = { 1: R("Role", "var(--assert)"), 2: R("Label", "var(--assert)"), 3: R("Text", "color-mix(in srgb, var(--assert) 60%, var(--cfg))"), 4: R("Test id", "var(--cfg)"), 5: R("CSS", "var(--loc)"), 6: R("XPath", "var(--bad)") };
  const P = {
    heading: [[1, "page.getByRole('heading', { name: 'Sign in' })", "best"], [3, "page.getByText('Sign in')", "ok"], [5, "page.locator('h4')", "too generic"], [6, "page.locator('//h4')", "avoid"]],
    email: [[1, "page.getByRole('textbox', { name: 'Email' })", "best"], [2, "page.getByLabel('Email')", "great for forms"], [3, "page.getByPlaceholder('Enter email')", "ok"], [4, "page.getByTestId('email-input')", "stable"], [5, "page.locator('#email')", "fine"], [6, "page.locator('//input[@id=\"email\"]')", "last resort"]],
    password: [[1, "page.getByRole('textbox', { name: 'Password' })", "best"], [2, "page.getByLabel('Password')", "great for forms"], [3, "page.getByPlaceholder('Enter password')", "ok"], [5, "page.locator('#password')", "fine"], [6, "page.locator('//input[@type=\"password\"]')", "last resort"]],
    remember: [[1, "page.getByRole('checkbox', { name: 'Remember me' })", "best"], [2, "page.getByLabel('Remember me')", "great"], [5, "page.locator('#remember')", "fine"]],
    login: [[1, "page.getByRole('button', { name: 'Login' })", "best"], [3, "page.getByText('Login', { exact: true })", "ok"], [5, "page.locator('button.primary')", "brittle if styling changes"], [6, "page.locator('//button[text()=\"Login\"]')", "last resort"]],
    cancel: [[1, "page.getByRole('button', { name: 'Cancel' })", "best"], [3, "page.getByText('Cancel')", "ok"], [5, "page.locator('button:nth-child(2)')", "position: breaks easily"]],
    forgot: [[1, "page.getByRole('link', { name: 'Forgot Password?' })", "best"], [3, "page.getByText('Forgot')", "substring match"], [5, "page.locator('a[href=\"/forgot\"]')", "fine"], [6, "page.locator('//a[contains(text(), \"Forgot\")]')", "last resort"]],
    help: [[3, "page.getByText('Need help?')", "best: a <p> has no role"], [3, "page.getByTitle('Help text')", "by title"], [5, "page.locator('p', { hasText: 'Need help' })", "fine"]],
    logo: [[1, "page.getByRole('img', { name: 'Company logo' })", "best"], [3, "page.getByAltText('Company logo')", "great"], [5, "page.locator('img[alt=\"Company logo\"]')", "fine"]]
  };
  host.innerHTML = `<div class="play"><div class="mock" id="pgForm">
      <h4 data-pick="heading"><span data-pick="logo" role="img" aria-label="Company logo" title="Company logo">🎭</span> Sign in</h4>
      <div class="f"><label for="pg-email">Email</label><input type="email" id="pg-email" placeholder="Enter email" data-pick="email" autocomplete="off"></div>
      <div class="f"><label for="pg-pass">Password</label><input type="password" id="pg-pass" placeholder="Enter password" data-pick="password" autocomplete="off"></div>
      <label data-pick="remember" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" tabindex="-1"> Remember me</label>
      <div class="row"><button type="button" class="mbtn primary" data-pick="login">Login</button><button type="button" class="mbtn" data-pick="cancel">Cancel</button><a href="#playground" data-pick="forgot">Forgot Password?</a></div>
      <p class="help" title="Help text" data-pick="help">Need help? Contact support</p>
    </div><div><div class="ranks" aria-live="polite"></div>
      <div class="wrow"><button type="button" class="btn" data-strict>Try <code>getByRole('button')</code> .click()</button></div></div></div>`;
  const ranks = $(".ranks", host);
  const pick = k => {
    $$("[data-pick]", host).forEach(e => e.classList.toggle("picked", e.dataset.pick === k));
    ranks.innerHTML = P[k].map(([lv, code, why]) => `<div class="rank" style="--c:${LV[lv].c}"><i>${lv}</i><code>${hl(code)}</code><small>${LV[lv].n}<br>${esc(why)}</small></div>`).join("");
  };
  host.addEventListener("click", e => {
    if (e.target.closest("[data-strict]")) {
      $$("[data-pick]", host).forEach(x => x.classList.toggle("picked", x.dataset.pick === "login" || x.dataset.pick === "cancel"));
      ranks.innerHTML = `<div class="card bad"><b>Error: strict mode violation</b><p style="margin:.3em 0 0"><code>getByRole('button')</code> resolved to <b>2 elements</b>: Login and Cancel. Playwright refuses to guess.</p>
        <p style="margin:.4em 0 0">Fix it by being specific: <code>getByRole('button', { name: 'Login' })</code>. Use <code>.first()</code> or <code>.nth()</code> only when order really is what you mean.</p></div>`;
      return;
    }
    const t = e.target.closest("[data-pick]"); if (!t) return;
    if (t.tagName === "A") e.preventDefault();
    pick(t.dataset.pick);
  });
  host.addEventListener("focusin", e => { const t = e.target.closest("[data-pick]"); if (t) pick(t.dataset.pick); });
  pick("email");
};

/* ---------- 14. flaky banner story ---------- */
W.flaky = host => {
  host.innerHTML = `<div class="dom"><div><small class="t-m" style="color:var(--muted)">&lt;div class="container"&gt;</small><div class="page-mock" aria-label="Mock checkout page"></div>
      <div class="wrow"><button type="button" class="btn pri" data-f="ship">Ship Friday's release (adds a promo banner)</button><button type="button" class="btn" data-f="reset">Reset to Monday</button></div></div>
    <div class="res" aria-live="polite"></div></div>`;
  const pm = $(".page-mock", host), res = $(".res", host);
  let banner = false;
  const render = () => {
    const kids = [...(banner ? [["banner enter", "🎉 Black Friday: 30% off everything!"]] : []), ["", "Header · Logo · Search"], ["", "Cart: 3 items · $120"], ["", `Order summary <button type="button" class="mbtn primary" style="margin-left:8px;padding:2px 10px;font:inherit;font-weight:700;border-radius:6px;border:0;background:var(--runner);color:#fff">Checkout</button>`]];
    pm.innerHTML = kids.map(([c, t], k) => `<div class="${c}" data-n="${k + 1}"><small style="color:var(--muted);font-family:var(--font-mono)">:nth-child(${k + 1})</small> ${t}</div>`).join("");
    const third = $(`[data-n="3"]`, pm), real = [...pm.children].find(d => d.querySelector?.("button"));
    const cssOk = !banner;
    third.classList.add(cssOk ? "hit-good" : "hit-bad");
    if (!cssOk) real.classList.add("hit-good");
    res.innerHTML = `<div class="card ${cssOk ? "good" : "bad"}"><b>${cssOk ? "✓ Passed in CI" : "✕ FAILED: locator resolved to 0 elements"}</b>
        <pre class="code" style="margin:6px 0 0">${hl("await page.locator('div.container > div:nth-child(3) > button').click();")}</pre>
        <p style="margin:.4em 0 0">${cssOk ? "Child 3 is the order summary, which holds the button." : "The banner pushed everything down: child 3 is now the cart line, which has no button."}</p></div>
      <div class="card good"><b>✓ Passed, both days</b>
        <pre class="code" style="margin:6px 0 0">${hl("await page.getByRole('button', { name: 'Checkout' }).click();")}</pre>
        <p style="margin:.4em 0 0">It asks for what the user sees, a button called Checkout, wherever it sits.</p></div>`;
  };
  host.addEventListener("click", e => { const f = e.target.closest("[data-f]")?.dataset.f; if (!f) return; banner = f === "ship"; render(); });
  render();
};

/* ---------- 15. decision flow ---------- */
W.flow = host => {
  const Q = [
    ["Is there a unique, user-visible role and accessible name (or label)?", "Use <code>getByRole()</code> or <code>getByLabel()</code>", "var(--assert)"],
    ["Is there unique visible text or a placeholder?", "Use <code>getByText()</code> or <code>getByPlaceholder()</code>", "var(--assert)"],
    ["Can a developer add a unique <code>data-testid</code>?", "Use <code>getByTestId()</code>", "var(--cfg)"],
    ["Is there a stable, meaningful id or attribute?", "Use <code>page.locator('#id')</code>", "var(--loc)"]
  ];
  const draw = (k, out) => {
    host.innerHTML = `<div class="fc">${Q.map(([q], i) => i > k ? "" : `<div class="fc-q ${i === k && out == null ? "on" : "done"}"><p>${i + 1}. ${q}</p>${i === k && out == null ? `<span class="seg"><button type="button" data-y="${i}" aria-pressed="false">Yes</button><button type="button" data-n="${i}" aria-pressed="false">No</button></span>` : `<small class="note">${i < k || out === "no" ? "No" : "Yes"}</small>`}</div>`).join("")}
      ${out === "yes" ? `<div class="fc-out" style="--c:${Q[k][2]}">✓ ${Q[k][1]}</div>` : ""}
      ${out === "no" ? `<div class="fc-out" style="--c:var(--bad)">🚨 Only now consider a structural CSS or XPath locator, and leave a comment saying why.</div>` : ""}
      ${out != null || k ? `<button type="button" class="btn" data-reset>Start again</button>` : ""}</div>`;
  };
  host.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.reset != null) return draw(0);
    if (b.dataset.y != null) return draw(+b.dataset.y, "yes");
    if (b.dataset.n != null) { const i = +b.dataset.n; return i + 1 < Q.length ? draw(i + 1) : draw(i, "no"); }
  });
  draw(0);
};

/* ---------- 19. trace viewer mock ---------- */
W.trace = host => {
  const A = [
    ["goto", "/login", 0, "page.goto('/login')", { u: "", p: "", hit: "" }, "GET /login → 200 (38 ms)", ""],
    ["fill", "Email", 1, "page.getByLabel('Email').fill('admin@test.com')", { u: "admin@test.com", p: "", hit: "u" }, "–", ""],
    ["fill", "Password", 2, "page.getByLabel('Password').fill('pass123')", { u: "admin@test.com", p: "•••••••", hit: "p" }, "–", ""],
    ["click", "Login", 3, "page.getByRole('button', { name: 'Login' }).click()", { u: "admin@test.com", p: "•••••••", hit: "b", dot: 1 }, "POST /api/login → 401 Unauthorized (112 ms)", "error: Failed to load resource: 401"],
    ["expect", "toHaveURL", 4, "await expect(page).toHaveURL(/dashboard/)", { u: "admin@test.com", p: "•••••••", hit: "", err: 1 }, "–", "", true]
  ];
  host.innerHTML = `<div class="tv"><div class="tv-acts" role="listbox" aria-label="Actions">${A.map(([v, a], i) => `<button type="button" role="option" data-i="${i}" class="${A[i][7] ? "err" : ""}"><span>${v}</span>${a}</button>`).join("")}</div>
    <div class="tv-right"><div class="tv-tabs" role="tablist">${["Snapshot", "Source", "Network", "Console"].map((t, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-t="${t}">${t}</button>`).join("")}</div>
    <div class="tv-body" aria-live="polite"></div><div class="tv-time">${A.map(() => "<i></i>").join("")}</div></div></div>
    <div class="stepnote">The trace shows the real reason: the Login request returned <b>401</b>, so the URL never changed. Without a trace you'd only see “expected URL to match /dashboard/”.</div>`;
  let cur = 0, tab = "Snapshot";
  const draw = () => {
    const [, , line, src, s, net, con, err] = A[cur];
    $$(".tv-acts button", host).forEach((b, i) => b.classList.toggle("on", i === cur));
    $$(".tv-time i", host).forEach((b, i) => b.classList.toggle("on", i <= cur));
    $$(".tv-tabs button", host).forEach(b => b.setAttribute("aria-selected", b.dataset.t === tab));
    const body = $(".tv-body", host);
    if (tab === "Snapshot") body.innerHTML = `<div class="snap"><b>Welcome back</b>
        <div class="in ${s.u ? "filled" : ""} ${s.hit === "u" ? "hit" : ""}">${s.u || "Email"}</div>
        <div class="in ${s.p ? "filled" : ""} ${s.hit === "p" ? "hit" : ""}">${s.p || "Password"}</div>
        <div class="sbtn red ${s.hit === "b" ? "hit" : ""}">Login${s.dot ? '<span class="dot" aria-label="click point"></span>' : ""}</div>
        ${s.err ? '<div style="color:var(--bad);font-size:.85rem">Invalid email or password</div>' : ""}</div>`;
    else if (tab === "Source") body.innerHTML = `<pre>${A.map((a, i) => `${String(10 + i).padStart(3)}  ${i === line ? "▶ " : "  "}${esc(a[3])}`).join("\n")}</pre>${err ? `<p style="color:var(--bad);margin:.6em 0 0;font-size:.85rem">Error: expect(page).toHaveURL(/dashboard/) failed. Received: "…/login"</p>` : ""}`;
    else if (tab === "Network") body.innerHTML = `<pre>${esc(net)}</pre>`;
    else body.innerHTML = `<pre>${con ? esc(con) : "(no messages)"}</pre>`;
  };
  host.addEventListener("click", e => {
    const a = e.target.closest("[data-i]"); if (a) { cur = +a.dataset.i; draw(); }
    const t = e.target.closest("[data-t]"); if (t) { tab = t.dataset.t; draw(); }
  });
  draw();
};

/* ---------- 23. sharding ---------- */
W.shards = host => {
  host.innerHTML = `<div class="wrow"><button type="button" class="btn pri" data-s>▶ Run with --shard=1/3, 2/3, 3/3</button><span class="stat"></span></div>
    <div class="shards">${[1, 2, 3].map(k => `<div class="shard"><b>machine ${k} · shard ${k}/3</b><div class="chips"></div></div>`).join("")}</div>
    <div class="merge">merge-reports → one HTML report</div>`;
  let id = 0;
  $("[data-s]", host).addEventListener("click", async () => {
    const my = ++id, boxes = $$(".chips", host), merge = $(".merge", host);
    boxes.forEach(b => b.innerHTML = ""); merge.classList.remove("on");
    for (let t = 1; t <= 12; t++) {
      if (my !== id) return;
      const k = Math.floor((t - 1) / 4);
      boxes[k].insertAdjacentHTML("beforeend", `<span class="chip">test ${t}</span>`);
      $(".stat", host).textContent = `${t} / 12 assigned`;
      if (!REDUCED) await sleep(120);
    }
    for (let r = 0; r < 4; r++) {
      if (!REDUCED) await sleep(380);
      if (my !== id) return;
      boxes.forEach(b => b.children[r]?.classList.add("done"));
    }
    merge.classList.add("on"); merge.textContent = "✓ 3 blob reports → npx playwright merge-reports → one HTML report";
    $(".stat", host).textContent = "Each machine ran 4 tests at the same time, so the wall-clock time is about a third.";
  });
};

/* ---------- 24. CLI reference (from the CLI commands spreadsheet) ---------- */
W.cli = host => {
  const G = [
    ["Run tests", [
      ["npx playwright test", "Run all tests"],
      ["npx playwright test tests/login.spec.ts", "One file"],
      ["npx playwright test tests/login.spec.ts tests/home.spec.ts", "Several files"],
      ["npx playwright test tests/login.spec.ts:15", "The test at line 15"],
      ["npx playwright test tests/api/", "One folder"],
      ["npx playwright test -g \"should login successfully\"", "Tests whose title matches"],
      ["npx playwright test --last-failed", "Only the tests that failed last run"]]],
    ["Filter", [
      ["npx playwright test --grep \"@smoke\"", "Tests tagged @smoke"],
      ["npx playwright test --grep-invert \"@wip\"", "Everything except @wip"],
      ["npx playwright test --grep \"login|signup\"", "Regex: either word"],
      ["npx playwright test -g \"Login Page\"", "Tests in a describe block by its title"],
      ["npx playwright test --list", "List tests without running them"]]],
    ["Parallelism and control", [
      ["npx playwright test --workers=1", "Run one at a time"],
      ["npx playwright test --workers=4", "Four parallel workers"],
      ["npx playwright test --fully-parallel", "Parallelise tests inside files too"],
      ["npx playwright test --retries=2", "Retry failed tests twice"],
      ["npx playwright test --repeat-each=3", "Run every test 3 times (flake hunting)"],
      ["npx playwright test --timeout=60000", "Per-test timeout in ms"],
      ["npx playwright test --global-timeout=600000", "Limit for the whole run"],
      ["npx playwright test -x", "Stop at the first failure"],
      ["npx playwright test --max-failures=5", "Stop after 5 failures"],
      ["npx playwright test --forbid-only", "Fail if a test.only was left in"]]],
    ["Browsers and projects", [
      ["npx playwright test --project=chromium", "One project"],
      ["npx playwright test --project=chromium --project=firefox", "Several projects"],
      ["npx playwright test --config=playwright.dev.config.ts", "Use another config file"],
      ["npx playwright test --headed", "Show the browser windows"],
      ["npx playwright test --browser=webkit", "Pick a browser (only when no projects are defined)"]]],
    ["Debug and trace", [
      ["npx playwright test --debug", "Inspector, paused before the first action"],
      ["PWDEBUG=1 npx playwright test", "Same, via an environment variable"],
      ["npx playwright test --ui", "UI mode: explorer, watch mode, timeline"],
      ["npx playwright test --ui-port=8080", "UI mode on a fixed port (open it in a browser)"],
      ["npx playwright test --trace=on", "Record a trace for every test"],
      ["npx playwright test --trace=retain-on-failure", "Keep traces of failures only"],
      ["npx playwright test --trace=on-first-retry", "Trace only when retrying"],
      ["npx playwright show-trace trace.zip", "Open a trace"],
      ["DEBUG=pw:browser npx playwright test", "Log which browser binary launches"]]],
    ["Reports", [
      ["npx playwright test --reporter=html", "HTML report"],
      ["npx playwright test --reporter=list,html", "Several reporters"],
      ["npx playwright test --reporter=dot", "Minimal output"],
      ["npx playwright test --reporter=json", "JSON (to stdout, or set outputFile in config)"],
      ["npx playwright test --reporter=junit", "JUnit XML"],
      ["npx playwright test --output=test-results/", "Folder for screenshots, videos, traces"],
      ["npx playwright show-report", "Open the last HTML report"]]],
    ["Codegen", [
      ["npx playwright codegen https://demo.site.com", "Record a test"],
      ["npx playwright codegen --viewport-size=\"1280,720\" https://demo.site.com", "With a viewport size"],
      ["npx playwright codegen --device=\"iPhone 13\" https://demo.site.com", "Emulate a device"],
      ["npx playwright codegen --target=python https://demo.site.com", "Output another language"],
      ["npx playwright codegen -o tests/recorded.spec.ts https://demo.site.com", "Save to a file"],
      ["npx playwright codegen --save-storage=auth.json https://demo.site.com", "Save the logged-in state"],
      ["npx playwright codegen --load-storage=auth.json https://demo.site.com", "Start logged in"]]],
    ["Install browsers", [
      ["npx playwright install", "Install all browsers"],
      ["npx playwright install chromium", "One browser"],
      ["npx playwright install --with-deps", "Browsers plus system libraries (CI)"],
      ["npx playwright install-deps", "System libraries only (Linux)"],
      ["npx playwright install-deps chromium", "Libraries for one browser"]]],
    ["Environment variables", [
      ["BASE_URL=https://dev.site.com npx playwright test", "Your own variable, read with process.env.BASE_URL in the config"],
      ["CI=true npx playwright test", "Behave as on CI (retries, workers in typical configs)"],
      ["PLAYWRIGHT_BROWSERS_PATH=/ms-browsers npx playwright install", "Where browsers are stored"],
      ["PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install", "Skip the browser download"]]],
    ["Sharding, snapshots and CI", [
      ["npx playwright test --shard=1/3", "Run the first third (machine 1 of 3)"],
      ["npx playwright test --shard=2/3", "The second third"],
      ["npx playwright merge-reports --reporter=html ./all-blob-reports", "Merge blob reports from shards"],
      ["npx playwright test --update-snapshots", "Update visual comparison baselines"],
      ["npx playwright test --ignore-snapshots", "Skip screenshot comparisons"]]]
  ];
  host.innerHTML = `<input class="cli-find" type="search" placeholder="Filter commands…" aria-label="Filter commands"><div class="cli-count" aria-live="polite"></div>
    <div class="tbl"><table><thead><tr><th>Command</th><th>What it does</th></tr></thead><tbody>${G.map(([g, rows]) =>
      `<tr class="grp"><td colspan="2">${g}</td></tr>` + rows.map(([c, d]) => `<tr data-q="${esc((c + " " + d + " " + g).toLowerCase())}"><td><code>${esc(c)}</code></td><td>${esc(d)}</td></tr>`).join("")).join("")}</tbody></table></div>`;
  // one group at a time (tabs); typing searches every group
  $(".cli-count", host).insertAdjacentHTML("afterend", `<div class="bpick cli-tabs" role="group" aria-label="Command group">${G.map(([name], k) => `<button type="button" aria-pressed="${k === 0}" data-g="${k}">${name}</button>`).join("")}</div>`);
  let gi = -1;
  $$("tbody tr", host).forEach(tr => { if (tr.classList.contains("grp")) gi++; tr.dataset.g = gi; });
  const input = $("input", host), count = $(".cli-count", host), all = G.reduce((n, [, r]) => n + r.length, 0);
  let tab = 0;
  const filter = () => {
    const q = input.value.trim().toLowerCase(); let n = 0;
    $$(".cli-tabs button", host).forEach(b => b.setAttribute("aria-pressed", !q && +b.dataset.g === tab));
    $$("tbody tr", host).forEach(tr => {
      if (tr.classList.contains("grp")) { tr.hidden = !q; return; }
      const hit = q ? tr.dataset.q.includes(q) : +tr.dataset.g === tab; tr.hidden = !hit; n += hit;
    });
    if (q) $$("tbody tr.grp", host).forEach(gr => { let s = gr.nextElementSibling, any = false; while (s && !s.classList.contains("grp")) { any ||= !s.hidden; s = s.nextElementSibling; } gr.hidden = !any; });
    count.textContent = q ? `${n} of ${all} commands match` : `${all} commands in ${G.length} groups · pick a group or type to search all`;
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (b && b.tagName === "BUTTON") { tab = +b.dataset.g; input.value = ""; filter(); } });
  input.addEventListener("input", filter); filter();
};

/* ---------- quiz ---------- */
W.quiz = host => {
  const Q = [
    ["Which locator should you try first?", ["page.locator('#submit')", "page.getByRole('button', { name: 'Submit' })", "page.locator('//button[1]')", "page.getByTestId('submit')"], 1, "Role + accessible name mirrors what users see and survives markup changes."],
    ["getByRole('button').click() matches Login and Cancel. What happens?", ["It clicks Login, the first one", "It clicks both", "It throws a strict mode violation", "It waits until one disappears"], 2, "Actions are strict: more than one match is an error, so you must be specific."],
    ["How does Playwright run tests from one file by default?", ["In parallel across workers", "In order, in a single worker", "One browser per test, all at once", "Randomly"], 1, "Files run in parallel; tests inside a file run in order unless fullyParallel is on."],
    ["A test fails, then passes on retry. It is reported as…", ["passed", "failed", "flaky", "skipped"], 2, "Flaky means it needed a retry. Treat it as a bug to fix."],
    ["Can Playwright use your installed Firefox?", ["Yes, with channel: 'firefox'", "No, only its own patched Firefox", "Only on Linux", "Only in headed mode"], 1, "Stock Firefox lacks the automation APIs Playwright needs, so it ships a patched build."],
    ["What's the default timeout of expect(locator).toBeVisible()?", ["0, it checks once", "5 seconds, retrying", "30 seconds", "No limit"], 1, "Web-first assertions retry for 5 s by default (expect.timeout)."],
    ["Best way to make every test start logged in?", ["Log in inside beforeEach", "A setup project that saves storageState, used by the other projects", "page.waitForTimeout after login", "Disable auth on the test server"], 1, "Log in once, save cookies and storage, and reuse them in every context."],
    ["Which trace setting is the usual choice for CI?", ["'on'", "'off'", "'on-first-retry'", "'retain-on-success'"], 2, "Free on green runs; a full trace whenever a test needs a retry."]
  ];
  // one question at a time, with a dot per question
  let i = 0, score = 0;
  const res = [];
  const draw = () => {
    if (i >= Q.length) {
      host.innerHTML = `<div class="q quiz-end"><p class="big">${score === Q.length ? "🏆" : score >= 6 ? "🎉" : "💪"} ${score} / ${Q.length}</p>
        <p>${score === Q.length ? "Perfect: you're ready to write real Playwright tests." : "Good work. Open the lessons behind the ✕ dots to revise them."}</p>
        <div class="dots">${res.map((r, k) => `<i class="${r ? "ok" : "no"}" title="Question ${k + 1}"></i>`).join("")}</div>
        <button type="button" class="btn pri" data-again>Try again</button></div>`;
      markDone("quiz"); return;
    }
    const [q, o] = Q[i];
    host.innerHTML = `<div class="q"><div class="dots">${Q.map((_, k) => `<i class="${k < i ? (res[k] ? "ok" : "no") : k === i ? "cur" : ""}"></i>`).join("")}</div>
      <p class="qn">Question ${i + 1} of ${Q.length}</p><p>${esc(q)}</p><div class="opts">${o.map((x, k) => `<button type="button" data-k="${k}">${esc(x)}</button>`).join("")}</div>
      <div class="why" hidden></div><div class="wrow" hidden><button type="button" class="btn pri" data-nextq>${i + 1 < Q.length ? "Next question ›" : "See my score"}</button></div></div>`;
  };
  host.addEventListener("click", e => {
    if (e.target.closest("[data-again]")) { i = 0; score = 0; res.length = 0; return draw(); }
    if (e.target.closest("[data-nextq]")) { i++; return draw(); }
    const b = e.target.closest("button[data-k]"); if (!b) return;
    const q = b.closest(".q"); if (q.dataset.answered) return;
    const [, , a, why] = Q[i], k = +b.dataset.k;
    q.dataset.answered = 1; res[i] = k === a; if (k === a) score++;
    $$("button[data-k]", q).forEach((x, j) => { if (j === a) x.classList.add("right"); else if (j === k) x.classList.add("wrong"); });
    const w = $(".why", q); w.hidden = false; w.textContent = (k === a ? "Right. " : "Not quite. ") + why;
    $(".wrow", q).hidden = false; $("[data-nextq]", q).focus();
  });
  draw();
};

/* ---------- 3. fixture lifecycle ---------- */
W.fixture = host => {
  const BOX = [["browser", "worker", "var(--browser)"], ["context", "test", "var(--cfg)"], ["page", "test", "var(--runner)"], ["your test", "", "var(--assert)"]];
  host.insertAdjacentHTML("beforeend", `<div class="svg-scroll"><svg class="svg" viewBox="0 0 640 196" role="img" aria-label="browser contains context contains page, which is handed to your test">
    ${BOX.map(([n, s, c], k) => `<g class="fx" data-k="${k}"><rect x="${10 + k * 30}" y="${10 + k * 22}" width="${620 - k * 60}" height="${176 - k * 44}" rx="12" fill="color-mix(in srgb, ${c} 10%, var(--surface))" stroke="${c}" stroke-width="2.5"/>
      <text x="${26 + k * 30}" y="${34 + k * 22}" class="t-b" fill="${c}">${n}</text>${s ? `<text x="${614 - k * 30}" y="${34 + k * 22}" text-anchor="end" class="t-m" fill="var(--muted)">scope: ${s}</text>` : ""}</g>`).join("")}
  </svg></div>`);
  const S = [
    [[0], "<b>Worker starts:</b> one <code>browser</code> is launched and shared by every test in this worker."],
    [[0, 1], "<b>Setup:</b> before the test, Playwright opens a fresh <code>context</code>: empty cookies and storage."],
    [[0, 1, 2], "<b>Setup:</b> then a new <code>page</code> (tab) inside that context."],
    [[0, 1, 2, 3], "<b>Use:</b> your test receives <code>{ page }</code> and runs."],
    [[0], "<b>Teardown:</b> page and context are closed. The browser stays for the next test, which gets a new context and page."]
  ];
  stepper(host, S.length, i => { $$(".fx", host).forEach(g => { g.style.transition = "opacity .35s"; g.style.opacity = S[i][0].includes(+g.dataset.k) ? 1 : .08; }); return S[i][1]; }, { auto: 1700 });
};

/* ---------- 10. clickable priority pyramid ---------- */
W.pyramid = host => {
  const L = [
    ["Role · Label", "var(--assert)", "page.getByRole('button', { name: 'Login' })", "What users and screen readers see. Survives restyling and restructuring."],
    ["Text · Placeholder · Alt", "color-mix(in srgb, var(--assert) 65%, var(--cfg))", "page.getByText('Login')", "Visible text. Good for non-interactive elements; breaks if the copy changes."],
    ["Test id", "var(--cfg)", "page.getByTestId('login-btn')", "A contract with developers. Very stable, but users can't see it."],
    ["Stable CSS", "var(--loc)", "page.locator('#loginBtn')", "Fine when the id is meaningful and stable. Never generated classes."],
    ["XPath · position", "var(--bad)", "page.locator('//div[2]/form/button[1]')", "Tied to the DOM tree: breaks when anything moves. Last resort."]
  ];
  host.innerHTML = `<div class="two"><svg class="svg" viewBox="0 0 400 280" role="group" aria-label="Locator priority pyramid">
    ${L.map(([n, c], k) => { const t = 10 + k * 54, w0 = 30 + k * 66, w1 = 30 + (k + 1) * 66; return `<g class="pyr" data-k="${k}" tabindex="0" role="button" aria-label="${n}" style="cursor:pointer">
      <path d="M${200 - w0} ${t} H${200 + w0} L${200 + w1} ${t + 50} H${200 - w1} Z" fill="${c}"/><text x="200" y="${t + 31}" text-anchor="middle" class="t-b" fill="#fff">${n}</text></g>`; }).join("")}
    <text x="6" y="22" class="t-s">best</text><text x="394" y="272" text-anchor="end" class="t-s">worst</text></svg>
    <div class="cfg-note" aria-live="polite"></div></div>`;
  const note = $(".cfg-note", host);
  const pick = k => { $$(".pyr", host).forEach(g => g.style.opacity = +g.dataset.k === k ? 1 : .45); note.innerHTML = `<b>${k + 1} · ${L[k][0]}</b><pre class="code" style="margin:6px 0">${hl(L[k][2])}</pre>${L[k][3]}<p class="note" style="margin:.5em 0 0">Same Login button every time. Click another layer.</p>`; };
  host.addEventListener("click", e => { const g = e.target.closest(".pyr"); if (g) pick(+g.dataset.k); });
  host.addEventListener("keydown", e => { const g = e.target.closest(".pyr"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(+g.dataset.k); } });
  pick(0);
};

/* ---------- 12. locator chain builder ---------- */
W.chain = host => {
  const ROWS = [["Asha Rao", "Admin"], ["John Doe", "Editor"], ["Mei Chen", "Viewer"]];
  host.innerHTML = `<div class="two"><div class="tbl" style="margin:0"><table class="chain-t"><tr><th>Name</th><th>Role</th><th></th></tr>
    ${ROWS.map(([n, r], k) => `<tr data-r="${k}"><td>${n}</td><td>${r}</td><td><button type="button" class="mbtn" tabindex="-1" data-b="${k}">Edit</button></td></tr>`).join("")}</table></div>
    <div><pre class="code chain-code" style="margin:0"></pre><div class="stepnote chain-note" aria-live="polite"></div></div></div>`;
  const S = [
    ["page.getByRole('button', { name: 'Edit' })", { b: [0, 1, 2] }, "<b>3 matches.</b> Every row has an Edit button, so <code>.click()</code> would be a strict-mode error."],
    ["page.getByRole('row', { name: /John Doe/ })", { r: [1] }, "<b>1 row.</b> Narrow to the row whose text contains John Doe, the way you'd describe it to a person."],
    ["page.getByRole('row', { name: /John Doe/ })\n    .getByRole('button', { name: 'Edit' })", { r: [1], b: [1] }, "<b>1 button ✓</b> Search inside that row only. Re-ordering or adding rows can't break it."],
    ["page.getByRole('row')\n    .filter({ hasText: 'Editor' })\n    .getByRole('button', { name: 'Edit' })", { r: [1], b: [1] }, "<b>Same result with <code>.filter()</code>.</b> Filter by text, or by a child locator with <code>{ has: … }</code>."]
  ];
  const code = $(".chain-code", host), note = $(".chain-note", host);
  const wrap = document.createElement("div"); host.append(wrap);
  stepper(wrap, S.length, i => {
    const [c, m, t] = S[i];
    code.innerHTML = hl("await " + c + (i ? ".click();" : ".click();  // ✕"));
    $$("tr[data-r]", host).forEach(tr => tr.classList.toggle("hit-row", (m.r || []).includes(+tr.dataset.r)));
    $$("[data-b]", host).forEach(b => b.classList.toggle("hit-btn", (m.b || []).includes(+b.dataset.b)));
    note.innerHTML = t; return "";
  }, { auto: 2200 });
  $(".stepnote:not(.chain-note)", wrap).remove();
};

/* ---------- 16. retrying assertion demo ---------- */
W.expect = host => {
  const A = [
    ["await expect(toast).toBeVisible()", true, "A “Saved” toast appears 1.2 s after clicking Save."],
    ["await expect(toast).toHaveText('Saved')", true, "The toast first says “Saving…”, then “Saved”."],
    ["await expect(items).toHaveCount(3)", true, "The list loads its third item late."],
    ["expect(await toast.isVisible()).toBe(true)", false, "Checks once, immediately. No retry."]
  ];
  host.innerHTML = `<div class="bpick" role="group" aria-label="Assertion">${A.map(([c], k) => `<button type="button" aria-pressed="false" data-k="${k}"><code>${esc(c.replace(/^await /, ""))}</code></button>`).join("")}</div>
    <div class="two"><div class="mock exp-stage"></div><div><div class="exp-polls" aria-live="polite"></div><div class="stepnote exp-note"></div></div></div>`;
  let id = 0;
  const go = async k => {
    const my = ++id, [c, retry, story] = A[k], stage = $(".exp-stage", host), polls = $(".exp-polls", host), note = $(".exp-note", host);
    $$(".bpick button", host).forEach(b => b.setAttribute("aria-pressed", +b.dataset.k === k));
    const draw = t => {
      const ready = t >= 1200;
      stage.innerHTML = k === 2 ? `<b>Cart</b><ul style="margin:6px 0 0;padding-left:1.2em"><li>Mug</li><li>Lamp</li>${ready ? '<li class="enter">Plant</li>' : ""}</ul>`
        : `<button type="button" class="mbtn primary" tabindex="-1">Save</button>${k === 1 ? `<div class="toast">${ready ? "Saved ✓" : "Saving…"}</div>` : ready ? '<div class="toast enter">Saved ✓</div>' : ""}`;
    };
    polls.innerHTML = `<pre class="code" style="margin:0 0 8px">${hl(c)}</pre>`; note.textContent = story; draw(0);
    const times = retry ? [0, 100, 250, 500, 1000, 1500] : [0];
    let t0 = 0;
    for (const t of times) {
      if (!REDUCED) await sleep(t - t0); t0 = t;
      if (my !== id) return;
      const ok = t >= 1200; draw(t);
      polls.insertAdjacentHTML("beforeend", `<span class="poll ${ok ? "ok" : retry ? "" : "bad"}">${t} ms ${ok ? "✓" : "✕"}</span> `);
      if (ok) { note.innerHTML = `<b style="color:var(--assert)">Passed at ${t} ms.</b> It kept checking until the page caught up.`; return; }
    }
    if (!retry) { note.innerHTML = `<b style="color:var(--bad)">Failed at 0 ms.</b> The toast arrived later, but this check never looked again. Use <code>await expect(toast).toBeVisible()</code>.`; if (!REDUCED) await sleep(1200); if (my === id) draw(1200); }
  };
  host.addEventListener("click", e => { const b = e.target.closest(".bpick button"); if (b) go(+b.dataset.k); });
  go(0);
};

/* ---------- 17. which tool when ---------- */
W.tools = host => {
  const T = {
    "Codegen": ["npx playwright codegen https://example.com", "You click around a real browser; the Inspector writes the test, with role-based locators.", "Starting a new test, or learning which locator to use", "🎥"],
    "UI mode": ["npx playwright test --ui", "A test explorer with watch mode, a time-travel timeline, DOM snapshots and Pick locator.", "Writing and fixing tests every day", "🧭"],
    "Debug": ["npx playwright test --debug", "Opens a headed browser and the Inspector, paused before the first action. Step over actions one at a time.", "One failing test you need to step through", "🐞"],
    "Headed": ["npx playwright test --headed", "Normal run, but you can see the browser windows.", "Just watching what happens", "👀"],
    "VS Code": ["Playwright Test for VS Code extension", "Run and debug tests from the editor with breakpoints, record new tests, pick locators.", "If you live in VS Code", "🧩"]
  };
  host.innerHTML = `<div class="bpick" role="group" aria-label="Tool">${Object.keys(T).map(k => `<button type="button" aria-pressed="false">${k}</button>`).join("")}</div><div class="tool-card"></div>`;
  const show = k => {
    const [cmd, what, when, ico] = T[k];
    $$(".bpick button", host).forEach(b => b.setAttribute("aria-pressed", b.textContent === k));
    $(".tool-card", host).innerHTML = `<div class="tool-ico" aria-hidden="true">${ico}</div><div><b>${k}</b><p>${what}</p><p><span class="verdict ok">Use it for</span> ${when}</p><pre class="code" style="margin:6px 0 0">${hl(cmd)}</pre></div>`;
  };
  host.addEventListener("click", e => { const b = e.target.closest(".bpick button"); if (b) show(b.textContent); });
  show("UI mode");
};

$$(".widget").forEach(h => { const f = W[h.dataset.w]; if (f) f(h); });

/* ---------- course: one lesson per screen, progress, quick checks ---------- */
const PARTS = { 1: ["Test runner", "var(--runner)"], 2: ["Locators", "var(--loc)"], 3: ["Assertions", "var(--assert)"], 4: ["Tools & CI", "var(--tool)"], 5: ["Finish", "var(--cfg)"] };
const lessons = $$(".lesson"), N = lessons.length;
const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
const done = new Set(store("pw-done") || []);
const markDone = id => { if (done.has(id)) return; done.add(id); store("pw-done", [...done]); paint(); };

// the bar at the top
const bar = document.createElement("div"); bar.className = "course";
bar.innerHTML = `<button type="button" class="btn menu" aria-expanded="false" aria-controls="drawer">☰ <span>Lessons</span></button>
  <a class="where" href="#top"></a>
  <div class="prog" role="progressbar" aria-label="Lessons done" aria-valuemin="0" aria-valuemax="${N}"><i></i></div>
  <button type="button" class="btn nav-b" data-go="-1" aria-label="Previous lesson">‹</button><button type="button" class="btn pri nav-b" data-go="1" aria-label="Next lesson">›</button>`;
document.body.prepend(bar);
const drawer = document.createElement("nav"); drawer.className = "drawer"; drawer.id = "drawer"; drawer.hidden = true; drawer.setAttribute("aria-label", "All lessons");
document.body.append(drawer);
const menuBtn = $(".menu", bar);
const openDrawer = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open); if (open) $("a.cur, a", drawer)?.focus(); };
menuBtn.addEventListener("click", () => openDrawer(drawer.hidden));
document.addEventListener("click", e => { if (!drawer.hidden && !drawer.contains(e.target) && !menuBtn.contains(e.target)) openDrawer(false); });

// per-lesson header, quick check and footer
lessons.forEach((s, i) => {
  const [pn, pc] = PARTS[s.dataset.part];
  s.style.setProperty("--pc", pc);
  s.insertAdjacentHTML("afterbegin", `<p class="crumb"><span class="pill">${pn}</span> Lesson ${i + 1} of ${N} · ~${s.dataset.min} min</p><div class="emoji" aria-hidden="true">${s.dataset.emoji}</div>`);
  const ck = $(".check", s);
  if (ck) {
    const q = JSON.parse(ck.dataset.q);
    ck.innerHTML = `<p class="check-h">Quick check</p><p class="check-q">${esc(q.q)}</p><div class="opts">${q.o.map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join("")}</div><p class="why" hidden></p>`;
    ck.addEventListener("click", e => {
      const b = e.target.closest("button[data-k]"); if (!b || ck.dataset.answered) return;
      const k = +b.dataset.k, ok = k === q.a;
      if (ok) ck.dataset.answered = 1;
      $$("button", ck).forEach((x, j) => x.classList.toggle(j === q.a && ok ? "right" : "wrong", j === k));
      const w = $(".why", ck); w.hidden = false; w.innerHTML = ok ? `✓ ${esc(q.why)}` : "Not quite. Try another answer.";
      if (ok) { markDone(s.id); ck.classList.add("passed"); }
    });
  }
  const prev = lessons[i - 1], next = lessons[i + 1];
  s.insertAdjacentHTML("beforeend", `<div class="foot">${prev ? `<a class="btn" href="#${prev.id}">‹ ${esc(prev.dataset.title)}</a>` : `<a class="btn" href="#top">‹ Home</a>`}
    ${next ? `<a class="btn pri" href="#${next.id}" data-done="${s.id}">Next: ${esc(next.dataset.title)} ›</a>` : `<a class="btn pri" href="#top" data-done="${s.id}">Finish 🎉</a>`}</div>`);
});
document.addEventListener("click", e => { const a = e.target.closest("[data-done]"); if (a) markDone(a.dataset.done); });

// home: part cards + continue
function paint() {
  const cur = location.hash.slice(1);
  $(".prog i", bar).style.width = `${done.size / N * 100}%`;
  $(".prog", bar).setAttribute("aria-valuenow", done.size);
  $(".prog", bar).title = `${done.size} of ${N} lessons done`;
  drawer.innerHTML = `<a href="#top" class="home-l">🏠 Home · ${done.size}/${N} done</a>` + Object.entries(PARTS).map(([p, [pn, pc]]) => {
    const ls = lessons.filter(s => s.dataset.part === p);
    return `<p class="d-part" style="--pc:${pc}">${pn}</p>` + ls.map(s => `<a href="#${s.id}" class="${s.id === cur ? "cur" : ""}">${done.has(s.id) ? "✓" : s.dataset.emoji} <span>${lessons.indexOf(s) + 1}. ${esc(s.dataset.title)}</span></a>`).join("");
  }).join("") + `<div class="d-tools"><button type="button" class="btn" data-all>${document.body.classList.contains("all") ? "One lesson at a time" : "Show all on one page"}</button><button type="button" class="btn" data-reset>Reset progress</button></div>`;
  $("#parts").innerHTML = Object.entries(PARTS).map(([p, [pn, pc]]) => {
    const ls = lessons.filter(s => s.dataset.part === p), n = ls.filter(s => done.has(s.id)).length, first = ls.find(s => !done.has(s.id)) || ls[0];
    return `<a class="part-card" href="#${first.id}" style="--pc:${pc}"><span class="pc-n">Part ${p}</span><b>${pn}</b><span class="pc-e">${ls.map(s => `<i class="${done.has(s.id) ? "d" : ""}" title="${esc(s.dataset.title)}">${s.dataset.emoji}</i>`).join("")}</span><span class="pc-p">${n}/${ls.length} done</span></a>`;
  }).join("");
  const last = store("pw-last"), nextUp = lessons.find(s => !done.has(s.id));
  $("#heroCta").innerHTML = last && lessons.some(s => s.id === last)
    ? `<a class="btn pri" href="#${last}">Continue: ${esc($("#" + last).dataset.title)} →</a> <a class="btn" href="#${(nextUp || lessons[0]).id}">${nextUp ? "First unfinished lesson" : "Start again"}</a>`
    : `<a class="btn pri" href="#runner">Start lesson 1 →</a> <a class="btn" href="#playground">Jump to the locator playground</a>`;
}
drawer.addEventListener("click", e => {
  if (e.target.closest("[data-all]")) { document.body.classList.toggle("all"); route(); return; }
  if (e.target.closest("[data-reset]")) { done.clear(); store("pw-done", []); store("pw-last", ""); $$(".check").forEach(c => { delete c.dataset.answered; c.classList.remove("passed"); $$("button", c).forEach(b => b.className = ""); $(".why", c).hidden = true; }); paint(); return; }
  if (e.target.closest("a")) openDrawer(false);
});

function route() {
  const id = location.hash.slice(1), i = lessons.findIndex(s => s.id === id), all = document.body.classList.contains("all");
  lessons.forEach((s, k) => s.classList.toggle("cur", k === i));
  document.body.dataset.view = i < 0 ? "home" : "lesson";
  const s = lessons[i];
  $(".where", bar).innerHTML = s ? `<span class="pill" style="--pc:${PARTS[s.dataset.part][1]}">${PARTS[s.dataset.part][0]}</span> <b>${i + 1}/${N}</b> <span class="wt">${esc(s.dataset.title)}</span>` : `<b>Playwright, visually</b>`;
  $$(".nav-b", bar).forEach(b => b.disabled = (b.dataset.go === "-1" && i < 0) || (b.dataset.go === "1" && i === N - 1));
  if (s) store("pw-last", s.id);
  paint();
  if (!all || i < 0) { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ""; }
  else s.scrollIntoView();
  if (s && !all) $("h2", s).focus({ preventScroll: true });
}
lessons.forEach(s => $("h2", s).tabIndex = -1);
const step = d => { const i = lessons.findIndex(s => s.id === location.hash.slice(1)); const j = i < 0 ? (d > 0 ? 0 : -1) : i + d; if (d > 0 && i >= 0) markDone(lessons[i].id); location.hash = j < 0 ? "top" : lessons[Math.min(N - 1, j)].id; };
bar.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) step(+b.dataset.go); });
addEventListener("keydown", e => {
  if (e.key === "Escape") return openDrawer(false);
  if (e.altKey || e.ctrlKey || e.metaKey || /input|select|textarea/i.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
});
addEventListener("hashchange", route);
route();
})();
