/* Inside java.lang.String — interactive diagrams and widgets */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ADDR = ['@3f2a','@7c11','@1b6d','@4e25','@6d06','@2a13','@5ce8','@19e0'];
const show = c => c === ' ' ? '␣' : c;

function hl(line) {
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(String|StringBuilder|char|int|new|final|for|while|if|return|null|true|false)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : 'k';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last)) || ' ';
}

/* ---------- memory map ---------- */
function replay(steps, upto) {
  const objs = [], vars = [];
  for (let k = 0; k <= upto; k++) {
    const s = steps[k];
    (s.obj || []).forEach(([id, text, zone]) => objs.push({ id, text, zone, addr: ADDR[objs.length % ADDR.length] }));
    Object.entries(s.v || {}).forEach(([name, ref]) => {
      const f = vars.find(v => v.name === name);
      f ? f.ref = ref : vars.push({ name, ref });
    });
    Object.entries(s.set || {}).forEach(([id, t]) => objs.find(o => o.id === id).text = t);
  }
  return { objs, vars };
}
function renderMem(stage, cfg, i, animate) {
  const W = Math.max(280, stage.clientWidth - 24);
  const steps = cfg.steps, all = replay(steps, steps.length - 1), st = replay(steps, i);
  const prev = animate && i > 0 ? replay(steps, i - 1) : null;
  const pool = all.objs.filter(o => o.zone === 'pool'), heap = all.objs.filter(o => o.zone === 'heap');
  const sw = Math.min(170, Math.max(98, W * .27)), gap = Math.max(38, W * .1), hx = sw + gap, hw = W - hx;
  const ROW = 44, BOX = 36;
  const poolY = 28, poolH = 26 + Math.max(1, pool.length) * ROW + 2;
  const heapY = poolY + poolH + 8, H = heapY + heap.length * ROW + 4;
  const ox = hx + 16, ow = hw - 32;
  const hot = new Set([...(steps[i].obj || []).map(o => o[0]), ...Object.keys(steps[i].set || {}), ...Object.values(steps[i].v || {}), ...(steps[i].hot || [])]);
  const hotVars = new Set(Object.keys(steps[i].v || {}));
  const pos = {};
  pool.forEach((o, k) => pos[o.id] = poolY + 24 + k * ROW);
  heap.forEach((o, k) => pos[o.id] = heapY + k * ROW);
  const live = new Set(st.vars.map(v => v.ref));
  let s = `<svg viewBox="0 0 ${W} ${H + 1}" width="${W}" height="${H + 1}" role="img" aria-label="Memory map: ${esc(st.vars.map(v => v.name + ' points to ' + (st.objs.find(o => o.id === v.ref) || {}).text).join(', '))}">`;
  s += `<rect class="zone z-stack" x=".75" y=".75" width="${sw - 1.5}" height="${H - .5}" rx="8"/><text class="zl stack" x="10" y="19">STACK</text>`;
  s += `<rect class="zone z-heap" x="${hx}" y=".75" width="${hw - .75}" height="${H - .5}" rx="8"/><text class="zl heap" x="${hx + 10}" y="19">HEAP</text>`;
  s += `<rect class="zone z-pool" x="${hx + 8}" y="${poolY}" width="${hw - 16}" height="${poolH}" rx="6"/><text class="zl pool" x="${hx + 16}" y="${poolY + 16}">STRING POOL</text>`;
  st.objs.forEach(o => {
    const gone = o.zone === 'heap' && !live.has(o.id);
    const y = pos[o.id], isNew = prev && !prev.objs.find(p => p.id === o.id);
    const cls = (hot.has(o.id) ? 'isHot ' : '') + (isNew ? 'enter' : '');
    s += `<g class="${cls}"><rect class="cell-r ${gone ? 'ob-gc' : 'ob-' + o.zone}" x="${ox}" y="${y}" width="${ow}" height="${BOX}" rx="5"/>`;
    s += `<text class="tx ${gone ? 'tx-gc' : ''}" x="${ox + 10}" y="${y + 23}">${esc(o.text)}</text>`;
    if (ow > 136) s += `<text class="ad" text-anchor="end" x="${ox + ow - 8}" y="${y + 22}">${gone ? 'garbage' : o.addr}</text>`;
    s += `</g>`;
  });
  const order = all.vars.map(v => v.name);
  st.vars.forEach(v => {
    const y = 28 + order.indexOf(v.name) * ROW, isNew = prev && !prev.vars.find(p => p.name === v.name);
    s += `<g class="${(hotVars.has(v.name) ? 'isHot ' : '') + (isNew ? 'enter' : '')}"><rect class="cell-r vr" x="8" y="${y}" width="${sw - 16}" height="${BOX}" rx="5"/><text class="tx" x="18" y="${y + 23}">${esc(v.name)}</text><circle class="dot" cx="${sw - 20}" cy="${y + 18}" r="4"/></g>`;
  });
  st.vars.forEach(v => {
    const same = st.vars.filter(x => x.ref === v.ref), off = (same.indexOf(v) - (same.length - 1) / 2) * 8;
    const x1 = sw - 20, y1 = 28 + order.indexOf(v.name) * ROW + 18, x2 = ox - 2, y2 = pos[v.ref] + 18 + off;
    const dx = Math.max(30, (x2 - x1) * .5), p = prev && prev.vars.find(q => q.name === v.name);
    const fresh = prev && (!p || p.ref !== v.ref), h = hotVars.has(v.name) ? 'isHot' : '';
    s += `<path class="wire ${h} ${fresh ? 'enter' : ''}" pathLength="1" d="M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2 - 7} ${y2}"/><path class="head ${h} ${fresh ? 'enter' : ''}" d="M${x2} ${y2}l-9 -4.5v9z"/>`;
  });
  stage.innerHTML = s + '</svg>';
}

