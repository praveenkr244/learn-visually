/* MCP, Visually — chapter nav, code highlighting, diagrams and the end-to-end flow player.
   The flow player is deterministic: render(t) draws the exact frame for time t (seconds).
   Open index.html?film to get just the 1280x720 stage (used to record the MP4). */
(function () {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NS = "http://www.w3.org/2000/svg";
const FILM = /[?&]film\b/.test(location.search);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

/* ---------- code highlighting (python / json / shell) ---------- */
const KW = new Set("def async await return from import with as if else elif for in raise try except class None True False true false null print".split(" "));
const RE = /(#[^\n]*|\/\/[^\n]*)|("""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@[\w.]+)|(\b-?\d[\d_.]*\b)|\b([A-Za-z_]\w*)\b/g;
function hl(code) {
  let out = "", last = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += /^#|^\/\//.test(m[1]) && !/^#!/.test(m[1]) ? `<span class="c">${esc(m[1])}</span>` : esc(m[1]);
    else if (m[2]) {
      const after = code.slice(RE.lastIndex).match(/^\s*:/);
      out += `<span class="${after ? "p" : "s"}">${esc(m[2])}</span>`;
    }
    else if (m[3]) out += `<span class="d">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="n">${m[4]}</span>`;
    else out += KW.has(m[5]) ? `<span class="k">${m[5]}</span>` : m[5];
    last = RE.lastIndex;
  }
  return out + esc(code.slice(last));
}
$$("pre.code").forEach(p => { if (!p.id) p.innerHTML = hl(p.textContent.replace(/^\n+|\s+$/g, "")); });

/* ---------- YouTube: load the player only when asked (privacy-friendly domain) ---------- */
const ytB = $("#ytPlay");
if (ytB) ytB.addEventListener("click", () => {
  const f = document.createElement("iframe");
  f.src = "https://www.youtube-nocookie.com/embed/GeVCpohRU8Y?autoplay=1&rel=0";
  f.title = "What is MCP? | Completely Explained in 20 Minutes (Apna College)";
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true;
  $("#yt").replaceChildren(f);
  $("#ytNote").hidden = false;
});

/* ---------- chapter nav ---------- */
const lessons = $$(".lesson");
const nav = $("#chapters");
nav.innerHTML = `<a href="#top">Start</a>` + lessons.map(s => `<a href="#${s.id}" data-id="${s.id}">${esc(s.dataset.title || $("h2", s).textContent)}</a>`).join("");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$("a", nav).forEach(a => { const on = a.dataset.id === e.target.id; a.classList.toggle("on", on); if (on) a.scrollIntoView({ block: "nearest", inline: "nearest" }); });
  }), { rootMargin: "-35% 0px -60% 0px" });
  lessons.forEach(s => io.observe(s));
}

const W = {};

/* ---------- N x M ---------- */
W.nm = host => {
  const apps = ["Chat app", "IDE agent", "Custom agent"], tools = ["GitHub", "Postgres", "Slack", "Google Drive"];
  const ay = [60, 150, 240], ty = [40, 113, 186, 259];
  function draw(mode) {
    let s = `<svg viewBox="0 0 760 330" class="svg" role="img" aria-label="${mode === "before" ? "12 custom integrations" : "7 MCP implementations through one standard"}">`;
    if (mode === "before") {
      ay.forEach(y1 => ty.forEach(y2 => { s += `<path d="M170 ${y1} C380 ${y1} 380 ${y2} 590 ${y2}" stroke="var(--server)" stroke-width="2" fill="none" class="dash" opacity=".7"/>`; }));
    } else {
      ay.forEach(y => { s += `<path d="M170 ${y} C270 ${y} 280 150 340 150" stroke="var(--client)" stroke-width="3" fill="none" class="dash"/>`; });
      ty.forEach(y => { s += `<path d="M420 150 C480 150 490 ${y} 590 ${y}" stroke="var(--server)" stroke-width="3" fill="none" class="dash"/>`; });
      s += `<circle cx="380" cy="150" r="42" fill="var(--client)"/><text x="380" y="156" text-anchor="middle" class="t-h" fill="#fff">MCP</text>`;
    }
    apps.forEach((a, i) => { s += `<rect x="20" y="${ay[i] - 22}" width="150" height="44" rx="10" fill="var(--surface)" stroke="var(--host)" stroke-width="2"/><text x="95" y="${ay[i] + 5}" text-anchor="middle" fill="var(--ink)" class="t-s" style="fill:var(--ink);font-weight:600">${a}</text>`; });
    tools.forEach((t, i) => { s += `<rect x="590" y="${ty[i] - 22}" width="150" height="44" rx="10" fill="var(--surface)" stroke="var(--api)" stroke-width="2"/><text x="665" y="${ty[i] + 5}" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:600">${t}</text>`; });
    s += `<text x="380" y="318" text-anchor="middle" class="t-h" fill="var(--ink)">${mode === "before" ? "3 apps × 4 tools = 12 custom integrations" : "3 MCP clients + 4 MCP servers = 7 implementations"}</text></svg>`;
    host.innerHTML = `<div class="svg-scroll">${s}</div>`;
  }
  const fig = host.closest("figure");
  fig.addEventListener("click", e => {
    const b = e.target.closest("[data-nm]"); if (!b) return;
    $$("[data-nm]", fig).forEach(x => x.setAttribute("aria-pressed", x === b)); draw(b.dataset.nm);
  });
  draw("before");
};

