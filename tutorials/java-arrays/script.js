/* Inside Java Arrays — interactive diagrams and widgets */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ADDR = ['@3f2a','@7c11','@1b6d','@4e25','@6d06','@2a13','@5ce8','@19e0'];
const isRef = v => v !== null && typeof v === 'object';

function hl(line) {
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(String|Object|Integer|char|int|long|double|boolean|byte|new|final|static|void|for|while|if|else|break|return|null|true|false)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    out += `<span class="${m[1] ? 'c' : m[2] ? 's' : 'k'}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last)) || ' ';
}

/* ---------- heap map ---------- */
function replay(steps, upto) {
  const objs = [], vars = [];
  for (let k = 0; k <= upto; k++) {
    const s = steps[k];
    (s.obj || []).forEach(o => objs.push({ ...o, c: o.c ? o.c.slice() : null, addr: ADDR[objs.length % ADDR.length] }));
    Object.entries(s.v || {}).forEach(([n, r]) => { const f = vars.find(x => x.name === n); f ? f.ref = r : vars.push({ name: n, ref: r }); });
    (s.del || []).forEach(n => { const ix = vars.findIndex(x => x.name === n); if (ix >= 0) vars.splice(ix, 1); });
    Object.entries(s.set || {}).forEach(([key, val]) => { const [id, ix] = key.split(':'); objs.find(x => x.id === id).c[+ix] = val; });
  }
  return { objs, vars };
}
function renderArr(stage, cfg, i, animate) {
  const W = Math.max(280, stage.clientWidth - 24);
  const steps = cfg.steps, all = replay(steps, steps.length - 1), st = replay(steps, i);
  const prev = animate && i > 0 ? replay(steps, i - 1) : null;
  const step = steps[i];
  const order = []; steps.forEach(s => Object.keys(s.v || {}).forEach(n => order.includes(n) || order.push(n)));
  const sw = Math.min(140, Math.max(84, W * .22)), gap = Math.max(30, W * .08), hx = sw + gap, hw = W - hx;
  const ox = hx + 12, inner = hw - 24;
  const two = all.objs.some(o => o.col);
  const cg = two ? Math.max(30, inner * .1) : 0, colW = two ? (inner - cg) / 2 : inner;
  const colX = [ox, ox + colW + cg];
  const PITCH = 62, LBL = 13, BOX = 28;
  const pos = {}, cy = [30, 30];
  all.objs.forEach(o => { const c = o.col ? 1 : 0; pos[o.id] = { x: colX[c], y: cy[c] }; cy[c] += PITCH; });
  const H = Math.max(28 + order.length * 44, cy[0], cy[1]) + 2;
  const cwOf = o => Math.max(18, Math.min(40, Math.floor(colW / Math.max(1, o.c.length))));
  const wOf = o => o.c ? cwOf(o) * o.c.length : Math.min(colW, o.s.length * 7.6 + 18);
  const byId = Object.fromEntries(st.objs.map(o => [o.id, o]));
  const live = new Set(), q = st.vars.map(v => v.ref).filter(r => typeof r === 'string' && byId[r]);
  while (q.length) { const id = q.pop(); if (live.has(id)) continue; live.add(id); (byId[id].c || []).forEach(v => isRef(v) && byId[v.r] && q.push(v.r)); }
  const hot = new Set([...(step.obj || []).map(o => o.id), ...Object.keys(step.set || {}), ...(step.hot || [])]);
  const hotVars = new Set(Object.keys(step.v || {}));
  const prevCell = (id, k) => { const o = prev && prev.objs.find(p => p.id === id); return o ? o.c[k] : undefined; };

  const arrows = [];
  st.vars.forEach(v => { if (typeof v.ref === 'string' && byId[v.ref]) arrows.push({ v, to: v.ref }); });
  st.objs.forEach(o => (o.c || []).forEach((val, k) => { if (isRef(val) && byId[val.r]) arrows.push({ o, k, to: val.r }); }));
  const inc = {}; arrows.forEach(a => (inc[a.to] = inc[a.to] || []).push(a));

  const label = st.vars.map(v => v.name + ' points to ' + (byId[v.ref] ? byId[v.ref].t + ' ' + (byId[v.ref].c ? '{' + byId[v.ref].c.map(x => isRef(x) ? 'ref' : String(x)).join(', ') + '}' : byId[v.ref].s) : 'null')).join('; ');
  let s = `<svg viewBox="0 0 ${W} ${H + 1}" width="${W}" height="${H + 1}" role="img" aria-label="Memory map: ${esc(label)}">`;
  s += `<rect class="zone z-stack" x=".75" y=".75" width="${sw - 1.5}" height="${H - .5}" rx="8"/><text class="zl stack" x="10" y="19">STACK</text>`;
  s += `<rect class="zone z-heap" x="${hx}" y=".75" width="${hw - .75}" height="${H - .5}" rx="8"/><text class="zl heap" x="${hx + 10}" y="19">HEAP</text>`;

  arrows.forEach(a => {
    const list = inc[a.to], off = Math.max(-10, Math.min(10, (list.indexOf(a) - (list.length - 1) / 2) * 7));
    const tp = pos[a.to], tx = tp.x - 2, ty = tp.y + LBL + BOX / 2 + off;
    let d, cls, fresh;
    if (a.v) {
      const x1 = sw - 20, y1 = 28 + order.indexOf(a.v.name) * 44 + 17, dx = Math.max(24, (tx - x1) * .5);
      d = `M${x1} ${y1}C${x1 + dx} ${y1} ${tx - dx} ${ty} ${tx - 7} ${ty}`;
      const p = prev && prev.vars.find(x => x.name === a.v.name);
      fresh = prev && (!p || p.ref !== a.v.ref);
      cls = hotVars.has(a.v.name) ? 'isHot' : '';
    } else {
      const p = pos[a.o.id], cw = cwOf(a.o), sx = p.x + cw * a.k + cw / 2, sy = p.y + LBL + BOX / 2;
      d = `M${sx} ${sy}C${sx} ${sy + 42} ${tx - 36} ${ty} ${tx - 7} ${ty}`;
      const pv = prevCell(a.o.id, a.k);
      fresh = prev && !(isRef(pv) && pv.r === a.to);
      cls = 'c ' + (!live.has(a.o.id) ? 'gw' : hot.has(a.o.id + ':' + a.k) ? 'isHot' : '');
    }
    const en = fresh ? 'enter' : '';
    s += `<path class="wire ${cls} ${en}" pathLength="1" d="${d}"/><path class="head ${cls} ${en}" d="M${tx} ${ty}l-9 -4.5v9z"/>`;
  });

  st.objs.forEach(o => {
    const p = pos[o.id], gone = !live.has(o.id), isNew = prev && !prev.objs.find(x => x.id === o.id);
    const showAddr = wOf(o) + 0 < colW && colW > 120;
    s += `<g class="${isNew ? 'enter' : ''} ${gone ? 'gone' : ''}"><text class="lab" x="${p.x}" y="${p.y + 9}">${esc(o.t + (showAddr || !two ? '  ' + (gone ? 'garbage' : o.addr) : gone ? '  garbage' : ''))}</text>`;
    if (o.c) {
      const cw = cwOf(o);
      o.c.forEach((v, k) => {
        const x = p.x + k * cw, y = p.y + LBL, hc = hot.has(o.id) || hot.has(o.id + ':' + k);
        const pv = prevCell(o.id, k), changed = prev && !isNew && pv !== undefined && JSON.stringify(pv) !== JSON.stringify(v);
        s += `<rect class="cellA ${hc && !gone ? 'hc' : ''}" x="${x}" y="${y}" width="${cw}" height="${BOX}"/>`;
        if (isRef(v)) s += `<circle class="cdot" cx="${x + cw / 2}" cy="${y + BOX / 2}" r="3.5"/>`;
        else s += `<text class="tc ${v === null ? 'nul' : ''} ${changed ? 'flash' : ''}" text-anchor="middle" x="${x + cw / 2}" y="${y + 18}">${esc(v === null ? 'null' : v)}</text>`;
        s += `<text class="ix" text-anchor="middle" x="${x + cw / 2}" y="${y + BOX + 10}">${k}</text>`;
      });
    } else {
      s += `<rect class="sbox ${hot.has(o.id) && !gone ? 'hc' : ''}" x="${p.x}" y="${p.y + LBL}" width="${wOf(o)}" height="${BOX}" rx="5"/><text class="tx" x="${p.x + 9}" y="${p.y + LBL + 19}">${esc(o.s)}</text>`;
    }
    s += '</g>';
  });

  st.vars.forEach(v => {
    const y = 28 + order.indexOf(v.name) * 44, isNew = prev && !prev.vars.find(x => x.name === v.name);
    s += `<g class="${hotVars.has(v.name) ? 'isHot' : ''} ${isNew ? 'enter' : ''}"><rect class="vbox" x="8" y="${y}" width="${sw - 16}" height="34" rx="5"/><text class="tx" x="18" y="${y + 22}">${esc(v.name)}</text>`;
    s += v.ref === null ? `<text class="tc nul" text-anchor="end" x="${sw - 16}" y="${y + 21}">null</text>` : `<circle class="dot" cx="${sw - 20}" cy="${y + 17}" r="4"/>`;
    s += '</g>';
  });
  stage.innerHTML = s + '</svg>';
}

/* ---------- cells ---------- */
function renderCells(stage, cfg, i) {
  stage.innerHTML = '<div class="rows">' + cfg.steps[i].rows.map(r =>
    `<div><div class="row-l">${esc(r.label)}</div><div class="cells">` +
    r.cells.map((c, k) => `<span class="cl ${c.c || ''} ${c.tk ? 'tag' : ''}"><b>${esc(c.t)}</b><i>${esc(c.tag != null ? c.tag : k)}</i></span>`).join('') +
    '</div></div>').join('') + '</div>';
}

/* ---------- player ---------- */
let playing = null;
function makePlayer(mount, cfg) {
  const id = mount.dataset.scene;
  const fig = document.createElement('figure');
  fig.className = 'fig';
  fig.innerHTML = `<div class="fig-main"><pre class="code" tabindex="0" aria-label="Java code"></pre><div class="stage"></div></div>
    <figcaption class="say" aria-live="polite"></figcaption>
    <div class="ctl"><button class="play" type="button">Play</button><button class="back" type="button">Back</button><button class="next" type="button">Next</button>
    <input type="range" id="r-${id}" min="0" value="0" aria-label="Animation step"><output></output></div>`;
  mount.appendChild(fig);
  const code = $('.code', fig), stage = $('.stage', fig), say = $('.say', fig);
  const btn = $('.play', fig), rng = $('input', fig), out = $('output', fig);
  code.innerHTML = cfg.code.map(l => `<span class="ln">${hl(l)}</span>`).join('');
  const lines = [...code.children];
  let i = 0, timer = null;
  function draw(animate) {
    const s = cfg.steps[i];
    lines.forEach((l, k) => l.classList.toggle('on', k === s.l));
    say.innerHTML = s.say;
    rng.max = cfg.steps.length - 1; rng.value = i;
    out.textContent = `${i + 1} / ${cfg.steps.length}`;
    if (cfg.kind === 'arr') renderArr(stage, cfg, i, animate && !reduced);
    else renderCells(stage, cfg, i);
  }
  const p = {
    stop() { clearInterval(timer); timer = null; btn.textContent = 'Play'; if (playing === p) playing = null; },
    play(from0 = true) {
      if (playing) playing.stop();
      if (from0 && i >= cfg.steps.length - 1) i = 0;
      draw(true); playing = p; btn.textContent = 'Pause';
      timer = setInterval(() => { if (i >= cfg.steps.length - 1) return p.stop(); i++; draw(true); }, cfg.ms || 2600);
    },
    goto(k, animate) { i = Math.max(0, Math.min(cfg.steps.length - 1, k)); draw(animate); },
    setSteps(st) { cfg.steps = st; p.stop(); p.goto(st.length - 1, false); }
  };
  btn.onclick = () => timer ? p.stop() : p.play();
  $('.back', fig).onclick = () => { p.stop(); p.goto(i - 1, false); };
  $('.next', fig).onclick = () => { p.stop(); p.goto(i + 1, true); };
  rng.oninput = () => { p.stop(); p.goto(+rng.value, false); };
  if (cfg.kind === 'arr') {
    let w = 0;
    new ResizeObserver(() => { if (stage.clientWidth !== w) { w = stage.clientWidth; draw(false); } }).observe(stage);
  }
  p.goto(cfg.steps.length - 1, false);
  return p;
}

/* ---------- scenes ---------- */
const R = id => ({ r: id });
const SC = {
hero: { kind:'arr', code:['int[] a = new int[3];','a[0] = 7;','int[] b = a;','b[2] = 9;','a = new int[]{4, 5};'], steps:[
 {l:0,obj:[{id:'h1',t:'int[3]',c:[0,0,0]}],v:{a:'h1'},say:'<code>new int[3]</code> makes one object on the heap with 3 slots, all set to 0. <code>a</code> holds only its address.'},
 {l:1,set:{'h1:0':7},say:'<code>a[0] = 7</code> writes into slot 0 in place. Unlike Strings, arrays can be changed.'},
 {l:2,v:{b:'h1'},say:'Assignment copies the address, not the elements. <code>a</code> and <code>b</code> now share one array.'},
 {l:3,set:{'h1:2':9},say:'A write through <code>b</code> shows up through <code>a</code> too, because there is only one array.'},
 {l:4,obj:[{id:'h2',t:'int[2]',c:[4,5]}],v:{a:'h2'},say:'<code>a</code> moves to a new array. The old one stays alive because <code>b</code> still points at it.'}]},
defaults: { kind:'arr', ms:2200, code:['int[] n = new int[3];','boolean[] f = new boolean[2];','double[] d = new double[2];','char[] c = new char[2];','String[] s = new String[2];'], steps:[
 {l:0,obj:[{id:'d1',t:'int[3]',c:[0,0,0]}],v:{n:'d1'},say:'Integer slots start at <code>0</code>. Java never hands you leftover memory.'},
 {l:1,obj:[{id:'d2',t:'boolean[2]',c:['false','false']}],v:{f:'d2'},say:'<code>boolean</code> slots start at <code>false</code>.'},
 {l:2,obj:[{id:'d3',t:'double[2]',c:['0.0','0.0']}],v:{d:'d3'},say:'<code>double</code> and <code>float</code> slots start at <code>0.0</code>.'},
 {l:3,obj:[{id:'d4',t:'char[2]',c:['\\0','\\0']}],v:{c:'d4'},say:"<code>char</code> slots start at <code>'\\u0000'</code>, the null character, shown here as <code>\\0</code>."},
 {l:4,obj:[{id:'d5',t:'String[2]',c:[null,null]}],v:{s:'d5'},say:'Every reference slot starts at <code>null</code>. No String objects exist yet.'}]},
refs: { kind:'arr', code:['String[] s = new String[3];','s[0] = "hi";','s[1] = "java";','s[2] = s[0];','s[0] = null;'], steps:[
 {l:0,obj:[{id:'r',t:'String[3]',c:[null,null,null]}],v:{s:'r'},say:'The array has 3 reference slots, all <code>null</code>. No Strings exist yet.'},
 {l:1,obj:[{id:'x1',t:'String',s:'"hi"',col:1}],set:{'r:0':R('x1')},say:'Slot 0 now holds the <em>address</em> of a String object. The characters live in that object, not in the array.'},
 {l:2,obj:[{id:'x2',t:'String',s:'"java"',col:1}],set:{'r:1':R('x2')},say:'Slot 1 points at a second String.'},
 {l:3,set:{'r:2':R('x1')},say:'Copying an element copies the address. Slots 0 and 2 now share one String object.'},
 {l:4,set:{'r:0':null},say:'Clearing slot 0 removes only that address. <code>"hi"</code> stays alive because slot 2 still points at it.'}]},
method: { kind:'arr', code:['static void change(int[] x) {','    x[0] = 99;','    x = new int[]{7};','}','int[] a = {1, 2, 3};','change(a);','System.out.println(a[0]);  // 99'], steps:[
 {l:4,obj:[{id:'m1',t:'int[3]',c:[1,2,3]}],v:{a:'m1'},say:'<code>a</code> points at the array.'},
 {l:5,v:{x:'m1'},say:'Calling <code>change(a)</code> copies the value of <code>a</code>, which is an address, into the new parameter <code>x</code>.'},
 {l:1,set:{'m1:0':99},say:'Writing through <code>x</code> changes the one shared array.'},
 {l:2,obj:[{id:'m2',t:'int[1]',c:[7]}],v:{x:'m2'},say:'Reassigning <code>x</code> changes only the method\'s own copy of the address. <code>a</code> is unaffected.'},
 {l:3,del:['x'],say:'<code>change()</code> returns and <code>x</code> disappears with it. The <code>{7}</code> array is now garbage.'},
 {l:6,hot:['m1:0'],say:'Prints <code>99</code>. The element change stuck, but the reassignment didn\'t.'}]},
copy: { kind:'arr', code:['int[] a = {1, 2, 3};','int[] b = a;              // not a copy','int[] c = a.clone();      // a real copy','c[0] = 50;','System.out.println(a[0]);  // 1'], steps:[
 {l:0,obj:[{id:'c1',t:'int[3]',c:[1,2,3]}],v:{a:'c1'},say:'One array.'},
 {l:1,v:{b:'c1'},say:'<code>b = a</code> copies the address. There is still only one array.'},
 {l:2,obj:[{id:'c2',t:'int[3]',c:[1,2,3]}],v:{c:'c2'},say:'<code>clone()</code> allocates a new array and copies every element into it.'},
 {l:3,set:{'c2:0':50},say:'Changing the copy leaves the original alone.'},
 {l:4,hot:['c1:0'],say:'Prints <code>1</code>.'}]},
deep: { kind:'arr', code:['int[][] m = {{1, 2}, {3, 4}};','int[][] s = m.clone();','s[0][0] = 9;          // m[0][0] is 9 too','int[][] d = new int[2][];','d[0] = m[0].clone();','d[1] = m[1].clone();'], steps:[
 {l:0,obj:[{id:'m',t:'int[2][]',c:[R('r0'),R('r1')]},{id:'r0',t:'int[2]',c:[1,2],col:1},{id:'r1',t:'int[2]',c:[3,4],col:1}],v:{m:'m'},say:'A 2D array is an array of arrays. <code>m</code> holds the addresses of two separate row arrays. That is 3 objects.'},
 {l:1,obj:[{id:'s',t:'int[2][]',c:[R('r0'),R('r1')]}],v:{s:'s'},say:'<code>clone()</code> copies only the outer array. The copy holds the same two row addresses. This is a <strong>shallow copy</strong>.'},
 {l:2,set:{'r0:0':9},say:'<code>s[0][0] = 9</code> edits the shared row, so <code>m[0][0]</code> is 9 as well.'},
 {l:3,obj:[{id:'d',t:'int[2][]',c:[null,null]}],v:{d:'d'},say:'For a <strong>deep copy</strong>, start with a new outer array. Its row slots begin as <code>null</code>.'},
 {l:4,obj:[{id:'d0',t:'int[2]',c:[9,2],col:1}],set:{'d:0':R('d0')},say:'Clone row 0 into a brand-new array.'},
 {l:5,obj:[{id:'d1',t:'int[2]',c:[3,4],col:1}],set:{'d:1':R('d1')},say:'Clone row 1 too. Now <code>d</code> shares nothing with <code>m</code>, so editing one can never affect the other.'}]},
jagged: { kind:'arr', code:['int[][] t = new int[3][];','t[0] = new int[1];','t[1] = new int[2];','t[2] = new int[3];','t[2][1] = 5;'], steps:[
 {l:0,obj:[{id:'t',t:'int[3][]',c:[null,null,null]}],v:{t:'t'},say:'Leaving out the second size creates only the outer array. Every row slot is <code>null</code>.'},
 {l:1,obj:[{id:'j0',t:'int[1]',c:[0],col:1}],set:{'t:0':R('j0')},say:'Row 0 gets 1 slot.'},
 {l:2,obj:[{id:'j1',t:'int[2]',c:[0,0],col:1}],set:{'t:1':R('j1')},say:'Row 1 gets 2 slots. Rows don\'t have to be the same length.'},
 {l:3,obj:[{id:'j2',t:'int[3]',c:[0,0,0],col:1}],set:{'t:2':R('j2')},say:'Row 2 gets 3 slots. This triangle shape is a <strong>jagged array</strong>.'},
 {l:4,set:{'j2:1':5},say:'<code>t[2][1]</code> follows two addresses: first to row 2, then to its slot 1.'}]},
eq: { kind:'arr', code:['int[] a = {1, 2};','int[] b = {1, 2};','a == b               // false','a.equals(b)          // false','Arrays.equals(a, b)  // true'], steps:[
 {l:0,obj:[{id:'e1',t:'int[2]',c:[1,2]}],v:{a:'e1'},say:'One array.'},
 {l:1,obj:[{id:'e2',t:'int[2]',c:[1,2]}],v:{b:'e2'},say:'A second array with the same contents.'},
 {l:2,hot:['e1','e2'],say:'<code>false</code>. <code>==</code> compares addresses, and these are two separate objects.'},
 {l:3,hot:['e1','e2'],say:'Also <code>false</code>. Arrays inherit <code>equals()</code> from <code>Object</code>, which just does <code>==</code>.'},
 {l:4,hot:['e1:0','e2:0','e1:1','e2:1'],say:'<code>true</code>. <code>Arrays.equals</code> checks the lengths, then compares the elements one by one.'}]},
covar: { kind:'arr', code:['String[] s = new String[2];','Object[] o = s;       // compiles','o[0] = "ok";','o[1] = 42;            // ArrayStoreException'], steps:[
 {l:0,obj:[{id:'v',t:'String[2]',c:[null,null]}],v:{s:'v'},say:'A <code>String[]</code> object. The array records its element type and keeps it at run time.'},
 {l:1,v:{o:'v'},say:'Arrays are <strong>covariant</strong>: a <code>String[]</code> counts as an <code>Object[]</code>, so this compiles.'},
 {l:2,obj:[{id:'ok',t:'String',s:'"ok"',col:1}],set:{'v:0':R('ok')},say:'Storing a String passes the run-time type check.'},
 {l:3,hot:['v:1'],say:'This compiles because <code>o</code> is an <code>Object[]</code>. At run time the JVM sees an Integer going into a String array and throws <code>ArrayStoreException</code>. The slot stays <code>null</code>.'}]},
};

const bnd = (i, cls) => [{ label: i < 0 ? 'a.length = 3' : `i = ${i}`, cells: [10,20,30].map((v,k) => ({ t:String(v), c:k === i ? cls : '', tag:k === i ? 'i' : String(k), tk:k === i }))
  .concat(i === 3 ? [{ t:'✕', c:'bad', tag:'i', tk:true }] : [{ t:'', c:'ghost', tag:'3' }]) }];
SC.bounds = { kind:'cells', ms:1800, code:['int[] a = {10, 20, 30};','for (int i = 0; i <= a.length; i++) {','    System.out.println(a[i]);','}'], steps:[
 {l:0,say:'<code>a.length</code> is 3, so the valid indexes are 0, 1 and 2.',rows:bnd(-1)},
 {l:2,say:'i = 0. Prints 10.',rows:bnd(0,'ok')},
 {l:2,say:'i = 1. Prints 20.',rows:bnd(1,'ok')},
 {l:2,say:'i = 2. Prints 30.',rows:bnd(2,'ok')},
 {l:1,say:'<code>3 &lt;= 3</code> is true, so the loop runs once more.',rows:bnd(3)},
 {l:2,say:'There is no <code>a[3]</code>. The JVM throws <code>ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3</code>. The fix is <code>i &lt; a.length</code>.',rows:bnd(3)}]};

/* ---------- generated traces ---------- */
const nums = (s, max) => (String(s).match(/-?\d+/g) || []).slice(0, max).map(x => Math.max(-99, Math.min(999, +x)));
const fmtAdd = (a, b) => b < 0 ? `${a} − ${-b}` : `${a} + ${b}`;

function bsSteps(arr, target) {
  const a = [...arr].sort((x, y) => x - y), n = a.length, st = [];
  const row = (lo, hi, mid, cls) => [{ label:`lo = ${lo}, hi = ${hi}` + (mid != null ? `, mid = ${mid}` : ''), cells:a.map((v, k) => ({
    t:String(v), c:k === mid ? cls : (k < lo || k > hi) ? 'dim' : '',
    tag:[k === lo ? 'lo' : '', k === mid ? 'm' : '', k === hi ? 'hi' : ''].filter(Boolean).join(' ') || String(k), tk:k === lo || k === hi || k === mid })) }];
  let lo = 0, hi = n - 1, checks = 0;
  st.push({ l:0, say:`Search for ${target}. <code>lo</code> starts at 0 and <code>hi</code> at ${n - 1}.`, rows:row(lo, hi) });
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1; checks++;
    st.push({ l:2, say:`mid = (${lo} + ${hi}) / 2 = ${mid}. Check a[${mid}], which is ${a[mid]}.`, rows:row(lo, hi, mid, 'on') });
    if (a[mid] === target) { st.push({ l:3, say:`Found ${target} at index ${mid} after ${checks} check${checks > 1 ? 's' : ''}. A linear scan could need up to ${n}.`, rows:row(lo, hi, mid, 'ok') }); return st; }
    if (a[mid] < target) { lo = mid + 1; st.push({ l:4, say:`${a[mid]} &lt; ${target}, so the target can only be to the right. Move lo to ${lo}.`, rows:row(lo, hi) }); }
    else { hi = mid - 1; st.push({ l:5, say:`${a[mid]} &gt; ${target}, so throw away the right half. Move hi to ${hi}.`, rows:row(lo, hi) }); }
  }
  st.push({ l:7, say:`lo has passed hi, so ${target} isn't in the array. Return -1 after ${checks} checks.`, rows:row(lo, hi) });
  return st;
}
function bubbleSteps(arr) {
  const a = arr.slice(), n = a.length, st = [];
  const row = (end, j, cls, p) => [{ label:`pass ${p}`, cells:a.map((v, k) => ({ t:String(v), c:j >= 0 && (k === j || k === j + 1) ? cls : k > end ? 'ok' : '', tag:j >= 0 && k === j ? 'j' : j >= 0 && k === j + 1 ? 'j+1' : String(k), tk:j >= 0 && (k === j || k === j + 1) })) }];
  const done = say => ({ l:9, say, rows:[{ label:'sorted', cells:a.map((v, k) => ({ t:String(v), c:'ok', tag:String(k) })) }] });
  st.push({ l:0, say:'Each pass bubbles the largest remaining value to the end. Green slots are in their final place.', rows:row(n - 1, -1, '', 1) });
  let p = 0;
  for (let end = n - 1; end > 0; end--) {
    p++; let swapped = false;
    for (let j = 0; j < end; j++) {
      if (a[j] > a[j + 1]) {
        st.push({ l:3, say:`${a[j]} &gt; ${a[j + 1]}, so they are out of order.`, rows:row(end, j, 'bad', p) });
        [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true;
        st.push({ l:4, say:`Swap them.`, rows:row(end, j, 'on', p) });
      } else st.push({ l:3, say:`${a[j]} ≤ ${a[j + 1]}, already in order.`, rows:row(end, j, 'on', p) });
    }
    if (!swapped) { st.push(done(`Pass ${p} made no swaps, so the array is sorted. Stop early.`)); return st; }
    st.push({ l:0, say:`Pass ${p} done. ${a[end]} is now in its final place.`, rows:row(end - 1, -1, '', p) });
  }
  st.push(done(`Sorted after ${p} passes.`));
  return st;
}
function kadaneSteps(a) {
  let cur = a[0], best = a[0], s = 0, bs = 0, be = 0; const st = [];
  const rows = i => [
    { label:`current run, cur = ${cur}`, cells:a.map((v, k) => ({ t:String(v), c:k >= s && k <= i ? 'on' : '', tag:k === i ? 'i' : String(k), tk:k === i })) },
    { label:`best run, best = ${best}`, cells:a.map((v, k) => ({ t:String(v), c:k >= bs && k <= be ? 'ok' : '', tag:String(k) })) }];
  st.push({ l:0, say:`Start with the first element, so cur = best = ${a[0]}.`, rows:rows(0) });
  for (let i = 1; i < a.length; i++) {
    const v = a[i], pc = cur, ext = cur + v;
    if (ext >= v) cur = ext; else { cur = v; s = i; }
    st.push({ l:2, say:`cur + a[${i}] = ${fmtAdd(pc, v)} = ${ext}. ` + (ext >= v ? `That beats starting fresh at ${v}, so extend the run.` : `Starting fresh at ${v} is better, so begin a new run here.`), rows:rows(i) });
    if (cur > best) { best = cur; bs = s; be = i; st.push({ l:3, say:`${cur} is a new best.`, rows:rows(i) }); }
  }
  st.push({ l:5, say:`Done in one pass. The largest sum is <strong>${best}</strong>, from index ${bs} to ${be}.`, rows:rows(a.length - 1) });
  return st;
}
function twoSteps(arr, target) {
  const a = [...arr].sort((x, y) => x - y); let i = 0, j = a.length - 1; const st = [];
  const row = cls => [{ label:`i = ${i}, j = ${j}`, cells:a.map((v, k) => ({ t:String(v), c:k === i || k === j ? cls : k < i || k > j ? 'dim' : '', tag:k === i && k === j ? 'i j' : k === i ? 'i' : k === j ? 'j' : String(k), tk:k === i || k === j })) }];
  st.push({ l:0, say:`Find two numbers that add up to ${target}. Start with i on the smallest and j on the largest.`, rows:row('on') });
  while (i < j) {
    const sum = a[i] + a[j];
    if (sum === target) { st.push({ l:3, say:`${a[i]} + ${a[j]} = ${target}. Found the pair at indexes ${i} and ${j}.`, rows:row('ok') }); return st; }
    if (sum < target) { st.push({ l:4, say:`${a[i]} + ${a[j]} = ${sum}, which is less than ${target}. Move i right for a bigger sum.`, rows:row('on') }); i++; }
    else { st.push({ l:5, say:`${a[i]} + ${a[j]} = ${sum}, which is more than ${target}. Move j left for a smaller sum.`, rows:row('on') }); j--; }
  }
  st.push({ l:7, say:`The pointers met, so no pair adds up to ${target}.`, rows:row('dim') });
  return st;
}
SC.bs = { kind:'cells', ms:2000, code:['int lo = 0, hi = a.length - 1;','while (lo <= hi) {','    int mid = (lo + hi) >>> 1;','    if (a[mid] == target) return mid;','    if (a[mid] < target) lo = mid + 1;','    else hi = mid - 1;','}','return -1;'], steps:bsSteps(nums('2,5,8,12,16,23,38,56,72,91', 12), 23) };
SC.bub = { kind:'cells', ms:800, code:['for (int end = a.length - 1; end > 0; end--) {','    boolean swapped = false;','    for (int j = 0; j < end; j++) {','        if (a[j] > a[j + 1]) {','            int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;','            swapped = true;','        }','    }','    if (!swapped) break;','}'], steps:bubbleSteps([5,1,4,2,8]) };
SC.kad = { kind:'cells', ms:1600, code:['int cur = a[0], best = a[0];','for (int i = 1; i < a.length; i++) {','    cur = Math.max(a[i], cur + a[i]);','    best = Math.max(best, cur);','}','return best;'], steps:kadaneSteps([-2,1,-3,4,-1,2,1,-5,4]) };
SC.two = { kind:'cells', ms:1800, code:['int i = 0, j = a.length - 1;','while (i < j) {','    int sum = a[i] + a[j];','    if (sum == target) return new int[]{i, j};','    if (sum < target) i++;','    else j--;','}','return null;'], steps:twoSteps([1,3,4,6,8,11], 10) };

const P = {};
document.querySelectorAll('[data-scene]').forEach(m => P[m.dataset.scene] = makePlayer(m, SC[m.dataset.scene]));
if (!reduced) setTimeout(() => { P.hero.goto(0, true); P.hero.play(false); }, 500);

/* inputs for traces */
const tgt = (id, d) => { const v = nums($(id).value, 1); return v.length ? v[0] : d; };
const list = (id, max, d) => { const v = nums($(id).value, max); return v.length >= 2 ? v : d; };
const bsGo = () => P.bs.setSteps(bsSteps(list('#bsIn', 12, [2,5,8,12,16,23,38,56,72,91]), tgt('#bsT', 23)));
$('#bsIn').oninput = bsGo; $('#bsT').oninput = bsGo;
$('#bubIn').oninput = () => P.bub.setSteps(bubbleSteps(list('#bubIn', 8, [5,1,4,2,8])));
$('#kIn').oninput = () => P.kad.setSteps(kadaneSteps(list('#kIn', 10, [-2,1,-3,4,-1,2,1,-5,4])));
const tsGo = () => P.two.setSteps(twoSteps(list('#tsIn', 10, [1,3,4,6,8,11]), tgt('#tsT', 10)));
$('#tsIn').oninput = tsGo; $('#tsT').oninput = tsGo;

/* title + anatomy */
$('#titleCells').innerHTML = [...'Arrays'].map((c, k) => `<span class="tcell">${c}<i>${k}</i></span>`).join('');
$('#anatomyCells').innerHTML = [10,20,30,40,50].map((v, k) => `<span class="cl"><b>${v}</b><i>+${16 + k * 4}</i></span>`).join('');

/* address widget */
const TYPES = [['byte',1],['char',2],['int',4],['long',8],['reference',4]];
let ty = 2;
$('#ofTypes').innerHTML = TYPES.map(([n], k) => `<button class="btn" type="button" data-k="${k}" aria-pressed="${k === ty}">${n}</button>`).join('');
$('#ofTypes').querySelectorAll('button').forEach(b => b.onclick = () => { ty = +b.dataset.k; $('#ofTypes').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); ofRun(); });
function ofRun() {
  const [name, size] = TYPES[ty], i = +$('#ofIdx').value, n = 6, off = 16 + i * size;
  const hex = v => '0x' + v.toString(16).toUpperCase();
  $('#ofI').textContent = i;
  const px = b => Math.max(34, b * 6);
  let h = [['mark',8,0],['class',4,8],['len=6',4,12]].map(([l, b, o]) => `<span class="blk hd" style="width:${px(b)}px"><b>${l}</b><i>+${o}</i></span>`).join('');
  for (let k = 0; k < n; k++) h += `<span class="blk ${k === i ? 'on' : ''}" style="width:${px(size)}px"><b>[${k}]</b><i>+${16 + k * size}</i></span>`;
  $('#ofStrip').innerHTML = h;
  const raw = 16 + n * size, padded = Math.ceil(raw / 8) * 8;
  $('#ofCalc').innerHTML = `offset of a[${i}] = 16 + ${i} × ${size} = <b>${off}</b> bytes<br>address = 0x7C10 + ${off} = <b>${hex(0x7C10 + off)}</b><br>size of this ${name === 'reference' ? 'String' : name}[6] = 16 + 6 × ${size} = ${raw}${padded !== raw ? `, padded to ${padded}` : ''} bytes`;
}
$('#ofIdx').oninput = ofRun; ofRun();