/* ---------- cells ---------- */
function renderCells(stage, cfg, i) {
  stage.innerHTML = '<div class="rows">' + cfg.steps[i].rows.map(r =>
    `<div><div class="row-l">${esc(r.label)}</div><div class="cells">` +
    r.cells.map((c, k) => `<span class="cl ${c.c || ''} ${c.tag && r.label !== 'count' && /^[ij ]+$/.test(c.tag) ? 'tag' : ''}"><b>${esc(c.t)}</b><i>${esc(c.tag != null ? c.tag : r.idx ? k : '')}</i></span>`).join('') +
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
    if (cfg.kind === 'mem') renderMem(stage, cfg, i, animate && !reduced);
    else renderCells(stage, cfg, i);
  }
  const p = {
    stop() { clearInterval(timer); timer = null; btn.textContent = 'Play'; if (playing === p) playing = null; },
    play(from0 = true) {
      if (playing) playing.stop();
      if (from0 && i >= cfg.steps.length - 1) i = 0;
      draw(true); playing = p; btn.textContent = 'Pause';
      timer = setInterval(() => {
        if (i >= cfg.steps.length - 1) return p.stop();
        i++; draw(true);
      }, cfg.ms || 2600);
    },
    goto(k, animate) { i = Math.max(0, Math.min(cfg.steps.length - 1, k)); draw(animate); },
    last() { p.stop(); p.goto(cfg.steps.length - 1, false); },
    setSteps(st) { cfg.steps = st; p.last(); }
  };
  btn.onclick = () => timer ? p.stop() : p.play();
  $('.back', fig).onclick = () => { p.stop(); p.goto(i - 1, false); };
  $('.next', fig).onclick = () => { p.stop(); p.goto(i + 1, true); };
  rng.oninput = () => { p.stop(); p.goto(+rng.value, false); };
  if (cfg.kind === 'mem') {
    let w = 0;
    new ResizeObserver(() => { if (stage.clientWidth !== w) { w = stage.clientWidth; draw(false); } }).observe(stage);
  }
  p.goto(cfg.steps.length - 1, false);
  return p;
}

