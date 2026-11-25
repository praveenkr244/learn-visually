/* Course mode for this page (see assets/course.js): which parts of the page are lessons,
   plus each lesson's key idea, Remember points, practice exercises and quick check.
   Code is written with R`...`: backslashes stay as written, and \` and \${ become a real backtick and ${
   (so practice code can use template literals without being filled in here). */
(() => {
const R = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, "$1");
const GROUPS = { Beginner: 0, Intermediate: 1, Advanced: 2, Development: 3, Projects: 4, Reference: 5 };
window.COURSE = {
  key: "jsvis", title: "JavaScript, Visually", lang: "js", barIn: ".top",
  parts: [
    { name: "Beginner", color: "var(--good)" },
    { name: "Intermediate", color: "var(--warn)" },
    { name: "Advanced", color: "var(--adv)" },
    { name: "Development", color: "var(--accent)" },
    { name: "Projects", color: "var(--proj)" },
    { name: "Reference", color: "var(--muted)" }
  ],
  fold: ".c-more",
  foldLabel: el => `${el.querySelectorAll("pre").length} more runnable examples`,
  tag() {
    const hero = document.querySelector("#top");
    hero.dataset.onlyHome = "";
    const road = hero.querySelector(".road");
    road.dataset.onlyAll = "";
    road.insertAdjacentHTML("afterend", '<div data-cta></div><div data-parts></div>');
    document.querySelectorAll("section.lesson").forEach(s => {
      s.dataset.lesson = ""; s.dataset.part = GROUPS[s.dataset.group] ?? 5;
      s.dataset.title = s.querySelector("h2").textContent.trim();
      const head = s.querySelector(":scope > header"); if (head) head.dataset.head = "";
      if (s.id === "cheatsheet") s.dataset.nocount = "";
      // the "Practice: two more runnable examples" heading and its code blocks fold into one box
      s.querySelectorAll(":scope > h3").forEach(h => {
        if (!/^Practice/i.test(h.textContent)) return;
        const box = document.createElement("div"); box.className = "c-more";
        h.before(box);
        let n = h.nextElementSibling;
        h.remove();
        while (n && n.matches("pre.code")) { const next = n.nextElementSibling; box.append(n); n = next; }
      });
    });
  },
  data: {
start: { e: "👋", k: "JavaScript runs in every browser and, with Node.js, everywhere else. <code>console.log()</code> prints values; <code>{ }</code> group statements into blocks.",
  r: ["Open any browser's DevTools console to try one-liners.", "Statements end with <code>;</code>; comments start with <code>//</code>.", "JavaScript is case-sensitive."],
  q: ["Which program runs JavaScript outside the browser?", ["Java", "Node.js", "Python", "HTML"], 1, "Node.js runs JavaScript on servers and command lines."],
  p: [{ t: "Print the line below using the two variables and a template literal (backticks).",
    c: R`const name = "Ada";
const year = 1843;
// TODO: print  Ada wrote the first program in 1843
console.log(name);`,
    s: R`const name = "Ada";
const year = 1843;
console.log(\`\${name} wrote the first program in \${year}\`);`,
    o: "Ada wrote the first program in 1843" }] },
variables: { e: "🏷️", k: "<code>const</code> by default, <code>let</code> when you reassign. Primitives are <b>copied</b>; objects and arrays are <b>shared by reference</b>.",
  r: ["<code>const</code> stops reassignment, not changes inside an object.", "<code>b = a</code> with an array gives two names for one array.", "Avoid <code>var</code>: it ignores block scope."],
  q: ["After let a = [1]; const b = a; b.push(2); what is a?", ["[1]", "[1, 2]", "[2]", "TypeError"], 1, "a and b point at the same array."],
  p: [{ t: "Make <code>copy</code> a <b>separate</b> array so pushing to it doesn't change <code>scores</code>.",
    c: R`const scores = [90, 85];
const copy = scores;   // TODO: make a real copy
copy.push(70);
console.log(scores, copy);`,
    s: R`const scores = [90, 85];
const copy = [...scores];
copy.push(70);
console.log(scores, copy);`,
    o: "[ 90, 85 ] [ 90, 85, 70 ]" }] },
types: { e: "🔢", k: "Seven primitive types plus objects. <code>typeof</code> tells you which; <code>Array.isArray</code> and <code>=== null</code> cover its blind spots.",
  r: ["<code>typeof null</code> is <code>\"object\"</code> (an old bug).", "<code>NaN</code> is never equal to itself: use <code>Number.isNaN</code>.", "Do money in whole cents."],
  q: ["What does Number(\"12px\") return?", ["12", "NaN", "\"12\"", "0"], 1, "Number() needs the whole string to be numeric; parseInt would give 12."],
  p: [{ t: "Write <code>kind(v)</code> returning <code>\"null\"</code>, <code>\"array\"</code>, or <code>typeof v</code> otherwise.",
    c: R`function kind(v) {
  // TODO
  return typeof v;
}
console.log(kind(null), kind([1]), kind(3), kind("x"));`,
    s: R`function kind(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}
console.log(kind(null), kind([1]), kind(3), kind("x"));`,
    o: "null array number string" }] },
operators: { e: "⚖️", k: "Compare with <code>===</code>. <code>??</code> falls back only on null/undefined; <code>?.</code> stops safely at null/undefined.",
  r: ["<code>+</code> with a string joins; <code>- * /</code> convert to numbers.", "Falsy: false, 0, \"\", null, undefined, NaN (and 0n, -0).", "<code>0 || 5</code> is 5 but <code>0 ?? 5</code> is 0."],
  q: ["What is 0 ?? 10?", ["10", "0", "null", "undefined"], 1, "?? only replaces null and undefined, and 0 is neither."],
  p: [{ t: "Fix the defaults so a real volume of <code>0</code> is kept.",
    c: R`function volumeOf(settings) {
  return settings.volume || 50;   // TODO: 0 should stay 0
}
console.log(volumeOf({ volume: 0 }), volumeOf({}));`,
    s: R`function volumeOf(settings) {
  return settings.volume ?? 50;
}
console.log(volumeOf({ volume: 0 }), volumeOf({}));`,
    o: "0 50" }] },
strings: { e: "🔤", k: "Strings are immutable: methods return new strings. Template literals embed expressions with <code>${…}</code>.",
  r: ["<code>slice(start, end)</code> includes start, excludes end.", "<code>split</code> turns a string into an array; <code>join</code> goes back.", "Negative indexes: <code>s.at(-1)</code>, <code>s.slice(-3)</code>."],
  q: ["What is \"hello\".slice(1, 3)?", ["\"hel\"", "\"el\"", "\"ell\"", "\"he\""], 1, "Index 1 up to (not including) 3."],
  p: [{ t: "Write <code>initials(name)</code> that turns <code>\"ada lovelace\"</code> into <code>\"A.L.\"</code>.",
    c: R`function initials(name) {
  // TODO: split, take first letters, upper-case, join with dots
}
console.log(initials("ada lovelace"), initials("grace brewster hopper"));`,
    s: R`function initials(name) {
  return name.split(" ").map(w => w[0].toUpperCase() + ".").join("");
}
console.log(initials("ada lovelace"), initials("grace brewster hopper"));`,
    o: "A.L. G.B.H." }] },
conditions: { e: "🔀", k: "<code>if / else if / else</code> runs the <b>first</b> true branch only. Use a ternary for a choice between two values, <code>switch</code> for many exact matches.",
  r: ["Return early (guard clauses) to avoid deep nesting.", "<code>switch</code> needs <code>break</code> or <code>return</code> to stop fall-through.", "Non-empty strings like <code>\"0\"</code> are truthy."],
  q: ["Temperature 20: which runs? if (t > 30) A else if (t > 15) B else C", ["A", "B", "C", "B and C"], 1, "20 > 30 is false, 20 > 15 is true, so B, and nothing after it."],
  p: [{ t: "Return <code>\"child\"</code> under 13, <code>\"teen\"</code> under 20, otherwise <code>\"adult\"</code>.",
    c: R`function ageGroup(age) {
  // TODO
}
console.log(ageGroup(8), ageGroup(15), ageGroup(42));`,
    s: R`function ageGroup(age) {
  if (age < 13) return "child";
  if (age < 20) return "teen";
  return "adult";
}
console.log(ageGroup(8), ageGroup(15), ageGroup(42));`,
    o: "child teen adult" }] },
loops: { e: "🔁", k: "<code>for…of</code> for values, the counting <code>for</code> for indexes, <code>while</code> for \"until something happens\", <code>for…in</code> for object keys.",
  r: ["<code>break</code> leaves a loop; <code>continue</code> skips one round.", "Don't use <code>for…in</code> on arrays.", "Make sure a <code>while</code> condition can become false."],
  q: ["Which loop is best to print every item of an array?", ["for…in", "for…of", "do…while", "switch"], 1, "for…of gives each value directly."],
  p: [{ t: "Sum only the even numbers in <code>nums</code> with a loop.",
    c: R`const nums = [3, 8, 5, 10, 7, 2];
let sum = 0;
// TODO
console.log(sum);`,
    s: R`const nums = [3, 8, 5, 10, 7, 2];
let sum = 0;
for (const n of nums) {
  if (n % 2 === 0) sum += n;
}
console.log(sum);`,
    o: "20" }] },
arrays: { e: "📚", k: "Arrays are ordered lists indexed from 0. push/pop work at the end, shift/unshift at the start; slice copies, splice edits.",
  r: ["Default <code>sort()</code> compares strings: pass <code>(a, b) =&gt; a - b</code>.", "<code>toSorted</code>, <code>toReversed</code>, <code>with</code> return copies.", "<code>[...new Set(arr)]</code> removes duplicates."],
  q: ["What does [1, 2, 3].pop() return?", ["[1, 2]", "3", "1", "undefined"], 1, "pop removes the last item and returns it."],
  p: [{ t: "Return the three highest scores, highest first, without changing <code>scores</code>.",
    c: R`const scores = [72, 95, 88, 61, 99, 84];
const top3 = scores; // TODO
console.log(top3, scores.length);`,
    s: R`const scores = [72, 95, 88, 61, 99, 84];
const top3 = scores.toSorted((a, b) => b - a).slice(0, 3);
console.log(top3, scores.length);`,
    o: "[ 99, 95, 88 ] 6" }] },
objects: { e: "🗂️", k: "Objects group named values. Read with <code>o.key</code> or <code>o[expr]</code>; loop with <code>Object.entries</code>; copy with <code>{ ...o }</code>.",
  r: ["Missing properties read as <code>undefined</code>.", "A function stored on an object is a method.", "<code>{ ...a, ...b }</code>: later properties win."],
  q: ["How do you read a property whose name is in the variable key?", ["obj.key", "obj[key]", "obj->key", "obj(key)"], 1, "Brackets evaluate the expression inside."],
  p: [{ t: "Count how many times each fruit appears, into an object.",
    c: R`const basket = ["apple", "pear", "apple", "fig", "apple", "pear"];
const counts = {};
// TODO
console.log(counts);`,
    s: R`const basket = ["apple", "pear", "apple", "fig", "apple", "pear"];
const counts = {};
for (const fruit of basket) counts[fruit] = (counts[fruit] ?? 0) + 1;
console.log(counts);`,
    o: "{ apple: 3, pear: 2, fig: 1 }" }] },
functions: { e: "🧩", k: "Functions take parameters and return a value. They are values too: store them, pass them, return them.",
  r: ["No <code>return</code> means the function returns <code>undefined</code>.", "Defaults: <code>(x = 1)</code>; rest: <code>(...args)</code>.", "Arrow functions: <code>x =&gt; x * 2</code>."],
  q: ["What does const f = x => { x * 2 }; f(3) return?", ["6", "undefined", "NaN", "3"], 1, "With braces you need an explicit return."],
  p: [{ t: "Write <code>average(...nums)</code> that returns the mean, or 0 when called with no numbers.",
    c: R`function average(...nums) {
  // TODO
}
console.log(average(2, 4, 9), average());`,
    s: R`function average(...nums) {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}
console.log(average(2, 4, 9), average());`,
    o: "5 0" }] },
scope: { e: "🔭", k: "<code>let</code>/<code>const</code> live in their block. Lookups walk outward through enclosing scopes to the global scope.",
  r: ["Inner names can shadow outer ones.", "Function declarations are hoisted; let/const are not usable before their line.", "Each loop round gets its own <code>let</code> variable."],
  q: ["Is a const declared inside an if-block visible after the block?", ["Yes", "No", "Only in strict mode", "Only if exported"], 1, "const and let are block-scoped."],
  p: [{ t: "This prints <code>3 3 3</code>. Change one word so it prints <code>0 1 2</code>.",
    c: R`const fns = [];
for (var i = 0; i < 3; i++) fns.push(() => i);
console.log(...fns.map(f => f()));`,
    s: R`const fns = [];
for (let i = 0; i < 3; i++) fns.push(() => i);
console.log(...fns.map(f => f()));`,
    o: "0 1 2" }] },
errors: { e: "🛟", k: "Throw an <code>Error</code> when something is wrong; catch it where you can handle it; put must-run cleanup in <code>finally</code>.",
  r: ["Throw <code>new Error(msg)</code> (or a subclass), not strings.", "Re-throw errors you can't handle.", "Use <code>{ cause }</code> to wrap a lower-level error."],
  q: ["When does finally run?", ["Only after errors", "Only on success", "Always", "Never with return"], 2, "finally runs after try or catch, whatever happened."],
  p: [{ t: "Make <code>toNumber</code> throw a <code>TypeError</code> for non-numeric text, and print the error message.",
    c: R`function toNumber(text) {
  const n = Number(text);
  // TODO: throw a TypeError when n is NaN
  return n;
}
try {
  console.log(toNumber("12"));
  console.log(toNumber("twelve"));
} catch (err) {
  console.log(err.name, err.message);
}`,
    s: R`function toNumber(text) {
  const n = Number(text);
  if (Number.isNaN(n)) throw new TypeError(\`"\${text}" is not a number\`);
  return n;
}
try {
  console.log(toNumber("12"));
  console.log(toNumber("twelve"));
} catch (err) {
  console.log(err.name, err.message);
}`,
    o: "12  then  TypeError \"twelve\" is not a number" }] },
arraymethods: { e: "🧪", k: "<code>filter</code> keeps, <code>map</code> transforms, <code>reduce</code> combines. Each returns something new, so you can chain them.",
  r: ["<code>find</code> returns the first match or undefined.", "<code>some</code>/<code>every</code> answer yes/no questions.", "Always give <code>reduce</code> a starting value."],
  q: ["What does [1, 2, 3, 4].filter(n => n > 2) return?", ["[3, 4]", "[false, false, true, true]", "2", "[1, 2]"], 0, "filter keeps the items whose test returns true."],
  p: [{ t: "Get the names of in-stock items under $100, sorted alphabetically.",
    c: R`const items = [
  { name: "Mouse", price: 25, stock: 3 },
  { name: "Monitor", price: 180, stock: 2 },
  { name: "Cable", price: 9, stock: 0 },
  { name: "Keyboard", price: 60, stock: 5 },
];
const result = items; // TODO: filter, filter, map, sort
console.log(result);`,
    s: R`const items = [
  { name: "Mouse", price: 25, stock: 3 },
  { name: "Monitor", price: 180, stock: 2 },
  { name: "Cable", price: 9, stock: 0 },
  { name: "Keyboard", price: 60, stock: 5 },
];
const result = items
  .filter(i => i.stock > 0 && i.price < 100)
  .map(i => i.name)
  .toSorted();
console.log(result);`,
    o: "[ 'Keyboard', 'Mouse' ]" }] },
destructuring: { e: "📦", k: "Destructuring pulls values out by position (arrays) or name (objects). <code>...</code> spreads values out, or collects the rest.",
  r: ["Rename with <code>{ a: newName }</code>, default with <code>{ a = 1 }</code>.", "Destructure parameters for named options.", "Spread copies are shallow."],
  q: ["const [a, ...b] = [1, 2, 3]: what is b?", ["2", "[2, 3]", "[1, 2, 3]", "3"], 1, "Rest collects the remaining items into an array."],
  p: [{ t: "Use destructuring in the parameter list to print <code>Ada (admin)</code>, and default the role to <code>\"user\"</code>.",
    c: R`function badge(person) {
  // TODO: destructure name and role (default "user")
  return person.name;
}
console.log(badge({ name: "Ada", role: "admin" }), badge({ name: "Linus" }));`,
    s: R`function badge({ name, role = "user" }) {
  return \`\${name} (\${role})\`;
}
console.log(badge({ name: "Ada", role: "admin" }), badge({ name: "Linus" }));`,
    o: "Ada (admin) Linus (user)" }] },
closures: { e: "🎒", k: "A function remembers the variables from where it was created. That makes private state and function factories possible.",
  r: ["Each call to the outer function creates a fresh scope.", "Variables in a closure are private.", "Closures keep their scope alive as long as they exist."],
  q: ["Two counters made by makeCounter(): do they share count?", ["Yes", "No", "Only if const", "Only the first time"], 1, "Each call creates a separate scope."],
  p: [{ t: "Write <code>makeAdder(n)</code> returning a function that adds <code>n</code> to its argument.",
    c: R`function makeAdder(n) {
  // TODO
}
const add5 = makeAdder(5), add10 = makeAdder(10);
console.log(add5(1), add10(1), add5(add10(0)));`,
    s: R`function makeAdder(n) {
  return x => x + n;
}
const add5 = makeAdder(5), add10 = makeAdder(10);
console.log(add5(1), add10(1), add5(add10(0)));`,
    o: "6 11 15" }] },
classes: { e: "🏗️", k: "A class is a blueprint: <code>constructor</code> sets up each instance, methods are shared, <code>extends</code> + <code>super</code> build on a parent, <code>#fields</code> stay private.",
  r: ["Call <code>super()</code> before using <code>this</code> in a subclass.", "Getters look like properties: <code>r.area</code>.", "<code>static</code> members belong to the class, not instances."],
  q: ["What must a subclass constructor do before touching this?", ["return", "call super()", "call new", "nothing"], 1, "The parent constructor has to build the object first."],
  p: [{ t: "Add a <code>Square</code> class that extends <code>Rect</code> and needs only one side.",
    c: R`class Rect {
  constructor(w, h) { this.w = w; this.h = h; }
  get area() { return this.w * this.h; }
}
// TODO: class Square extends Rect
const sq = new Square(4);
console.log(sq.area, sq instanceof Rect);`,
    s: R`class Rect {
  constructor(w, h) { this.w = w; this.h = h; }
  get area() { return this.w * this.h; }
}
class Square extends Rect {
  constructor(side) { super(side, side); }
}
const sq = new Square(4);
console.log(sq.area, sq instanceof Rect);`,
    o: "16 true" }] },
prototypes: { e: "⛓️", k: "Objects link to a prototype. Missing properties are looked up along that chain; class methods live on <code>Class.prototype</code>.",
  r: ["<code>Object.hasOwn(o, k)</code>: own property, not inherited.", "<code>Object.create(proto)</code> makes an object with that prototype.", "The chain ends at <code>Object.prototype</code> → null."],
  q: ["Where is a method defined in a class body stored?", ["On each instance", "On Class.prototype", "In a global table", "On Object"], 1, "One shared copy on the prototype."],
  p: [{ t: "Create <code>cat</code> with <code>Object.create(animal)</code> so <code>cat.speak()</code> works, then print whether <code>speak</code> is an own property.",
    c: R`const animal = { speak() { return this.sound + "!"; } };
const cat = {}; // TODO: use Object.create
cat.sound = "Meow";
console.log(cat.speak(), Object.hasOwn(cat, "speak"));`,
    s: R`const animal = { speak() { return this.sound + "!"; } };
const cat = Object.create(animal);
cat.sound = "Meow";
console.log(cat.speak(), Object.hasOwn(cat, "speak"));`,
    o: "Meow! false" }] },
this: { e: "👉", k: "<code>this</code> is set by <b>how</b> a function is called. Arrow functions borrow it from the surrounding code.",
  r: ["<code>obj.method()</code> → this is obj.", "A detached method loses this: bind it or wrap it in an arrow.", "<code>bind</code> returns a new function with this fixed."],
  q: ["const f = user.greet; f() — what is this inside greet (strict mode)?", ["user", "undefined", "window", "f"], 1, "Called on its own, there is no object before the dot."],
  p: [{ t: "The timer loses <code>this</code>. Fix it so it prints <code>Ada</code>.",
    c: R`const user = {
  name: "Ada",
  show() { console.log(this?.name); },
};
setTimeout(user.show, 10);   // TODO: fix`,
    s: R`const user = {
  name: "Ada",
  show() { console.log(this?.name); },
};
setTimeout(() => user.show(), 10);`,
    o: "Ada" }] },
collections: { e: "🧺", k: "Set = unique values. Map = key → value with any key type, insertion order and a <code>size</code>.",
  r: ["<code>map.get(k) ?? 0</code> for counting.", "Convert: <code>new Map(Object.entries(o))</code> and <code>Object.fromEntries(m)</code>.", "WeakMap keys don't stop garbage collection."],
  q: ["What is new Set([1, 1, 2]).size?", ["3", "2", "1", "undefined"], 1, "Duplicates are stored once."],
  p: [{ t: "Using a Map, count letters in <code>\"banana\"</code> and print the entries as an array.",
    c: R`const counts = new Map();
// TODO: loop over "banana"
console.log([...counts]);`,
    s: R`const counts = new Map();
for (const ch of "banana") counts.set(ch, (counts.get(ch) ?? 0) + 1);
console.log([...counts]);`,
    o: "[ [ 'b', 1 ], [ 'a', 3 ], [ 'n', 2 ] ]" }] },
iterators: { e: "🔄", k: "Iterables work with <code>for…of</code> and spread. Generators (<code>function*</code>) produce values lazily with <code>yield</code>.",
  r: ["A generator's body runs only when <code>next()</code> is called.", "Infinite generators are fine if you stop taking values.", "<code>*[Symbol.iterator]()</code> makes a class iterable."],
  q: ["What does calling function* g() {} return?", ["undefined", "A generator object", "An array", "A promise"], 1, "Nothing in the body runs until next()."],
  p: [{ t: "Write a generator <code>evens(limit)</code> that yields 0, 2, 4… up to and including <code>limit</code>.",
    c: R`function* evens(limit) {
  // TODO
}
console.log([...evens(10)]);`,
    s: R`function* evens(limit) {
  for (let n = 0; n <= limit; n += 2) yield n;
}
console.log([...evens(10)]);`,
    o: "[ 0, 2, 4, 6, 8, 10 ]" }] },
json: { e: "🗒️", k: "JSON is text: <code>stringify</code> to send or store, <code>parse</code> to read. Dates are milliseconds; format them with <code>Intl</code>.",
  r: ["undefined and functions are dropped by stringify.", "Dates become strings in JSON.", "<code>new Date(y, m, d)</code>: months start at 0."],
  q: ["typeof JSON.parse(JSON.stringify({ d: new Date() })).d is…", ["\"object\"", "\"string\"", "\"number\"", "\"date\""], 1, "Dates turn into ISO strings."],
  p: [{ t: "Save <code>settings</code> as pretty JSON (2 spaces), parse it back and print the theme.",
    c: R`const settings = { theme: "dark", fontSize: 16 };
const text = ""; // TODO
const back = {}; // TODO
console.log(text);
console.log(back.theme);`,
    s: R`const settings = { theme: "dark", fontSize: 16 };
const text = JSON.stringify(settings, null, 2);
const back = JSON.parse(text);
console.log(text);
console.log(back.theme);`,
    o: "the JSON on 4 lines, then dark" }] },
modules: { e: "📁", k: "Each module has its own scope and shares through <code>export</code>/<code>import</code>. Browsers need <code>type=\"module\"</code>.",
  r: ["Named imports use <code>{ }</code> and exact names.", "One default export per module.", "<code>import()</code> loads a module on demand and returns a promise."],
  q: ["How many default exports can a module have?", ["None", "One", "Two", "Any number"], 1, "One default, any number of named exports."],
  p: [{ t: "The module pattern: make <code>count</code> private and expose only <code>add</code> and <code>total</code>.",
    c: R`const cart = (() => {
  // TODO: a private count and two functions
  return {};
})();
cart.add(2); cart.add(3);
console.log(cart.total(), cart.count);`,
    s: R`const cart = (() => {
  let count = 0;
  return { add: n => { count += n; }, total: () => count };
})();
cart.add(2); cart.add(3);
console.log(cart.total(), cart.count);`,
    o: "5 undefined" }] },
eventloop: { e: "🎡", k: "One thread runs your code. When the stack is empty the event loop runs <b>all microtasks</b> (promises), then <b>one task</b> (timer, event), and repeats.",
  r: ["<code>setTimeout(f, 0)</code> still waits for the stack and all microtasks.", "Long synchronous loops freeze everything.", "Order: sync → microtasks → tasks."],
  q: ["Output order of: log(1); setTimeout(log 2); Promise.resolve().then(log 3); log(4)", ["1 2 3 4", "1 4 3 2", "1 4 2 3", "1 3 4 2"], 1, "Sync 1 and 4, then the microtask 3, then the timer task 2."],
  p: [{ t: "Predict the output, then run. Change it so <code>\"timer\"</code> prints before <code>\"promise\"</code> by delaying the promise with a timer of its own.",
    c: R`setTimeout(() => console.log("timer"), 0);
Promise.resolve().then(() => console.log("promise"));`,
    s: R`setTimeout(() => console.log("timer"), 0);
new Promise(r => setTimeout(r, 10)).then(() => console.log("promise"));`,
    o: "timer, then promise" }] },
promises: { e: "🤝", k: "A promise is pending, then fulfilled or rejected, once. Chain with <code>then</code>, handle with <code>catch</code>, combine with <code>Promise.all</code>.",
  r: ["Each <code>then</code> returns a new promise.", "<code>Promise.all</code> fails fast; <code>allSettled</code> waits for everything.", "Always handle rejections."],
  q: ["Promise.all([p1, p2]) when p2 rejects:", ["fulfils with p1's value", "rejects", "waits forever", "fulfils with undefined"], 1, "all rejects as soon as one rejects."],
  p: [{ t: "Write <code>delay(ms, value)</code> returning a promise, then print both values with <code>Promise.all</code>.",
    c: R`function delay(ms, value) {
  // TODO: return a promise that resolves to value after ms
}
Promise.all([delay(100, "a"), delay(50, "b")]).then(values => console.log(values));`,
    s: R`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
Promise.all([delay(100, "a"), delay(50, "b")]).then(values => console.log(values));`,
    o: "[ 'a', 'b' ]" }] },
async: { e: "⏳", k: "<code>async</code> functions return promises; <code>await</code> pauses only that function. Start independent work together with <code>Promise.all</code>.",
  r: ["Use <code>try/catch</code> around <code>await</code>.", "Sequential awaits add up; <code>Promise.all</code> overlaps.", "<code>forEach</code> doesn't wait for async callbacks: use <code>for…of</code>."],
  q: ["async function f() { return 5 } — what does f() return?", ["5", "A promise of 5", "undefined", "An error"], 1, "async always wraps the result in a promise."],
  p: [{ t: "Make <code>loadAll</code> run both loads at the same time (it should take about 200 ms, not 400).",
    c: R`const load = (name, ms) => new Promise(r => setTimeout(() => r(name), ms));
async function loadAll() {
  const a = await load("users", 200);   // TODO: start both together
  const b = await load("posts", 200);
  return [a, b];
}
console.time("loadAll");
console.log(await loadAll());
console.timeEnd("loadAll");`,
    s: R`const load = (name, ms) => new Promise(r => setTimeout(() => r(name), ms));
async function loadAll() {
  return Promise.all([load("users", 200), load("posts", 200)]);
}
console.time("loadAll");
console.log(await loadAll());
console.timeEnd("loadAll");`,
    o: "[ 'users', 'posts' ] then about 200ms" }] },
fetch: { e: "🌐", k: "<code>await fetch(url)</code> gives a Response; check <code>res.ok</code>, then <code>await res.json()</code>. fetch only rejects on network failure.",
  r: ["Build URLs with <code>new URL()</code> and <code>searchParams</code>.", "POST JSON: method, Content-Type header, <code>JSON.stringify</code> body.", "Abort slow requests with <code>AbortController</code>."],
  q: ["Does fetch reject when the server returns 404?", ["Yes", "No", "Only for POST", "Only in Node.js"], 1, "Check res.ok or res.status yourself."],
  p: [{ t: "Fetch user 3 from JSONPlaceholder and print their name and city (needs internet).",
    c: R`const res = await fetch("https://jsonplaceholder.typicode.com/users/3");
// TODO: check res.ok, parse JSON, print name and address.city`,
    s: R`const res = await fetch("https://jsonplaceholder.typicode.com/users/3");
if (!res.ok) throw new Error("HTTP " + res.status);
const user = await res.json();
console.log(user.name, "-", user.address.city);`,
    o: "Clementine Bauch - McKenziehaven" }] },
dom: { e: "🌳", k: "The DOM is the page as objects. Select with <code>querySelector</code>, change with <code>textContent</code>, <code>classList</code>, <code>style</code>, build with <code>createElement</code> + <code>append</code>.",
  r: ["<code>textContent</code> for user text; <code>innerHTML</code> only for trusted HTML.", "<code>querySelectorAll</code> returns a list: loop with for…of.", "Render from data: clear, then rebuild."],
  q: ["Which is safe for text typed by a user?", ["innerHTML", "textContent", "outerHTML", "document.write"], 1, "textContent never parses HTML."],
  p: [{ t: "Builders often produce HTML strings. Write <code>escapeHtml</code> so user text can't inject tags.",
    c: R`function escapeHtml(text) {
  // TODO: replace & < > " with entities
  return text;
}
console.log(\`<li>\${escapeHtml('<img src=x onerror="alert(1)">')}</li>\`);`,
    s: R`function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
console.log(\`<li>\${escapeHtml('<img src=x onerror="alert(1)">')}</li>\`);`,
    o: "<li>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</li>" }] },
events: { e: "🖱️", k: "<code>addEventListener</code> registers a handler; the event object says what happened. Events bubble, so one parent listener can handle many children.",
  r: ["<code>event.preventDefault()</code> stops form reloads and link navigation.", "<code>event.target.closest(sel)</code> finds the element you care about.", "<code>input</code> fires per keystroke, <code>change</code> when committed."],
  q: ["Why does event delegation work?", ["Events are global", "Events bubble up to ancestors", "Listeners are copied to children", "It uses timers"], 1, "A click on a child also reaches its parents."],
  p: [{ t: "Implement a tiny <code>on/emit</code> event system on an object, and remove a listener with the returned function.",
    c: R`function createEvents() {
  const listeners = {};
  return {
    on(name, fn) { /* TODO: store fn; return a function that removes it */ },
    emit(name, data) { /* TODO: call each listener with data */ },
  };
}
const ev = createEvents();
const off = ev.on("click", d => console.log("clicked", d));
ev.emit("click", 1);
off();
ev.emit("click", 2);`,
    s: R`function createEvents() {
  const listeners = {};
  return {
    on(name, fn) {
      (listeners[name] ??= []).push(fn);
      return () => { listeners[name] = listeners[name].filter(f => f !== fn); };
    },
    emit(name, data) { (listeners[name] ?? []).forEach(fn => fn(data)); },
  };
}
const ev = createEvents();
const off = ev.on("click", d => console.log("clicked", d));
ev.emit("click", 1);
off();
ev.emit("click", 2);`,
    o: "clicked 1" }] },
regex: { e: "🔍", k: "A regex describes a text pattern: <code>test</code> to check, <code>match</code>/<code>matchAll</code> to extract, <code>replace</code> to rewrite. Flags: g, i, m, u.",
  r: ["<code>\\d</code> digit, <code>\\w</code> word char, <code>\\s</code> space.", "Groups <code>( )</code> capture; named groups <code>(?&lt;name&gt; )</code>.", "Anchor with <code>^</code> and <code>$</code> to match the whole string."],
  q: ["Which matches only a whole 5-digit string?", ["/\\d{5}/", "/^\\d{5}$/", "/[0-5]/", "/\\d+/"], 1, "Without anchors, any 5 digits inside a longer string match."],
  p: [{ t: "Extract all hashtags (without the #) from the text.",
    c: R`const text = "Loving #JavaScript and #regex today! #100DaysOfCode";
const tags = []; // TODO: matchAll with a group
console.log(tags);`,
    s: R`const text = "Loving #JavaScript and #regex today! #100DaysOfCode";
const tags = [...text.matchAll(/#(\w+)/g)].map(m => m[1]);
console.log(tags);`,
    o: "[ 'JavaScript', 'regex', '100DaysOfCode' ]" }] },
copying: { e: "🧬", k: "Assignment shares. Spread copies one level. <code>structuredClone</code> copies everything. Immutable updates build new objects and share unchanged parts.",
  r: ["<code>{ ...o }</code> and <code>[...a]</code> are shallow.", "<code>Object.freeze</code> is shallow too.", "Update nested data by spreading each level you change."],
  q: ["After const b = { ...a }, does b.list === a.list?", ["true", "false", "Only for arrays", "TypeError"], 0, "A shallow copy keeps the same nested references."],
  p: [{ t: "Return a new state with <code>user.address.city</code> set to <code>\"Paris\"</code>, without changing <code>state</code>.",
    c: R`const state = { user: { name: "Ada", address: { city: "London", zip: "N1" } } };
const next = state; // TODO
console.log(state.user.address.city, next.user.address.city, next.user.address.zip);`,
    s: R`const state = { user: { name: "Ada", address: { city: "London", zip: "N1" } } };
const next = { ...state, user: { ...state.user, address: { ...state.user.address, city: "Paris" } } };
console.log(state.user.address.city, next.user.address.city, next.user.address.zip);`,
    o: "London Paris N1" }] },
patterns: { e: "🧰", k: "Debounce waits for a pause, throttle limits the rate, <code>pipe</code> composes functions, emitters decouple parts of an app.",
  r: ["Search boxes: debounce.", "Scroll/resize handlers: throttle.", "Small pure functions compose into big ones."],
  q: ["pipe(f, g, h)(x) equals…", ["f(g(h(x)))", "h(g(f(x)))", "f(x) + g(x) + h(x)", "[f(x), g(x), h(x)]"], 1, "pipe applies left to right."],
  p: [{ t: "Write <code>debounce</code> so only the last call (\"abc\") is logged.",
    c: R`function debounce(fn, ms) {
  // TODO: return a function that resets a timer on every call
}
const log = debounce(q => console.log("search:", q), 50);
log("a"); log("ab"); log("abc");`,
    s: R`function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
const log = debounce(q => console.log("search:", q), 50);
log("a"); log("ab"); log("abc");`,
    o: "search: abc" }] },
tooling: { e: "🛠️", k: "Real projects use Node.js, npm scripts in <code>package.json</code>, a dev server like Vite, and ESLint/Prettier for quality.",
  r: ["Commit <code>package-lock.json</code>, never <code>node_modules</code>.", "<code>npm run &lt;script&gt;</code> runs package.json scripts.", "DevTools: console, breakpoints, network tab."],
  q: ["Which file lists a project's dependencies and scripts?", ["index.html", "package.json", ".gitignore", "node_modules"], 1, "package.json is the project manifest."],
  p: [{ t: "Parse a version string like <code>\"^6.2.1\"</code> into numbers, ignoring the leading symbol.",
    c: R`function parseVersion(v) {
  // TODO: return { major, minor, patch } as numbers
}
console.log(parseVersion("^6.2.1"), parseVersion("~0.10.12"));`,
    s: R`function parseVersion(v) {
  const [major, minor, patch] = v.replace(/^[^\d]+/, "").split(".").map(Number);
  return { major, minor, patch };
}
console.log(parseVersion("^6.2.1"), parseVersion("~0.10.12"));`,
    o: "{ major: 6, minor: 2, patch: 1 } { major: 0, minor: 10, patch: 12 }" }] },
testing: { e: "✅", k: "Tests call your code with known inputs and check outputs. Node has <code>node --test</code>; Vitest and Jest work the same way.",
  r: ["Test behavior and edge cases, not internals.", "Pure functions are easiest to test.", "Fake slow or external things (mocks)."],
  q: ["Which command runs Node's built-in test runner?", ["node test", "node --test", "npm start", "npx run-tests"], 1, "node --test finds and runs *.test.js files."],
  p: [{ t: "Write <code>assertEqual(actual, expected, name)</code> that logs ✓ or ✗ with the name, then fix the bug it finds in <code>max</code>.",
    c: R`function max(nums) {
  let best = 0;                 // bug!
  for (const n of nums) if (n > best) best = n;
  return best;
}
function assertEqual(actual, expected, name) {
  // TODO
}
assertEqual(max([3, 7, 2]), 7, "positive numbers");
assertEqual(max([-5, -2, -9]), -2, "negative numbers");`,
    s: R`function max(nums) {
  let best = -Infinity;
  for (const n of nums) if (n > best) best = n;
  return best;
}
function assertEqual(actual, expected, name) {
  console.log(actual === expected ? "✓" : "✗", name, actual === expected ? "" : \`(got \${actual}, expected \${expected})\`);
}
assertEqual(max([3, 7, 2]), 7, "positive numbers");
assertEqual(max([-5, -2, -9]), -2, "negative numbers");`,
    o: "✓ positive numbers  ✓ negative numbers" }] },
"p-tip": { e: "🧾", k: "Separate the <b>math</b> (a pure, testable function) from the <b>page</b> (read inputs → compute → show). Work in cents.",
  r: ["<code>valueAsNumber</code> reads number inputs as numbers.", "One <code>update()</code> renders everything from the inputs.", "Round shares up so the total is always covered."],
  q: ["Why convert the bill to cents first?", ["It's faster", "Floating-point can't store 0.1 exactly", "Intl needs cents", "To round down"], 1, "Integer cents avoid 0.1 + 0.2 style errors."],
  p: [{ t: "Extension: add a <code>roundUp</code> option that rounds each share up to a whole dollar.",
    c: R`function calcSplit(bill, tipPct, people, roundUp = false) {
  const totalCents = Math.round(bill * 100 * (1 + tipPct / 100));
  let eachCents = Math.ceil(totalCents / people);
  // TODO: when roundUp is true, round eachCents up to the next multiple of 100
  return eachCents / 100;
}
console.log(calcSplit(84.5, 15, 3), calcSplit(84.5, 15, 3, true));`,
    s: R`function calcSplit(bill, tipPct, people, roundUp = false) {
  const totalCents = Math.round(bill * 100 * (1 + tipPct / 100));
  let eachCents = Math.ceil(totalCents / people);
  if (roundUp) eachCents = Math.ceil(eachCents / 100) * 100;
  return eachCents / 100;
}
console.log(calcSplit(84.5, 15, 3), calcSplit(84.5, 15, 3, true));`,
    o: "32.4 33" }] },
"p-todo": { e: "📝", k: "Keep all data in one array, change it only through small pure functions, and re-render the list after every change.",
  r: ["One <code>setTodos()</code> saves and renders.", "Delegation: one click listener on the list.", "<code>textContent</code> for the task text."],
  q: ["Why use one listener on the <ul> instead of one per item?", ["It's required", "It also works for items added later", "It's the only way to get e.target", "localStorage needs it"], 1, "New items need no new listeners."],
  p: [{ t: "Extension: write <code>editTodo(list, id, text)</code> that returns a new list with that task's text changed (trimmed), ignoring empty text.",
    c: R`const todos = [{ id: 1, text: "Milk", done: false }, { id: 2, text: "Bread", done: true }];
function editTodo(list, id, text) {
  // TODO
}
console.log(editTodo(todos, 2, "  Rye bread "), editTodo(todos, 1, "   ")[0].text);`,
    s: R`const todos = [{ id: 1, text: "Milk", done: false }, { id: 2, text: "Bread", done: true }];
function editTodo(list, id, text) {
  const clean = text.trim();
  if (!clean) return list;
  return list.map(t => (t.id === id ? { ...t, text: clean } : t));
}
console.log(editTodo(todos, 2, "  Rye bread "), editTodo(todos, 1, "   ")[0].text);`,
    o: "[ { id: 1, text: 'Milk', done: false }, { id: 2, text: 'Rye bread', done: true } ] Milk" }] },
"p-quiz": { e: "❓", k: "Content is data, the game moves through states, and every timer must be cleared before a new one starts.",
  r: ["Fisher–Yates shuffle is fair; sort with random is not.", "A timeout and a click share one <code>answer()</code> path.", "Disable buttons once answered."],
  q: ["What happens if you never call clearInterval between questions?", ["Nothing", "Several timers run and the countdown speeds up", "The quiz restarts", "An error"], 1, "Each question would add another interval."],
  p: [{ t: "Extension: score with a time bonus: 100 points for a right answer plus 10 per second left; wrong answers score 0.",
    c: R`function points(correct, secondsLeft) {
  // TODO
}
console.log(points(true, 12), points(true, 0), points(false, 9));`,
    s: R`function points(correct, secondsLeft) {
  return correct ? 100 + 10 * secondsLeft : 0;
}
console.log(points(true, 12), points(true, 0), points(false, 9));`,
    o: "220 100 0" }] },
"p-expense": { e: "💸", k: "Group and total with <code>reduce</code>, keep money in cents, validate at the edge, and draw bars as percentage widths.",
  r: ["<code>Object.fromEntries(new FormData(form))</code> reads a form.", "Validation returns a list of messages.", "Bars: <code>width = part / total × 100%</code>."],
  q: ["What does validate() return when the input is fine?", ["true", "An empty array", "null", "The expense"], 1, "No messages means valid."],
  p: [{ t: "Extension: total spending per month from expenses with ISO dates.",
    c: R`const expenses = [
  { date: "2026-10-03", cents: 1200 }, { date: "2026-10-21", cents: 800 },
  { date: "2026-11-02", cents: 4500 },
];
const byMonth = {}; // TODO: key "2026-10" etc., values in dollars
console.log(byMonth);`,
    s: R`const expenses = [
  { date: "2026-10-03", cents: 1200 }, { date: "2026-10-21", cents: 800 },
  { date: "2026-11-02", cents: 4500 },
];
const byMonth = expenses.reduce((acc, e) => {
  const month = e.date.slice(0, 7);
  acc[month] = (acc[month] ?? 0) + e.cents / 100;
  return acc;
}, {});
console.log(byMonth);`,
    o: "{ '2026-10': 20, '2026-11': 45 }" }] },
"p-weather": { e: "🌦️", k: "Chain requests with <code>await</code>, check every response, show loading and error states, and ignore answers from outdated requests.",
  r: ["<code>URLSearchParams</code> builds query strings safely.", "Zip parallel arrays into objects with <code>map</code>.", "<code>finally</code> re-enables the button."],
  q: ["Why keep a 'latest request id'?", ["To cache results", "Responses can arrive out of order", "The API needs it", "To count searches"], 1, "Only the newest search may update the page."],
  p: [{ t: "Extension: convert the daily maximums from °C to °F (rounded) and find the warmest day.",
    c: R`const daily = { time: ["2026-11-25", "2026-11-26", "2026-11-27"], temperature_2m_max: [6.2, 9.8, 4.1] };
// TODO: build [{ date, f }] and find the warmest
`,
    s: R`const daily = { time: ["2026-11-25", "2026-11-26", "2026-11-27"], temperature_2m_max: [6.2, 9.8, 4.1] };
const days = daily.time.map((date, i) => ({ date, f: Math.round(daily.temperature_2m_max[i] * 9 / 5 + 32) }));
const warmest = days.reduce((a, b) => (b.f > a.f ? b : a));
console.log(days, warmest.date);`,
    o: "… 2026-11-26" }] },
"p-memory": { e: "🃏", k: "Keep game rules in plain functions that return what happened; the page only draws state and forwards clicks.",
  r: ["Lock the board while a wrong pair shows.", "Ignore clicks on the same or matched card.", "Compute elapsed time from timestamps."],
  q: ["Why does handleClick return words like \"miss\" instead of changing the DOM?", ["It's faster", "Rules stay testable and UI-independent", "The DOM can't be changed in handlers", "To save memory"], 1, "The page decides how to show each outcome."],
  p: [{ t: "Extension: rate a finished game with stars: 3 stars for at most 10 moves, 2 for at most 16, otherwise 1.",
    c: R`function stars(moves) {
  // TODO
}
console.log(stars(8), stars(14), stars(30));`,
    s: R`function stars(moves) {
  if (moves <= 10) return "★★★";
  if (moves <= 16) return "★★☆";
  return "★☆☆";
}
console.log(stars(8), stars(14), stars(30));`,
    o: "★★★ ★★☆ ★☆☆" }] },
cheatsheet: { e: "📋" }
  }
};
})();