/* quiz */
const QZ = [
 {c:['int[] a = new int[3];','System.out.println(a[1]);'],o:['0','null','Exception'],a:0,w:'Array slots are always initialised. An <code>int</code> slot starts at 0.'},
 {c:['int[] a = {1, 2, 3};','System.out.println(a);'],o:['[1, 2, 3]','[I@1b6d3586','123'],a:1,w:'Arrays don\'t override <code>toString()</code>. You get <code>[I</code> (the code for int[]), an @, and a hash in hex. Use <code>Arrays.toString(a)</code>.'},
 {c:['char[] c = {\'h\', \'i\'};','System.out.println(c);'],o:['hi','[C@6d06d69c'],a:0,w:'<code>println</code> has a special overload for <code>char[]</code> that prints the characters. <code>"" + c</code> would print <code>[C@…</code> instead.'},
 {c:['int[] a = {1, 2};','int[] b = {1, 2};','System.out.println(a.equals(b));'],o:['true','false'],a:1,w:'Arrays inherit <code>equals()</code> from Object, which compares addresses. Use <code>Arrays.equals(a, b)</code>.'},
 {c:['int[] a = {1, 2, 3};','for (int x : a) x *= 2;','System.out.println(a[0]);'],o:['1','2'],a:0,w:'The for-each loop copies each element into <code>x</code>. Doubling <code>x</code> doesn\'t touch the array.'},
 {c:['String[] s = new String[2];','System.out.println(s[0].length());'],o:['0','null','NullPointerException'],a:2,w:'Creating the array created no Strings. <code>s[0]</code> is <code>null</code>, and calling a method on null throws.'},
 {c:['int[][] m = new int[2][];','System.out.println(m[0]);'],o:['null','0','[I@4e25154f'],a:0,w:'Only the outer array exists. Its row slots are references, so they start at <code>null</code>.'},
 {c:['Object[] o = new Integer[1];','o[0] = "x";'],o:['Runs fine','Compile error','ArrayStoreException'],a:2,w:'It compiles because <code>o</code> is an <code>Object[]</code>. At run time the JVM sees a String going into an Integer array and throws.'},
 {c:['int[] a = {1, 2, 3};','System.out.println(Arrays.asList(a).size());'],o:['3','1'],a:1,w:'<code>asList(T...)</code> needs objects, and <code>int</code> isn\'t one. The whole <code>int[]</code> becomes a single element. Use <code>Integer[]</code> or <code>Arrays.stream(a)</code>.'},
 {c:['static void f(int[] x) { x = new int[]{7}; }','int[] a = {1};','f(a);','System.out.println(a[0]);'],o:['1','7'],a:0,w:'<code>f</code> got a copy of the address. Pointing that copy at a new array doesn\'t change <code>a</code>.'},
];
let got = {};
function scoreDraw() {
  const n = Object.keys(got).length, r = Object.values(got).filter(Boolean).length;
  $('#score').textContent = n ? `${r} right out of ${n} answered, ${QZ.length} questions in all` : `${QZ.length} questions`;
}
function quizDraw() {
  got = {};
  const box = $('#quizBox'); box.innerHTML = '';
  QZ.forEach((q, n) => {
    const d = document.createElement('div'); d.className = 'qcard';
    d.innerHTML = `<pre class="code" tabindex="0">${q.c.map(l => `<span class="ln">${hl(l)}</span>`).join('')}</pre><div class="opts">${q.o.map((o, k) => `<button class="opt" type="button" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="why" hidden></p>`;
    d.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.a; got[n] = ok;
      d.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      const w = $('.why', d); w.innerHTML = (ok ? '<strong>Correct.</strong> ' : '<strong>Not this time.</strong> ') + q.w; w.hidden = false;
      scoreDraw();
    });
    box.appendChild(d);
  });
  scoreDraw();
}
$('#quizReset').onclick = quizDraw; quizDraw();