/* ---------- architecture ---------- */
W.arch = host => {
  const rows = [["Client 1", "Server 1", "Files & Git", "Local folder"], ["Client 2", "Server 2", "Database", "Postgres"], ["Client 3", "Server 3", "External APIs", "Weather API"]];
  const ys = [70, 170, 290];
  let s = `<svg viewBox="0 0 900 370" class="svg" role="img" aria-label="Host with three clients, each connected to one server">
  <rect x="10" y="20" width="280" height="340" rx="16" fill="var(--soft)" stroke="var(--host)" stroke-width="2.5"/>
  <text x="30" y="50" class="t-h" fill="var(--host)">Host · AI app</text>
  <rect x="380" y="20" width="510" height="215" rx="16" fill="none" stroke="var(--line)" stroke-dasharray="6 5"/>
  <text x="395" y="42" class="t-s">Local machine</text>
  <rect x="380" y="248" width="510" height="112" rx="16" fill="none" stroke="var(--line)" stroke-dasharray="6 5"/>
  <text x="395" y="270" class="t-s">Internet</text>`;
  rows.forEach((r, i) => {
    const y = ys[i];
    s += `<rect x="120" y="${y - 22}" width="150" height="44" rx="10" fill="var(--surface)" stroke="var(--client)" stroke-width="2"/><text x="195" y="${y + 5}" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">${r[0]}</text>
    <path d="M270 ${y} H460" stroke="var(--client)" stroke-width="3" fill="none" class="dash"/>
    <text x="365" y="${y - 8}" text-anchor="middle" class="t-m" fill="var(--muted)">${i < 2 ? "stdio" : "HTTP"}</text>
    <rect x="460" y="${y - 26}" width="170" height="52" rx="10" fill="var(--surface)" stroke="var(--server)" stroke-width="2.5"/><text x="545" y="${y - 3}" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">${r[1]}</text><text x="545" y="${y + 16}" text-anchor="middle" class="t-s">${r[2]}</text>
    <path d="M630 ${y} H720" stroke="var(--api)" stroke-width="2.5" fill="none" class="dash"/><path d="M720 ${y} H630" stroke="none"/>
    <rect x="720" y="${y - 22}" width="150" height="44" rx="22" fill="var(--surface)" stroke="var(--api)" stroke-width="2"/><text x="795" y="${y + 5}" text-anchor="middle" class="t-s" style="fill:var(--ink)">${r[3]}</text>`;
  });
  s += `<text x="30" y="90" class="t-s">LLM access,</text><text x="30" y="110" class="t-s">user consent,</text><text x="30" y="130" class="t-s">conversation</text></svg>`;
  host.innerHTML = `<div class="svg-scroll">${s}</div>`;
};

/* ---------- transports ---------- */
W.transports = host => {
  host.innerHTML = `<div class="svg-scroll"><svg viewBox="0 0 900 250" class="svg" role="img" aria-label="stdio pipes versus HTTP POST">
  <text x="20" y="24" class="t-h" fill="var(--ink)">stdio (local)</text>
  <rect x="20" y="50" width="150" height="150" rx="12" fill="var(--soft)" stroke="var(--host)" stroke-width="2.5"/><text x="95" y="120" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Host +</text><text x="95" y="140" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">client</text>
  <rect x="280" y="50" width="150" height="150" rx="12" fill="var(--soft)" stroke="var(--server)" stroke-width="2.5"/><text x="355" y="115" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Server</text><text x="355" y="135" text-anchor="middle" class="t-s">child process</text>
  <path d="M170 95 H280" stroke="var(--client)" stroke-width="3" class="dash" fill="none"/><text x="225" y="85" text-anchor="middle" class="t-m" fill="var(--muted)">stdin →</text>
  <path d="M280 160 H170" stroke="var(--server)" stroke-width="3" class="dash" fill="none"/><text x="225" y="185" text-anchor="middle" class="t-m" fill="var(--muted)">← stdout</text>
  <text x="225" y="235" text-anchor="middle" class="t-s">host spawns: uv run server.py</text>
  <line x1="460" y1="20" x2="460" y2="230" stroke="var(--line)"/>
  <text x="490" y="24" class="t-h" fill="var(--ink)">Streamable HTTP (local or remote)</text>
  <rect x="490" y="50" width="130" height="150" rx="12" fill="var(--soft)" stroke="var(--host)" stroke-width="2.5"/><text x="555" y="120" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Host +</text><text x="555" y="140" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">client</text>
  <rect x="750" y="50" width="140" height="150" rx="12" fill="var(--soft)" stroke="var(--server)" stroke-width="2.5"/><text x="820" y="115" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Server</text><text x="820" y="135" text-anchor="middle" class="t-s">https://…/mcp</text>
  <path d="M620 95 H750" stroke="var(--client)" stroke-width="3" class="dash" fill="none"/><text x="685" y="85" text-anchor="middle" class="t-m" fill="var(--muted)">POST /mcp</text>
  <path d="M750 160 H620" stroke="var(--server)" stroke-width="3" class="dash" fill="none"/><text x="685" y="185" text-anchor="middle" class="t-m" fill="var(--muted)">JSON or SSE</text>
  <text x="690" y="235" text-anchor="middle" class="t-s">headers: MCP-Protocol-Version, Mcp-Method, Mcp-Name</text>
  </svg></div>`;
};