/* ---------- scene data ---------- */
const SC = {
hero: { kind:'mem', code:['String a = "java";','String b = "java";','String c = new String("java");','a = a.toUpperCase();'], steps:[
 {l:0,obj:[['h1','"java"','pool']],v:{a:'h1'},say:'The literal <code>"java"</code> goes into the pool. Variable <code>a</code> on the stack stores only its address.'},
 {l:1,v:{b:'h1'},say:'Same literal, so the pooled object is reused. <code>a</code> and <code>b</code> hold the same address.'},
 {l:2,obj:[['h2','"java"','heap']],v:{c:'h2'},say:'<code>new</code> always makes a fresh object outside the pool, even though the text already exists.'},
 {l:3,obj:[['h3','"JAVA"','heap']],v:{a:'h3'},say:'<code>toUpperCase()</code> can\'t change the old object. It returns a new String and <code>a</code> moves to it. <code>b</code> still sees <code>"java"</code>.'}]},
pool: { kind:'mem', code:['String a = "java";','String b = "java";','String c = "tea";','System.out.println(a == b);  // true'], steps:[
 {l:0,obj:[['p1','"java"','pool']],v:{a:'p1'},say:'Pool miss. <code>"java"</code> isn\'t there yet, so it is added.'},
 {l:1,v:{b:'p1'},say:'Pool hit. No new object is created. <code>b</code> gets the same address.'},
 {l:2,obj:[['p2','"tea"','pool']],v:{c:'p2'},say:'Different text means a new pool entry.'},
 {l:3,hot:['p1'],say:'Prints <code>true</code>. Both variables hold the same address.'}]},
newstr: { kind:'mem', code:['String a = new String("java");','String b = new String("java");','// 3 String objects in total'], steps:[
 {l:0,obj:[['n1','"java"','pool']],say:'Step one: the literal is needed, and the pool doesn\'t have it, so it is added.'},
 {l:0,obj:[['n2','"java"','heap']],v:{a:'n2'},say:'Step two: <code>new</code> creates a second object on the heap. That makes 2 objects.'},
 {l:1,hot:['n1'],say:'The literal is already pooled, so nothing is added this time.'},
 {l:1,obj:[['n3','"java"','heap']],v:{b:'n3'},say:'<code>new</code> still creates its own object. That makes 3 in total: one pooled and two on the heap.'}]},
eq: { kind:'mem', code:['String a = "java";','String b = new String("java");','String c = b;','a == b       // false','a.equals(b)  // true','b == c       // true'], steps:[
 {l:0,obj:[['e1','"java"','pool']],v:{a:'e1'},say:'<code>a</code> points into the pool.'},
 {l:1,obj:[['e2','"java"','heap']],v:{b:'e2'},say:'<code>b</code> points at a separate object with the same text.'},
 {l:2,v:{c:'e2'},say:'Assignment copies the address. No new String is created.'},
 {l:3,hot:['e1','e2'],say:'<code>false</code>. The two addresses differ, even though the text matches.'},
 {l:4,hot:['e1','e2'],say:'<code>true</code>. <code>equals()</code> compares the characters.'},
 {l:5,hot:['e2'],say:'<code>true</code>. Both variables hold the same address.'}]},
intern: { kind:'mem', code:['String a = "java";','String b = new String("java");','a == b;  // false','b = b.intern();','a == b;  // true'], steps:[
 {l:0,obj:[['i1','"java"','pool']],v:{a:'i1'},say:'The pool holds <code>"java"</code>.'},
 {l:1,obj:[['i2','"java"','heap']],v:{b:'i2'},say:'<code>b</code> has its own heap copy.'},
 {l:2,hot:['i1','i2'],say:'<code>false</code>. These are two different objects.'},
 {l:3,v:{b:'i1'},say:'<code>intern()</code> finds the pooled copy and returns it. Nothing refers to the heap copy now, so it can be collected.'},
 {l:4,hot:['i1'],say:'<code>true</code>. Both variables now point at the pooled object.'}]},
immut: { kind:'mem', code:['String s = "java";','s.concat(" 21");      // result ignored','System.out.println(s);  // java','s = s.concat(" 21");','System.out.println(s);  // java 21'], steps:[
 {l:0,obj:[['m1','"java"','pool']],v:{s:'m1'},say:'<code>s</code> points at <code>"java"</code>.'},
 {l:1,obj:[['m2','" 21"','pool'],['m3','"java 21"','heap']],say:'<code>concat</code> builds a new String, but nobody keeps the address, so it is garbage straight away.'},
 {l:2,hot:['m1'],say:'Prints <code>java</code>. The original was never touched.'},
 {l:3,obj:[['m4','"java 21"','heap']],v:{s:'m4'},say:'This time the result is assigned, so <code>s</code> moves to the new object.'},
 {l:4,hot:['m4'],say:'Prints <code>java 21</code>. The variable changed. The old <code>"java"</code> object is still intact in the pool.'}]},
whatif: { kind:'mem', code:['String a = "java";','String b = "java";','// Imaginary: Java has no such method','a.upperCaseInPlace();','System.out.println(b);  // JAVA ?!'], steps:[
 {l:0,obj:[['w1','"java"','pool']],v:{a:'w1'},say:'<code>a</code> points at a shared object.'},
 {l:1,v:{b:'w1'},say:'<code>b</code> shares it. Other classes in the program could share it too.'},
 {l:3,set:{w1:'"JAVA"'},say:'Suppose Strings could be edited in place. The one shared object changes.'},
 {l:4,hot:['w1'],say:'<code>b</code> changed even though no code touched it. Immutability makes this impossible.'}]},
fold: { kind:'mem', code:['String a = "hello";','String b = "hel" + "lo";','String y = "hel";','String d = y + "lo";','a == b;  // true','a == d;  // false'], steps:[
 {l:0,obj:[['f1','"hello"','pool']],v:{a:'f1'},say:'<code>"hello"</code> goes in the pool.'},
 {l:1,v:{b:'f1'},say:'The compiler already turned this into <code>"hello"</code>, so <code>b</code> gets the pooled object.'},
 {l:2,obj:[['f2','"hel"','pool']],v:{y:'f2'},say:'<code>y</code> is an ordinary variable. The compiler treats its value as unknown.'},
 {l:3,obj:[['f3','"lo"','pool'],['f4','"hello"','heap']],v:{d:'f4'},say:'Joined at run time, so the result is a new heap object.'},
 {l:4,hot:['f1'],say:'<code>true</code>. Same pooled object.'},
 {l:5,hot:['f1','f4'],say:'<code>false</code>. Same text, different objects. <code>d.intern() == a</code> would be <code>true</code>.'}]},
loop: { kind:'mem', ms:2200, code:['String s = "";','for (int i = 0; i < 3; i++) {','    s += "x";','}'], steps:[
 {l:0,obj:[['l0','""','pool']],v:{s:'l0'},say:'Start with an empty String.'},
 {l:2,obj:[['lx','"x"','pool'],['l1','"x"','heap']],v:{s:'l1'},say:'Pass 1: new String, 1 character copied.'},
 {l:2,obj:[['l2','"xx"','heap']],v:{s:'l2'},say:'Pass 2: new String, 2 characters copied. The last one is garbage.'},
 {l:2,obj:[['l3','"xxx"','heap']],v:{s:'l3'},say:'Pass 3: new String, 3 characters copied. Three passes, 6 copies, 2 pieces of garbage.'}]},
};

const chars = (str, cap, hotFrom = -1, hotTo = -1, base = 'fill') => {
  const out = [];
  for (let k = 0; k < cap; k++) {
    const t = k < str.length ? show(str[k]) : '';
    out.push({ t, c: k >= hotFrom && k < hotTo ? 'on' : k < str.length ? base : '' });
  }
  return out;
};
const A = 'hello world ', B = A + 'java', C = B + '!';
SC.sb = { kind:'cells', code:['StringBuilder sb = new StringBuilder();','sb.append("hello world ");','sb.append("java");','sb.append("!");','String out = sb.toString();'], steps:[
 {l:0,say:'An empty array with capacity 16. <code>length()</code> is 0.',rows:[{label:'value, capacity 16',idx:1,cells:chars('',16)}]},
 {l:1,say:'12 characters go straight in. No new array is needed.',rows:[{label:'value, capacity 16',idx:1,cells:chars(A,16,0,12)}]},
 {l:2,say:'4 more fit exactly. The array is now full.',rows:[{label:'value, capacity 16',idx:1,cells:chars(B,16,12,16)}]},
 {l:3,say:'The 17th character doesn\'t fit. A new array of 16 × 2 + 2 = 34 is allocated, the 16 characters are copied, and <code>!</code> is added. The old array becomes garbage.',rows:[{label:'old value, garbage',cells:chars(B,16,-1,-1,'dim')},{label:'new value, capacity 34',idx:1,cells:chars(C,34,16,17)}]},
 {l:4,say:'<code>toString()</code> copies the used 17 characters into a new String. Later appends can\'t affect it.',rows:[{label:'value, capacity 34',idx:1,cells:chars(C,34)},{label:'String out, length 17',idx:1,cells:chars(C,17,0,17)}]}]};