/* ---------- JSON-RPC tabs ---------- */
(function rpc() {
  const tabs = $("#rpcTabs"); if (!tabs) return;
  const T = [
    ["Request", `{\n  "jsonrpc": "2.0",\n  "id": 7,\n  "method": "tools/call",\n  "params": {\n    "name": "get_weather",\n    "arguments": { "city": "Delhi" },\n    "_meta": { … }\n  }\n}`, "<b>Request</b>Has an <code>id</code> and a <code>method</code>. The other side must answer with the same id. Sent by the client for <code>tools/call</code>, <code>resources/read</code> and so on."],
    ["Result", `{\n  "jsonrpc": "2.0",\n  "id": 7,\n  "result": {\n    "resultType": "complete",\n    "content": [\n      { "type": "text", "text": "31.4 °C in Delhi" }\n    ],\n    "isError": false\n  }\n}`, "<b>Result</b>Same <code>id</code> as the request, plus <code>result</code>. In 2026-07-28 results carry <code>resultType</code>: <code>complete</code>, or <code>input_required</code> when the server needs more from the user."],
    ["Error", `{\n  "jsonrpc": "2.0",\n  "id": 7,\n  "error": {\n    "code": -32602,\n    "message": "Unknown tool: get_wether"\n  }\n}`, "<b>Error</b>Same <code>id</code>, plus <code>error</code> with a numeric <code>code</code> and a <code>message</code>. Used when the request itself is wrong."],
    ["Notification", `{\n  "jsonrpc": "2.0",\n  "method": "notifications/tools/list_changed"\n}`, "<b>Notification</b>No <code>id</code>, so no reply is expected. Servers send these on a <code>subscriptions/listen</code> stream, e.g. when their tool list changes."]
  ];
  tabs.innerHTML = T.map((t, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${t[0]}</button>`).join("");
  const show = i => { $("#rpcCode").innerHTML = hl(T[i][1]); $("#rpcNote").innerHTML = T[i][2]; $$("button", tabs).forEach((b, k) => b.setAttribute("aria-selected", k === i)); };
  tabs.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) show(+b.dataset.i); });
  show(0);
})();

/* ---------- multi round-trip ---------- */
W.mrtr = host => {
  const X = { User: 70, Client: 290, Server: 510 };
  const steps = [
    ["Client", "Server", "tools/call create_issue", `{\n  "id": 1, "method": "tools/call",\n  "params": {\n    "name": "create_issue",\n    "arguments": { "title": "Login button broken" }\n  }\n}`, "The model asked to create an issue, so the client calls the tool."],
    ["Server", "Client", "input_required", `{\n  "id": 1, "result": {\n    "resultType": "input_required",\n    "inputRequests": {\n      "repo": {\n        "method": "elicitation/create",\n        "params": {\n          "mode": "form",\n          "message": "Which repository?",\n          "requestedSchema": { … }\n        }\n      }\n    },\n    "requestState": "eyJ0aXRsZSI6…"\n  }\n}`, "The server can't finish yet. Instead of holding a connection open, it returns <b>input_required</b> with what it needs and an opaque <b>requestState</b>."],
    ["Client", "User", "form: Which repository?", `Host shows a form:\n\n  Which repository?\n  [ acme/web        ]\n  [ Cancel ] [ Submit ]`, "The host shows the question to the user. The server is not waiting: it has already replied."],
    ["User", "Client", "acme/web", `{ "action": "accept",\n  "content": { "name": "acme/web" } }`, "The user answers (or declines, which the server will also hear about)."],
    ["Client", "Server", "tools/call (retry)", `{\n  "id": 2, "method": "tools/call",\n  "params": {\n    "name": "create_issue",\n    "arguments": { "title": "Login button broken" },\n    "inputResponses": {\n      "repo": { "action": "accept",\n                "content": { "name": "acme/web" } }\n    },\n    "requestState": "eyJ0aXRsZSI6…"\n  }\n}`, "The client sends the <b>same call again</b> with a <b>new id</b>, the answers in <b>inputResponses</b>, and the requestState echoed back. Any server instance can handle it."],
    ["Server", "Client", "complete ✓", `{\n  "id": 2, "result": {\n    "resultType": "complete",\n    "content": [{ "type": "text",\n      "text": "Created acme/web#42" }]\n  }\n}`, "Now the server has everything and returns a normal <b>complete</b> result."]
  ];
  host.innerHTML = `<div class="mr"><div><div class="svg-scroll"><svg class="svg" id="mrSvg" viewBox="0 0 580 330" role="img" aria-label="Sequence diagram of a multi round-trip request"></svg></div></div><pre class="code" id="mrCode"></pre></div>
  <div class="wrow"><button class="btn" data-m="reset">⟲ Reset</button><button class="btn" data-m="prev">◀ Back</button><button class="btn pri" data-m="next">Next ▶</button><span class="note" id="mrCount"></span></div>
  <div class="stepnote" id="mrNote" aria-live="polite"></div>`;
  let i = 0;
  const col = { User: "var(--user)", Client: "var(--client)", Server: "var(--server)" };
  function draw() {
    let s = "";
    Object.entries(X).forEach(([n, x]) => { s += `<rect x="${x - 55}" y="6" width="110" height="34" rx="8" fill="var(--surface)" stroke="${col[n]}" stroke-width="2.5"/><text x="${x}" y="28" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">${n === "Client" ? "Host / client" : n}</text><line x1="${x}" y1="40" x2="${x}" y2="325" stroke="var(--line)" stroke-dasharray="4 4"/>`; });
    s += `<defs><marker id="mrA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>`;
    steps.slice(0, i + 1).forEach((st, k) => {
      const y = 70 + k * 45, x1 = X[st[0]], x2 = X[st[1]], on = k === i, c = on ? "var(--wire)" : "var(--muted)";
      s += `<line x1="${x1}" y1="${y}" x2="${x2 + (x2 > x1 ? -4 : 4)}" y2="${y}" stroke="${c}" stroke-width="${on ? 3 : 2}" marker-end="url(#mrA)"/><text x="${(x1 + x2) / 2}" y="${y - 7}" text-anchor="middle" class="t-m" style="fill:${on ? "var(--ink)" : "var(--muted)"};font-weight:${on ? 700 : 400}">${esc(st[2])}</text>`;
    });
    $("#mrSvg", host).innerHTML = s;
    $("#mrCode", host).innerHTML = hl(steps[i][3]);
    $("#mrNote", host).innerHTML = steps[i][4];
    $("#mrCount", host).textContent = `step ${i + 1} / ${steps.length}`;
  }
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    const a = b.dataset.m; i = a === "reset" ? 0 : a === "prev" ? Math.max(0, i - 1) : Math.min(steps.length - 1, i + 1); draw();
  });
  draw();
};