const HW = 'hello world';
SC.sub = { kind:'cells', code:['String s = readLine();  // "hello world"','String w = s.substring(6);','s = null;'], steps:[
 {l:0,say:'<code>s</code> holds 11 characters in its own array.',rows:[{label:'s.value',idx:1,cells:chars(HW,11)}]},
 {l:1,say:'<code>substring(6)</code> selects index 6 to the end.',rows:[{label:'s.value',idx:1,cells:chars(HW,11,6,11)}]},
 {l:1,say:'Those characters are copied into a new array that belongs to <code>w</code>.',rows:[{label:'s.value',idx:1,cells:chars(HW,11)},{label:'w.value',idx:1,cells:chars('world',5,0,5)}]},
 {l:2,say:'The parent String can now be collected, and <code>w</code> keeps working on its own array.',rows:[{label:'s.value, garbage',idx:1,cells:chars(HW,11,-1,-1,'dim')},{label:'w.value',idx:1,cells:chars('world',5)}]}]};

const PW = 's3cret', zero = Array.from({length:6},()=>({t:'\\0',c:'ok'}));
SC.pwd = { kind:'cells', code:['String p = readLine();','char[] c = console.readPassword();','login(c);','Arrays.fill(c, \'\\0\');'], steps:[
 {l:0,say:'The secret is in a String. No method can erase those bytes.',rows:[{label:'String p',cells:chars(PW,6,0,6)}]},
 {l:1,say:'<code>readPassword()</code> returns a <code>char[]</code>, which you control.',rows:[{label:'String p',cells:chars(PW,6)},{label:'char[] c',idx:1,cells:chars(PW,6,0,6)}]},
 {l:2,say:'Use the array for the login.',rows:[{label:'String p',cells:chars(PW,6)},{label:'char[] c',idx:1,cells:chars(PW,6)}]},
 {l:3,say:'The array is wiped at once. The String copy stays readable in memory, and <code>p = null</code> wouldn\'t erase it.',rows:[{label:'String p, still readable',cells:chars(PW,6,0,6)},{label:'char[] c',idx:1,cells:zero}]}]};

/* generated traces */
function revSteps(s) {
  const a = [...Array.from(s)].map(x => x), n = a.length;
  const row = (i, j, c1 = 'on') => [{label:'char[] c',cells:a.map((t,k)=>({t:show(t),c:k===i||k===j?c1:k<i||k>j?'ok':'fill',tag:k===i&&k===j?'i j':k===i?'i':k===j?'j':String(k)}))}];
  const st = [{l:0,say:`Copy the ${n} characters into a <code>char[]</code>.`,rows:[{label:'char[] c',cells:a.map((t,k)=>({t:show(t),c:'fill',tag:String(k)}))}]}];
  let i = 0, j = n - 1;
  st.push({l:1,say:'Set <code>i</code> at the start and <code>j</code> at the end.',rows:row(i,j)});
  while (i < j) {
    const x = a[i], y = a[j];
    st.push({l:2,say:`${i} &lt; ${j}, so continue.`,rows:row(i,j)});
    a[i] = y; a[j] = x;
    st.push({l:3,say:`Swap <code>${esc(show(x))}</code> and <code>${esc(show(y))}</code>.`,rows:row(i,j)});
    i++; j--;
  }
  st.push({l:6,say:`The pointers met, so the job is done. Result: <code>"${esc(a.join(''))}"</code>.`,rows:[{label:'new String(c)',cells:a.map((t,k)=>({t:show(t),c:'ok',tag:String(k)}))}]});
  return st;
}
function palSteps(s) {
  const a = Array.from(s), n = a.length;
  const row = (i, j, c) => [{label:'s',cells:a.map((t,k)=>({t:show(t),c:k===i||k===j?c:k<i||k>j?'ok':'fill',tag:k===i&&k===j?'i j':k===i?'i':k===j?'j':String(k)}))}];
  let i = 0, j = n - 1;
  const st = [{l:0,say:'Start one pointer at each end.',rows:row(i,j,'on')}];
  while (i < j) {
    if (a[i] !== a[j]) { st.push({l:2,say:`<code>${esc(show(a[i]))}</code> and <code>${esc(show(a[j]))}</code> differ. Return <code>false</code>.`,rows:row(i,j,'bad')}); return st; }
    st.push({l:2,say:`<code>${esc(show(a[i]))}</code> matches <code>${esc(show(a[j]))}</code>. Move inward.`,rows:row(i,j,'ok')});
    i++; j--;
  }
  st.push({l:5,say:'Every pair matched. Return <code>true</code>.',rows:[{label:'s',cells:a.map((t,k)=>({t:show(t),c:'ok',tag:String(k)}))}]});
  return st;
}
function anaSteps(a, b) {
  const letters = [...new Set(a + b)].sort(), cnt = Object.fromEntries(letters.map(l => [l, 0]));
  const rows = (ca, cb, hl, bad) => [
    {label:'a',cells:Array.from(a).map((t,k)=>({t,c:k===ca?'on':'',tag:String(k)}))},
    {label:'b',cells:Array.from(b).map((t,k)=>({t,c:k===cb?'on':'',tag:String(k)}))},
    {label:'count',cells:letters.map(l=>({t:String(cnt[l]),c:l===hl?'on':bad&&cnt[l]!==0?'bad':'',tag:l}))}];
  if (!a || !b) return [{l:4,say:'Enter two words made of letters a to z.',rows:[{label:'count',cells:[]}]}];
  if (a.length !== b.length) return [{l:0,say:`Lengths ${a.length} and ${b.length} differ. Return <code>false</code>.`,rows:rows(-1,-1)}];
  const st = [{l:1,say:'All counts start at zero.',rows:rows(-1,-1)}];
  Array.from(a).forEach((ch,k)=>{ cnt[ch]++; st.push({l:2,say:`<code>${ch}</code> from a: count goes up to ${cnt[ch]}.`,rows:rows(k,-1,ch)}); });
  Array.from(b).forEach((ch,k)=>{ cnt[ch]--; st.push({l:3,say:`<code>${ch}</code> from b: count goes down to ${cnt[ch]}.`,rows:rows(-1,k,ch)}); });
  const ok = letters.every(l => cnt[l] === 0);
  st.push({l:ok?5:4,say:ok?'Every count is zero. Return <code>true</code>: these are anagrams.':'Some counts aren\'t zero. Return <code>false</code>.',rows:rows(-1,-1,null,!ok)});
  return st;
}
SC.rev = { kind:'cells', ms:1500, code:['char[] c = s.toCharArray();','int i = 0, j = c.length - 1;','while (i < j) {','    char t = c[i]; c[i] = c[j]; c[j] = t;','    i++; j--;','}','return new String(c);'], steps:revSteps('string') };
SC.pal = { kind:'cells', ms:1500, code:['int i = 0, j = s.length() - 1;','while (i < j) {','    if (s.charAt(i) != s.charAt(j)) return false;','    i++; j--;','}','return true;'], steps:palSteps('madam') };
SC.ana = { kind:'cells', ms:1100, code:['if (a.length() != b.length()) return false;','int[] count = new int[26];','for (char ch : a.toCharArray()) count[ch - \'a\']++;','for (char ch : b.toCharArray()) count[ch - \'a\']--;','for (int n : count) if (n != 0) return false;','return true;'], steps:anaSteps('listen','silent') };