/* ---------- stateless vs sessions ---------- */
W.stateless = host => {
  const fig = host.closest("figure");
  let mode = "new", downA = false, rr = 0, session = null, packets = [], log = [], raf = null, timer = null;
  const IY = { A: 70, B: 160, C: 250 };
  host.innerHTML = `<div class="svg-scroll"><svg class="svg" viewBox="0 0 760 320" role="img" aria-label="Requests routed through a load balancer to server instances">
  <rect x="20" y="130" width="120" height="60" rx="10" fill="var(--surface)" stroke="var(--client)" stroke-width="2.5"/><text x="80" y="165" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Client</text>
  <rect x="250" y="130" width="140" height="60" rx="10" fill="var(--surface)" stroke="var(--muted)" stroke-width="2"/><text x="320" y="158" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Load balancer</text><text x="320" y="177" text-anchor="middle" class="t-s" id="slLb">round robin</text>
  ${["A", "B", "C"].map(k => `<g id="slI${k}"><rect x="560" y="${IY[k] - 30}" width="170" height="60" rx="10" fill="var(--surface)" stroke="var(--server)" stroke-width="2.5"/><text x="645" y="${IY[k] - 5}" text-anchor="middle" class="t-s" style="fill:var(--ink);font-weight:700">Server instance ${k}</text><text x="645" y="${IY[k] + 15}" text-anchor="middle" class="t-s" id="slS${k}">idle</text></g>`).join("")}
  <path d="M140 160 H250" stroke="var(--line)" stroke-width="2"/>${["A", "B", "C"].map(k => `<path d="M390 160 C470 160 480 ${IY[k]} 560 ${IY[k]}" stroke="var(--line)" stroke-width="2" fill="none"/>`).join("")}
  <g id="slP"></g></svg></div>
  <div class="wrow"><button class="btn" id="slDown">Take instance A down</button><span class="note">Requests are sent automatically every second.</span></div>
  <div class="stepnote" id="slLog" aria-live="polite"></div>`;
  function setStatus(k, txt, color) { const t = $("#slS" + k, host); t.textContent = txt; t.style.fill = color || ""; }
  function refresh() {
    ["A", "B", "C"].forEach(k => { $("#slI" + k, host).style.opacity = k === "A" && downA ? .3 : 1; });
    $("#slLb", host).textContent = mode === "old" ? (session ? "sticky → A (session)" : "sticky sessions") : "round robin, no state";
    $("#slDown", host).textContent = downA ? "Bring instance A back" : "Take instance A down";
  }
  function say(html) { log.unshift(html); log = log.slice(0, 3); $("#slLog", host).innerHTML = log.join("<br>"); }
  function send() {
    let label, target, ok = true, note;
    if (mode === "new") {
      const alive = ["A", "B", "C"].filter(k => !(k === "A" && downA));
      target = alive[rr++ % alive.length]; label = "tools/call + _meta";
      note = `✓ <b>${target}</b> handled the request on its own: version and capabilities came in <code>_meta</code>.`;
    } else if (!session) {
      target = downA ? "B" : "A"; label = "initialize"; session = { on: target, id: "s-" + Math.random().toString(16).slice(2, 6) };
      note = `Handshake on <b>${target}</b>. It stores the session and replies <code>Mcp-Session-Id: ${session.id}</code>.`;
    } else {
      target = session.on; label = "Mcp-Session-Id: " + session.id;
      if (target === "A" && downA) { ok = false; note = `✗ The session lived on <b>A</b>, which is down. The client gets 404 and must start over with <code>initialize</code>.`; session = null; }
      else note = `Sticky routing: every request must go back to <b>${target}</b>, the only instance that knows the session.`;
    }
    packets.push({ t0: performance.now(), target, label, ok, note });
  }
  function frame(now) {
    let svg = "";
    packets = packets.filter(p => {
      const u = (now - p.t0) / 1100;
      if (u >= 1) {
        if (!(p.target === "A" && downA && !p.ok)) setStatus(p.target, p.ok ? "✓ served" : "✗ failed", p.ok ? "var(--api)" : "var(--server)");
        else setStatus(p.target, "✗ down", "var(--server)");
        say(p.note); setTimeout(() => setStatus(p.target, p.target === "A" && downA ? "down" : "idle"), 700); return false;
      }
      let x, y; const ty = IY[p.target];
      if (u < .45) { x = 140 + (250 - 140) * (u / .45); y = 160; }
      else { const v = (u - .45) / .55; x = 390 + (560 - 390) * v; y = 160 + (ty - 160) * ease(v); }
      const w = p.label.length * 7 + 18;
      svg += `<g transform="translate(${x},${y})"><circle r="7" fill="${p.ok ? "var(--wire)" : "var(--server)"}"/><rect x="${-w / 2}" y="-34" width="${w}" height="22" rx="11" fill="var(--ink)"/><text y="-19" text-anchor="middle" class="t-m" fill="var(--surface)" style="font-size:12px">${esc(p.label)}</text></g>`;
      return true;
    });
    $("#slP", host).innerHTML = svg;
    raf = requestAnimationFrame(frame);
  }
  function start() { stop(); timer = setInterval(send, 1300); send(); raf = requestAnimationFrame(frame); }
  function stop() { clearInterval(timer); cancelAnimationFrame(raf); }
  fig.addEventListener("click", e => {
    const b = e.target.closest("[data-sl]");
    if (b) { mode = b.dataset.sl; session = null; rr = 0; log = []; $$("[data-sl]", fig).forEach(x => x.setAttribute("aria-pressed", x === b)); refresh(); }
    if (e.target.id === "slDown") { downA = !downA; ["A"].forEach(k => setStatus(k, downA ? "down" : "idle")); refresh(); }
  });
  if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? start() : stop())).observe(host);
  refresh(); say("Watching requests…");
};