const P = {};
document.querySelectorAll('[data-scene]').forEach(m => P[m.dataset.scene] = makePlayer(m, SC[m.dataset.scene]));
if (!reduced) setTimeout(() => { P.hero.goto(0, true); P.hero.play(false); }, 500);

/* title + anatomy cells */
$('#titleCells').innerHTML = [...'String'].map((c,k)=>`<span class="tcell">${c}<i>${k}</i></span>`).join('');
$('#anatomyCells').innerHTML = [...'java'].map(c=>`<span class="cl fill"><b>${c.charCodeAt(0)}</b><i>${c}</i></span>`).join('');

/* hash */
function hashRun() {
  let h = 0, html = '';
  for (const c of Array.from({length:$('#hashIn').value.length},(_, k)=>$('#hashIn').value.charCodeAt(k))) {
    const prev = h; h = (Math.imul(31, h) + c) | 0;
    html += `<tr><td class="num">${esc(show(String.fromCharCode(c)))}</td><td class="num">${c}</td><td class="num">31 × ${prev} + ${c} = ${h}</td></tr>`;
  }
  $('#hashRows').innerHTML = html || '<tr><td colspan="3">An empty String has hash 0.</td></tr>';
  $('#hashOut').textContent = h;
}
$('#hashIn').oninput = hashRun; hashRun();

/* copy-cost bars */
function builderCopies(n) { let cap = 16, len = 0, c = 0; for (let k = 0; k < n; k++) { if (len + 1 > cap) { c += len; cap = cap * 2 + 2; } len++; c++; } return c; }
function costRun() {
  const n = +$('#nRange').value, a = n * (n + 1) / 2, b = builderCopies(n), max = Math.max(a, b);
  $('#nOut').textContent = n.toLocaleString('en-US');
  $('#aOut').textContent = a.toLocaleString('en-US'); $('#bOut').textContent = b.toLocaleString('en-US');
  $('#aBar').style.width = a / max * 100 + '%'; $('#bBar').style.width = b / max * 100 + '%';
}
$('#nRange').oninput = costRun; costRun();

/* compact strings */
function cpRun() {
  const s = $('#cpIn').value, codes = Array.from({length:s.length},(_, k)=>s.charCodeAt(k));
  const lat = codes.every(c => c <= 255), hex = v => v.toString(16).toUpperCase().padStart(2,'0');
  const chip = $('#cpChip'); chip.textContent = lat ? 'coder 0: LATIN1' : 'coder 1: UTF16'; chip.className = 'chip ' + (lat ? 'lat' : 'utf');
  $('#cpLen').textContent = s.length; $('#cpBytes').textContent = lat ? s.length : s.length * 2;
  $('#cpCells').innerHTML = codes.flatMap((c,k) => {
    const ch = c >= 0xD800 && c <= 0xDFFF ? 'sur' : show(s[k]);
    return lat ? [`<span class="cl fill"><b>${hex(c)}</b><i>${esc(ch)}</i></span>`]
      : [`<span class="cl on"><b>${hex(c>>8)}</b><i>${esc(ch)}</i></span>`,`<span class="cl fill"><b>${hex(c&255)}</b><i></i></span>`];
  }).join('');
}
$('#cpIn').oninput = cpRun;
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { $('#cpIn').value = b.dataset.s; cpRun(); });
cpRun();

/* live traces */
$('#revIn').oninput = e => P.rev.setSteps(revSteps(e.target.value || 'java'));
$('#palIn').oninput = e => P.pal.setSteps(palSteps(e.target.value || 'madam'));
const anaGo = () => { const f = id => $(id).value.toLowerCase().replace(/[^a-z]/g,''); P.ana.setSteps(anaSteps(f('#anaA'), f('#anaB'))); };
$('#anaA').oninput = anaGo; $('#anaB').oninput = anaGo;

/* quiz */
const QZ = [
 {c:['System.out.println("hel" + "lo" == "hello");'],o:['true','false'],a:0,w:'Both sides are compile-time constants, so they resolve to the same pooled object.'},
 {c:['String s = "hello";','s.toUpperCase();','System.out.println(s);'],o:['hello','HELLO'],a:0,w:'The returned String was thrown away. <code>s</code> never changed.'},
 {c:['System.out.println(1 + 2 + "3" + 4 + 5);'],o:['15','3345','12345'],a:1,w:'Evaluation runs left to right. <code>1 + 2</code> is addition, giving 3. Once a String appears, every <code>+</code> after it joins text.'},
 {c:['System.out.println(\'a\' + \'b\' + "c");'],o:['abc','195c','ab c'],a:1,w:'Two <code>char</code> values add as numbers: 97 + 98 = 195. Then <code>"c"</code> is joined.'},
 {c:['String s = null;','System.out.println(s + "x");'],o:['x','nullx','NullPointerException'],a:1,w:'Concatenation converts <code>null</code> to the text <code>"null"</code>. Calling <code>s.length()</code> would throw.'},
 {c:['System.out.println("a.b.c".split(".").length);'],o:['3','0','5'],a:1,w:'<code>split</code> takes a regex, and <code>.</code> matches every character. All pieces are empty and trailing empties are dropped. Use <code>"\\\\."</code>.'},
 {c:['System.out.println(new String("a") == new String("a"));'],o:['true','false'],a:1,w:'Each <code>new</code> makes a separate object, so the addresses differ.'},
 {c:['String a = "ab";','final String b = "a";','String c = b + "b";','System.out.println(a == c);'],o:['true','false'],a:0,w:'<code>b</code> is a <code>final</code> constant, so the compiler folds <code>b + "b"</code> into <code>"ab"</code>.'},
 {c:['String x = "java";','String y = x;','x += "!";','System.out.println(y);'],o:['java','java!'],a:0,w:'<code>+=</code> points <code>x</code> at a new String. <code>y</code> keeps the old address.'},
 {c:['StringBuilder a = new StringBuilder("ab");','StringBuilder b = a;','b.append("c");','System.out.println(a);'],o:['ab','abc'],a:1,w:'Builders are mutable. Both variables point at one object, so the change shows through <code>a</code>.'},
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
    d.innerHTML = `<pre class="code" tabindex="0">${q.c.map(l=>`<span class="ln">${hl(l)}</span>`).join('')}</pre><div class="opts">${q.o.map((o,k)=>`<button class="opt" type="button" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="why" hidden></p>`;
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