/* ---------- quiz ---------- */
W.quiz = host => {
  const Q = [
    ["In MCP, which component talks to the LLM?", ["The MCP server", "The host", "The MCP client", "The external API"], 1, "The host owns the conversation and the model. Servers only expose capabilities."],
    ["A host is connected to 4 servers. How many MCP clients does it run?", ["1", "2", "4", "It depends on the LLM"], 2, "One client per server."],
    ["Which primitive is mainly controlled by the model?", ["Prompts", "Resources", "Tools", "Roots"], 2, "Tools are model-controlled; resources are app-controlled; prompts are user-controlled."],
    ["What replaced the initialize handshake in the 2026-07-28 spec?", ["A WebSocket session", "Per-request _meta (plus optional server/discover)", "OAuth tokens", "Nothing; it still exists"], 1, "Every request carries protocolVersion, clientInfo and clientCapabilities in _meta."],
    ["A tool ran but the city wasn't found. How should the server report it?", ["JSON-RPC error -32601", "A result with isError: true and a helpful message", "Close the connection", "Return an empty result"], 1, "Tool execution errors go in the result so the LLM can read them and self-correct."],
    ["Your stdio server prints debug text with print(). What happens?", ["Nothing special", "It shows in the host's chat", "It can corrupt the protocol stream on stdout", "The LLM reads it as context"], 2, "stdout is the message channel for stdio. Log to stderr."]
  ];
  let score = 0, answered = 0;
  host.innerHTML = `<div class="quiz">${Q.map((q, i) => `<div class="q" data-q="${i}"><p>${i + 1}. ${esc(q[0])}</p><div class="opts">${q[1].map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join("")}</div><div class="why" hidden></div></div>`).join("")}</div><p class="score" id="qScore" aria-live="polite"></p>`;
  host.addEventListener("click", e => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    const box = b.closest(".q"); if (box.dataset.done) return;
    const q = Q[+box.dataset.q], k = +b.dataset.k; box.dataset.done = 1; answered++;
    $$("button", box).forEach((x, j) => { if (j === q[2]) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
    if (k === q[2]) score++;
    const why = $(".why", box); why.hidden = false; why.textContent = (k === q[2] ? "Correct. " : "Not quite. ") + q[3];
    $("#qScore", host).textContent = `Score: ${score} / ${answered}` + (answered === Q.length ? (score === Q.length ? " · Perfect!" : " · Review the sections above and try again later.") : "");
  });
};

/* =====================================================================
   END-TO-END FLOW PLAYER
   ===================================================================== */
const C = { user: "#94a3b8", host: "#8b85ff", client: "#2dd4bf", server: "#fb923c", llm: "#e879f9", api: "#4ade80", wire: "#fbbf24", ink: "#e6ebf5", muted: "#9aa4ba", line: "#263048", box: "#111829" };
const BOX = {
  user: [20, 260, 110, 180], host: [160, 80, 450, 540], chat: [180, 140, 245, 460], hlog: [440, 140, 155, 200],
  client: [440, 380, 155, 220], llm: [690, 90, 200, 160], server: [930, 340, 160, 260], api: [1135, 385, 130, 170]
};
const ROUTES = {
  "u>c": ["M130 350 L180 350", "user", "chat"],
  "h>l": ["M595 190 C640 190 650 150 690 150", "hlog", "llm"],
  "l>h": ["M690 215 C650 215 640 280 595 280", "llm", "hlog"],
  "h>cl": ["M500 340 L500 380", "hlog", "client"],
  "cl>h": ["M540 380 L540 340", "client", "hlog"],
  "cl>s": ["M595 465 L930 465", "client", "server"],
  "s>cl": ["M930 525 L595 525", "server", "client"],
  "s>a": ["M1090 440 L1135 440", "server", "api"],
  "a>s": ["M1135 515 L1090 515", "api", "server"],
  "h>c": ["M440 300 L425 300", "hlog", "chat"]
};
const J = (v, ind = "") => {
  const flat = JSON.stringify(v);
  if (flat.length + ind.length <= 46 || v === null || typeof v !== "object") return flat.replace(/,"/g, ', "').replace(/":/g, '": ').replace(/,(?=[\d\[{])/g, ", ");
  const n = ind + "  ";
  if (Array.isArray(v)) return "[\n" + v.map(x => n + J(x, n)).join(",\n") + "\n" + ind + "]";
  return "{\n" + Object.entries(v).map(([k, x]) => n + JSON.stringify(k) + ": " + J(x, n)).join(",\n") + "\n" + ind + "}";
};
const META = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientInfo": { name: "chat-app", version: "2.1" }, "io.modelcontextprotocol/clientCapabilities": { elicitation: {} } };
const P = {
  config: J({ mcpServers: { weather: { command: "uv", args: ["--directory", "~/weather-mcp", "run", "server.py"] } } }),
  discReq: J({ jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: META } }),
  discRes: J({ jsonrpc: "2.0", id: 1, result: { resultType: "complete", supportedVersions: ["2026-07-28"], capabilities: { tools: { listChanged: true }, resources: {}, prompts: {} } } }),
  listReq: J({ jsonrpc: "2.0", id: 2, method: "tools/list", params: { _meta: "{…}" } }),
  listRes: J({ jsonrpc: "2.0", id: 2, result: { resultType: "complete", tools: [{ name: "get_weather", description: "Current temperature and wind for a city", inputSchema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } }], ttlMs: 300000 } }),
  llmReq: J({ messages: [{ role: "user", content: "What's the weather in Delhi right now?" }], tools: [{ name: "get_weather", description: "Current temperature and wind…", input_schema: { "…": "from tools/list" } }] }),
  toolUse: J({ type: "tool_use", id: "tu_01", name: "get_weather", input: { city: "Delhi" } }),
  http: `POST /mcp HTTP/1.1\nMCP-Protocol-Version: 2026-07-28\nMcp-Method: tools/call\nMcp-Name: get_weather\n` + J({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_weather", arguments: { city: "Delhi" }, _meta: "{…}" } }),
  api: `GET /v1/search?name=Delhi\n  → lat 28.65, lon 77.23\n\nGET /v1/forecast?latitude=28.65\n  &longitude=77.23\n  &current=temperature_2m,wind_speed_10m\n\n← 200 OK\n{ "current": {\n    "temperature_2m": 31.4,\n    "wind_speed_10m": 9.2 } }`,
  result: J({ jsonrpc: "2.0", id: 3, result: { resultType: "complete", content: [{ type: "text", text: "Delhi: 31.4 °C, wind 9.2 km/h" }], structuredContent: { city: "Delhi", temperature_c: 31.4, wind_kmh: 9.2 }, isError: false } }),
  toolRes: J({ type: "tool_result", tool_use_id: "tu_01", content: "Delhi: 31.4 °C, wind 9.2 km/h" })
};
const SCENES = [
  { id: "intro", short: "Intro", d: 5, cap: "One question, one tool call. Follow every message from the user to a weather API and back." },
  { id: "config", short: "Configure", d: 7, title: "Configure", glow: ["host", "client"], cap: "The <b>host</b> reads its MCP config and creates <b>one client per server</b>. Here there is one server: <b>weather</b>.",
    pay: [[0.3, "claude_desktop_config.json", P.config]], st: [[0.4, "hlog", "Reading MCP config…"], [2.2, "client", "Created for <b>weather</b>"], [3.4, "hlog", "1 server configured"], [3.4, "server", "Started by host (stdio / HTTP)"]] },
  { id: "discover", short: "Discover", d: 7, title: "Discover", cap: "The client asks what the server supports. Every request carries <b>_meta</b>: protocol version, client info and capabilities.",
    pk: [["cl>s", 0.6, 2.2, "server/discover"], ["s>cl", 3.6, 5.2, "capabilities"]], pay: [[0.4, "Request → server", P.discReq], [3.4, "Response ← server", P.discRes]],
    st: [[2.2, "server", "Supports <b>2026-07-28</b><br>tools · resources · prompts"], [5.2, "client", "Server speaks 2026-07-28 ✓"]] },
  { id: "list", short: "List tools", d: 7, title: "List tools", cap: "<b>tools/list</b> returns each tool's name, description and input schema. The host can cache it for <b>ttlMs</b>.",
    pk: [["cl>s", 0.5, 2.1, "tools/list"], ["s>cl", 3.3, 4.9, "1 tool: get_weather"], ["cl>h", 5.1, 5.7, "tool catalog"]], pay: [[0.4, "Request → server", P.listReq], [3.2, "Response ← server", P.listRes]],
    st: [[5.7, "hlog", "Tools available:<br><b>get_weather</b> (cached 5 min)"], [2.1, "server", "Tools: <b>get_weather</b>"]] },
  { id: "ask", short: "Ask", d: 5, title: "User asks", glow: ["user"], cap: "The user asks a question in the host app. So far nothing has needed MCP.",
    pk: [["u>c", 0.4, 1.3, "types…"]], chat: [[1.3, "u", "What's the weather in Delhi right now?"]], pay: [[0, "", ""]] },
  { id: "prompt", short: "Prompt LLM", d: 7, title: "Send to the LLM", cap: "The host sends the conversation <b>and the tool definitions</b> to the LLM. Now the model knows get_weather exists.",
    pk: [["h>l", 0.6, 2.4, "prompt + tools"]], pay: [[0.4, "Host → LLM API", P.llmReq]], st: [[0.4, "hlog", "Calling the model…"], [2.4, "llm", "Reading prompt + 1 tool"]] },
  { id: "decide", short: "Decide", d: 6, title: "LLM picks a tool", cap: "Instead of guessing, the LLM <b>asks for a tool call</b>: get_weather with {\"city\": \"Delhi\"}. It cannot run it itself.",
    pk: [["l>h", 2.2, 3.8, "tool_use: get_weather"]], pay: [[3.4, "LLM → host", P.toolUse]], st: [[0.2, "llm", "Thinking… needs live data"], [2.2, "llm", "Requests <b>get_weather</b>"], [3.8, "hlog", "Model wants <b>get_weather</b>"]] },
  { id: "approve", short: "Approve", d: 6, title: "Human in the loop", glow: ["user", "chat"], cap: "The host shows the tool call and asks the user first. Sensitive actions should always be confirmable.",
    chat: [[0.5, "ap", "Allow <b>weather · get_weather</b><br><code>{\"city\": \"Delhi\"}</code>", 3.0]], pk: [["u>c", 2.1, 3.0, "Allow"]], st: [[0.5, "hlog", "Waiting for approval…"], [3.2, "hlog", "Approved ✓"]] },
  { id: "call", short: "tools/call", d: 8, title: "Call the tool", cap: "The client sends <b>tools/call</b>. Over HTTP, headers name the method and tool so gateways can route it.",
    pk: [["h>cl", 0.3, 1.0, "run get_weather"], ["cl>s", 1.3, 3.6, "tools/call · get_weather"]], pay: [[1.1, "Client → server (Streamable HTTP)", P.http]], st: [[1.0, "client", "Sending <b>tools/call</b>"], [3.6, "server", "Received <b>get_weather</b>"]] },
  { id: "exec", short: "Execute", d: 7, title: "Server does the work", glow: ["server", "api"], cap: "The server validates the input and calls the real weather API. What happens inside the server is up to you.",
    pk: [["s>a", 0.6, 1.8, "GET forecast"], ["a>s", 3.4, 4.6, "200 OK · 31.4 °C"]], pay: [[0.5, "Server → weather API", P.api]], st: [[0.5, "server", "Running <b>get_weather</b>…"], [1.8, "api", "Looking up Delhi"], [4.6, "server", "Got data ✓"], [4.6, "api", "Responded"]] },
  { id: "result", short: "Result", d: 7, title: "Return the result", cap: "The server returns <b>content</b> (text for the model) plus <b>structuredContent</b> (JSON for code).",
    pk: [["s>cl", 0.5, 2.6, "result · complete"], ["cl>h", 3.0, 3.7, "tool result"]], pay: [[0.4, "Server → client", P.result]], st: [[2.6, "client", "Result received ✓"], [3.7, "hlog", "Have weather data"]] },
  { id: "answer", short: "Answer", d: 8, title: "Final answer", cap: "The LLM turns the data into an answer. <b>Done:</b> two model calls and one MCP tool call.",
    pk: [["h>l", 0.4, 1.8, "tool_result"], ["l>h", 3.2, 4.4, "final text"], ["h>c", 4.5, 4.9, ""]], pay: [[0.3, "Host → LLM API", P.toolRes]],
    chat: [[4.9, "a", "It's about <b>31 °C</b> in Delhi right now, with a light wind of 9 km/h."]], st: [[1.8, "llm", "Writing the answer…"], [4.4, "llm", "Done"], [4.9, "hlog", "Reply shown ✓"]] },
  { id: "recap", short: "Recap", d: 7 }
];
let TOTAL = 0;
SCENES.forEach(s => { s.start = TOTAL; TOTAL += s.d; });
const STEP_SCENES = SCENES.filter(s => s.title);
/* flatten timed events to absolute time */
const EV = { st: [], chat: [], pay: [] };
SCENES.forEach(s => {
  (s.st || []).forEach(([t, a, h]) => EV.st.push({ at: s.start + t, a, h }));
  (s.chat || []).forEach(([t, k, h, hit]) => EV.chat.push({ at: s.start + t, k, h, hit: hit != null ? s.start + hit : null }));
  (s.pay || []).forEach(([t, ti, code]) => EV.pay.push({ at: s.start + t, ti, code }));
});
const DEFAULT_ST = { hlog: "Idle", client: "Not created yet", server: "Waiting", llm: "Idle", api: "", user: "" };

const stage = $("#stage");
let routeEls = {}, dyn = {};
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function fo(x, y, w, h, cls, parent) { const f = el("foreignObject", { x, y, width: w, height: h }, parent); const d = document.createElement("div"); d.className = "fo " + (cls || ""); d.style.width = "100%"; d.style.height = "100%"; f.appendChild(d); return d; }

function buildStage() {
  stage.innerHTML = "";
  el("rect", { x: 0, y: 0, width: 1280, height: 720, fill: "#070a13" }, stage);
  // grid dots
  const pat = el("pattern", { id: "dots", width: 32, height: 32, patternUnits: "userSpaceOnUse" }, el("defs", {}, stage));
  el("circle", { cx: 2, cy: 2, r: 1.2, fill: "#1a2238" }, pat);
  el("rect", { x: 0, y: 0, width: 1280, height: 720, fill: "url(#dots)" }, stage);
  // header
  dyn.step = el("text", { x: 30, y: 46, fill: C.wire, style: "font:700 15px var(--font-mono);letter-spacing:.06em" }, stage);
  dyn.title = el("text", { x: 30, y: 46, fill: C.ink, style: "font:800 26px var(--font-display)" }, stage);
  // lane
  el("rect", { x: 595, y: 440, width: 335, height: 110, rx: 14, fill: "#0e1424", stroke: C.line }, stage);
  el("text", { x: 762, y: 570, "text-anchor": "middle", fill: C.muted, style: "font:12px var(--font-mono)" }, stage).textContent = "JSON-RPC 2.0 · stdio or Streamable HTTP";
  // actors
  const actors = [
    ["user", "User", "", C.user], ["host", "Host · AI app", "e.g. Claude Desktop", C.host], ["chat", "Chat", "", C.host], ["hlog", "Host logic", "", C.host],
    ["client", "MCP client", "1 per server", C.client], ["llm", "LLM", "model API", C.llm], ["server", "MCP server", "weather", C.server], ["api", "Weather API", "open-meteo", C.api]
  ];
  dyn.act = {};
  actors.forEach(([id, lab, sub, col]) => {
    const [x, y, w, h] = BOX[id];
    const g = el("g", { class: "act", "data-a": id }, stage);
    const r = el("rect", { class: "box", x, y, width: w, height: h, rx: id === "host" ? 18 : 12, stroke: col }, g);
    if (id === "host") r.setAttribute("fill", "#0c1220");
    if (id === "chat" || id === "hlog") { r.setAttribute("stroke-opacity", ".55"); }
    el("text", { class: "lab", x: x + 14, y: y + 28, fill: col }, g).textContent = lab;
    if (sub) el("text", { class: "sub", x: x + 14, y: y + 47 }, g).textContent = sub;
    dyn.act[id] = { g, r, col };
  });
  // user icon
  el("circle", { cx: 75, cy: 335, r: 22, fill: "none", stroke: C.user, "stroke-width": 3 }, stage);
  el("path", { d: "M40 410 C40 375 110 375 110 410", fill: "none", stroke: C.user, "stroke-width": 3 }, stage);
  // llm icon (sparkle) and api icon
  el("path", { d: "M852 104 l5 14 14 5 -14 5 -5 14 -5 -14 -14 -5 14 -5z", fill: C.llm, opacity: .9 }, stage);
  el("path", { d: "M1172 470 a22 22 0 1 1 44 0 a16 16 0 0 1 -4 31 h-38 a16 16 0 0 1 -2 -31z", fill: "none", stroke: C.api, "stroke-width": 3 }, stage);
  // status boxes
  dyn.stat = {};
  [["hlog", 454, 196, 130, 130], ["client", 454, 435, 130, 150], ["llm", 704, 205, 175, 40], ["server", 944, 395, 135, 190], ["api", 1145, 515, 112, 36]].forEach(([id, x, y, w, h]) => { dyn.stat[id] = fo(x, y, w, h, "status", stage); });
  dyn.chat = fo(192, 180, 222, 410, "", stage);
  // payload
  el("rect", { x: 930, y: 80, width: 330, height: 245, rx: 12, fill: "#0b1020", stroke: C.line }, stage);
  dyn.pay = fo(944, 90, 306, 228, "", stage);
  // routes (invisible) + packets layer
  const rg = el("g", { opacity: 0 }, stage);
  routeEls = {};
  for (const k in ROUTES) routeEls[k] = el("path", { d: ROUTES[k][0], fill: "none", stroke: "#fff" }, rg);
  dyn.trails = el("g", {}, stage);
  dyn.packets = el("g", {}, stage);
  // caption + overlay
  el("rect", { x: 30, y: 635, width: 1220, height: 70, rx: 14, fill: "#0b1020", stroke: C.line }, stage);
  dyn.cap = fo(50, 643, 1180, 56, "", stage);
  dyn.cap.style.display = "flex"; dyn.cap.style.alignItems = "center"; dyn.cap.style.justifyContent = "center";
  dyn.ovWrap = el("g", {}, stage);
  dyn.ov = fo(190, 150, 900, 400, "", dyn.ovWrap);
}

function last(list, T, pred) { let r = null; for (const e of list) { if (e.at <= T && (!pred || pred(e))) r = e; } return r; }
const cache = {};
function setHTML(node, key, html) { if (cache[key] !== html) { node.innerHTML = html; cache[key] = html; } }

function sceneAt(T) { for (let i = SCENES.length - 1; i >= 0; i--) if (T >= SCENES[i].start) return SCENES[i]; return SCENES[0]; }

function render(T) {
  T = clamp(T, 0, TOTAL - 0.001);
  const sc = sceneAt(T), lt = T - sc.start;
  // header
  const stepIdx = STEP_SCENES.indexOf(sc);
  if (sc.title) {
    dyn.step.textContent = `STEP ${stepIdx + 1} / ${STEP_SCENES.length}`;
    dyn.title.textContent = sc.title; dyn.title.setAttribute("x", 30 + dyn.step.getComputedTextLength() + 16);
  } else { dyn.step.textContent = sc.id === "intro" ? "MCP · END TO END" : "RECAP"; dyn.title.textContent = ""; }
  // packets + glow
  const glow = new Set(sc.glow || []);
  let pk = "";
  (sc.pk || []).forEach(([r, t0, t1, label]) => {
    const [, from, to] = ROUTES[r];
    if (lt >= t0 - .05 && lt <= t1) glow.add(from);
    if (lt >= t1 && lt <= t1 + 1.0) glow.add(to);
    if (lt < t0 || lt > t1 + 0.35) return;
    const path = routeEls[r], L = path.getTotalLength(), u = ease(clamp((lt - t0) / (t1 - t0)));
    const p = path.getPointAtLength(L * u), p0 = path.getPointAtLength(0);
    const fade = lt > t1 ? 1 - (lt - t1) / 0.35 : 1;
    pk += `<path d="${ROUTES[r][0]}" stroke="${C.wire}" stroke-width="3" fill="none" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - u)}" opacity="${0.55 * fade}"/>`;
    pk += `<circle cx="${p.x}" cy="${p.y}" r="8" fill="${C.wire}" opacity="${fade}"/><circle cx="${p.x}" cy="${p.y}" r="14" fill="${C.wire}" opacity="${0.25 * fade}"/>`;
    if (label) {
      const w = label.length * 7.4 + 22; let x = clamp(p.x - w / 2, 8, 1272 - w); const y = p.y - 44;
      pk += `<g opacity="${fade}"><rect x="${x}" y="${y}" width="${w}" height="26" rx="13" fill="${C.wire}"/><text x="${x + w / 2}" y="${y + 17.5}" text-anchor="middle" fill="#1b1300" style="font:700 12.5px var(--font-mono)">${esc(label)}</text></g>`;
    }
  });
  dyn.packets.innerHTML = pk;
  if (sc.id === "recap") ["user", "host", "client", "server", "llm", "api"].forEach(a => glow.add(a));
  // actors
  const introA = ["user", "host", "chat", "hlog", "client", "llm", "server", "api"];
  for (const id in dyn.act) {
    const a = dyn.act[id], on = glow.has(id);
    let op = 1;
    if (sc.id === "intro") op = clamp((T - 0.3 - introA.indexOf(id) * 0.25) / 0.4);
    if (id === "client" && T < SCENES[1].start + 2.2) op = Math.min(op, 0.3);
    a.g.style.opacity = op;
    a.r.setAttribute("stroke-width", on ? 4 : 2.5);
    a.g.style.filter = on ? `drop-shadow(0 0 12px ${a.col})` : "none";
  }
  // statuses
  for (const id in dyn.stat) {
    const e = last(EV.st, T, x => x.a === id);
    setHTML(dyn.stat[id], "st" + id, e ? e.h : (DEFAULT_ST[id] ? `<span style="color:#6b7590">${DEFAULT_ST[id]}</span>` : ""));
  }
  // chat
  const msgs = EV.chat.filter(m => m.at <= T).map(m => {
    if (m.k === "ap") { const hit = m.hit != null && T >= m.hit; return `<div class="bubble ap">${m.h}<br>${hit ? '<span class="allow hit">✓ Allowed</span>' : '<span class="allow">Allow</span>  <span style="opacity:.7;font-size:12.5px">Deny</span>'}</div>`; }
    return `<div class="bubble ${m.k}">${m.h}</div>`;
  }).join("");
  setHTML(dyn.chat, "chat", msgs);
  // payload
  const p = last(EV.pay, T);
  setHTML(dyn.pay, "pay", p && p.code ? `<div class="ptitle">${esc(p.ti)}</div><div class="payload">${esc(p.code)}</div>` : `<div class="ptitle">On the wire</div><div class="payload" style="color:#6b7590">messages appear here</div>`);
  // caption
  if (sc.cap) { setHTML(dyn.cap, "cap", `<div class="cap">${sc.cap}</div>`); dyn.cap.style.opacity = clamp(lt / 0.4); }
  else { setHTML(dyn.cap, "cap", `<div class="cap">Host · client · server: one protocol, any tool.</div>`); dyn.cap.style.opacity = 1; }
  // overlay
  let ovHTML = "", ovOp = 0;
  if (sc.id === "intro") { ovOp = 1 - clamp((lt - 3.9) / 0.7); ovHTML = `<div class="overlay"><h3>How an MCP tool call works</h3><p>The user asks: <b style="color:#e6ebf5">“What's the weather in Delhi right now?”</b></p><p style="margin-top:14px">Watch the <b style="color:#fbbf24">yellow packets</b>: each one is a real message. The panel at the top right shows its contents.</p><p style="margin-top:14px;font-size:15px">Spec 2026-07-28 · example data</p></div>`; }
  if (sc.id === "recap") { ovOp = clamp(lt / 0.5); ovHTML = `<div class="overlay"><h3>Recap</h3><ol><li>Host creates a client per server</li><li><code>server/discover</code>: capabilities</li><li><code>tools/list</code>: what tools exist</li><li>User asks a question</li><li>Host sends prompt + tools to the LLM</li><li>LLM requests a tool call</li><li>User approves</li><li><code>tools/call</code> to the server</li><li>Server calls the real API</li><li>Result back to the host</li><li>LLM writes the final answer</li></ol></div>`; }
  setHTML(dyn.ov, "ov", ovHTML); dyn.ovWrap.style.opacity = ovOp; dyn.ovWrap.style.display = ovOp > 0.01 ? "" : "none";
  return sc;
}

/* ---------- player UI ---------- */
buildStage();
let T = 0, playing = false, lastNow = 0, speed = 1;
const seek = $("#pSeek"), playB = $("#pPlay"), timeL = $("#pTime"), scenesB = $("#pScenes");
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
scenesB.innerHTML = SCENES.map((s, i) => `<button type="button" data-s="${i}">${i && s.title ? STEP_SCENES.indexOf(s) + 1 + ". " : ""}${s.short}</button>`).join("");
function show() {
  const sc = render(T);
  seek.value = Math.round(T / TOTAL * 1000);
  timeL.textContent = `${fmt(T)} / ${fmt(TOTAL)}`;
  $$("button", scenesB).forEach((b, i) => b.classList.toggle("on", SCENES[i] === sc));
}
function tick(now) {
  if (!playing) return;
  T += (now - lastNow) / 1000 * speed; lastNow = now;
  if (T >= TOTAL) { T = TOTAL - 0.001; playing = false; playB.textContent = "↻ Replay"; }
  show();
  if (playing) requestAnimationFrame(tick);
}
function play() { if (T >= TOTAL - 0.01) T = 0; playing = true; playB.textContent = "❚❚ Pause"; lastNow = performance.now(); requestAnimationFrame(tick); }
function pause() { playing = false; playB.textContent = "▶ Play"; }
playB.addEventListener("click", () => playing ? pause() : play());
seek.addEventListener("input", () => { T = seek.value / 1000 * TOTAL; show(); });
$("#pSpeed").addEventListener("change", e => { speed = +e.target.value; });
scenesB.addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b) return; T = SCENES[+b.dataset.s].start + 0.01; show(); if (!playing) play(); });
$("#pFull").addEventListener("click", () => { const p = $("#player"); try { document.fullscreenElement ? document.exitFullscreen() : p.requestFullscreen(); } catch (e) {} });
T = 1.2; show();   // a meaningful first frame: the intro card

if (FILM) {
  document.body.classList.add("film");
  window.__flow = { scenes: SCENES.map(s => [s.start, s.d]), duration: TOTAL, renderAt: t => { render(t); return true; } };
} else {
  $$(".widget").forEach(w => { const f = W[w.dataset.w]; if (f) f(w); });
}
})();
