/* Course mode for this page (see assets/course.js): which parts of the page are lessons,
   plus each lesson's key idea, Remember points, practice exercises and quick check.
   Code is written with R`...`: backslashes stay as written, and \` and \${ become a real backtick and ${
   (so practice code can use template literals without being filled in here). */
(() => {
const R = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, "$1");
const GROUPS = { Basics: 0, Intermediate: 1, Advanced: 2, Development: 3, Projects: 4, Reference: 5 };
window.COURSE = {
  key: "tsvis", title: "TypeScript, Visually", lang: "ts", barIn: ".top",
  parts: [
    { name: "Basics", color: "var(--good)" },
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
why: { e: "💡", k: "TypeScript checks your JavaScript for type mistakes <b>before</b> it runs, then erases the types and outputs plain JavaScript.",
  r: ["Types don't exist at run time.", "Every JavaScript program is (almost) a valid TypeScript program.", "Press <b>JS</b> on any block to see the compiled output."],
  q: ["What happens to type annotations when TypeScript compiles?", ["They become runtime checks", "They are erased", "They become comments", "They slow the code down"], 1, "tsc removes them; only JavaScript runs."],
  p: [{ t: "This has a type error. Read the message, fix the call, and run it.",
    c: R`function double(n: number): number {
  return n * 2;
}
console.log(double("21"));`,
    s: R`function double(n: number): number {
  return n * 2;
}
console.log(double(21));`,
    o: "✓ tsc: no type errors, then 42" }] },
basics: { e: "🔤", k: "Annotate with <code>: type</code> when TypeScript can't infer it. <code>let</code> widens to <code>string</code>; <code>const</code> keeps the literal <code>\"red\"</code>.",
  r: ["Prefer inference for initialised variables.", "Use <code>unknown</code>, not <code>any</code>, for values you must check.", "<code>void</code> = returns nothing; <code>never</code> = never returns."],
  q: ["What is the inferred type of: let size = 10;", ["10", "number", "any", "int"], 1, "let can be reassigned, so the literal widens to number."],
  p: [{ t: "In strict mode, parameters without types are errors (implicit <code>any</code>). Annotate them, give <code>discount</code> a default of 0, and declare the return type.",
    c: R`function lineTotal(price, qty, discount) {
  return price * qty - discount;
}
console.log(lineTotal(4.5, 3, 1).toFixed(2), lineTotal(2, 5).toFixed(2));`,
    s: R`function lineTotal(price: number, qty: number, discount = 0): number {
  return price * qty - discount;
}
console.log(lineTotal(4.5, 3, 1).toFixed(2), lineTotal(2, 5).toFixed(2));`,
    o: "12.50 10.00" }] },
objects: { e: "📐", k: "<code>T[]</code> for lists, tuples for fixed positions, object types for shapes. <code>?</code> marks optional, <code>readonly</code> blocks reassignment.",
  r: ["Optional properties are <code>T | undefined</code>.", "Tuples have a fixed length and order.", "<code>readonly string[]</code> has no push/pop."],
  q: ["Which type fits [\"Ada\", 36] exactly?", ["string[]", "[string, number]", "{ name: string }", "number[]"], 1, "A tuple: a string at 0, a number at 1."],
  p: [{ t: "Type <code>book</code> so that <code>subtitle</code> is optional and <code>isbn</code> can't be reassigned, then print it.",
    c: R`const book: { /* TODO */ } = { isbn: "978-0", title: "TS Basics" };
console.log(book.title, book.subtitle ?? "(no subtitle)");`,
    s: R`const book: { readonly isbn: string; title: string; subtitle?: string } = { isbn: "978-0", title: "TS Basics" };
console.log(book.title, book.subtitle ?? "(no subtitle)");`,
    o: "TS Basics (no subtitle)" }] },
functions: { e: "🧩", k: "Type every parameter; let returns be inferred or state them. Function types look like <code>(a: number) =&gt; string</code>.",
  r: ["Optional parameters (<code>x?</code>) come last.", "Defaults infer their type: <code>(n = 1)</code>.", "Callbacks get their parameter types from the function type."],
  q: ["What does (x: number) => void describe?", ["A number", "A function taking a number, returning nothing useful", "A void number", "An arrow class"], 1, "That's a function type."],
  p: [{ t: "Write <code>applyTwice</code> that takes a function <code>(n: number) =&gt; number</code> and a number, and applies the function twice.",
    c: R`function applyTwice(fn, value) {
  // TODO
}
console.log(applyTwice(n => n * 3, 2), applyTwice(n => n - 1, 10));`,
    s: R`function applyTwice(fn: (n: number) => number, value: number): number {
  return fn(fn(value));
}
console.log(applyTwice(n => n * 3, 2), applyTwice(n => n - 1, 10));`,
    o: "18 8" }] },
interfaces: { e: "📋", k: "Name object shapes with <code>interface</code> or <code>type</code>. Interfaces <code>extend</code>; aliases can name unions, tuples and more.",
  r: ["An extended type is accepted where the base is expected.", "<code>&amp;</code> combines object types.", "Pick one style per codebase and stay consistent."],
  q: ["Which can describe string | number?", ["interface", "type alias", "both", "neither"], 1, "Interfaces only describe object shapes."],
  p: [{ t: "Create <code>interface Employee extends Person</code> with a <code>role</code>, and make <code>describe</code> accept employees.",
    c: R`interface Person { name: string; age: number }
// TODO: Employee
const e: Employee = { name: "Grace", age: 85, role: "Admiral" };
const describe = (p: Person) => \`\${p.name} (\${p.age})\`;
console.log(describe(e), e.role);`,
    s: R`interface Person { name: string; age: number }
interface Employee extends Person { role: string }
const e: Employee = { name: "Grace", age: 85, role: "Admiral" };
const describe = (p: Person) => \`\${p.name} (\${p.age})\`;
console.log(describe(e), e.role);`,
    o: "Grace (85) Admiral" }] },
unions: { e: "🎛️", k: "<code>A | B</code> means either. Literal unions like <code>\"sm\" | \"md\" | \"lg\"</code> replace magic strings with a checked set of values.",
  r: ["Only members common to all union types are usable without narrowing.", "<code>const</code> infers literal types.", "Union of literals = an enum without the runtime object."],
  q: ["type Dir = \"up\" | \"down\"; which assignment fails?", ["let d: Dir = \"up\"", "let d: Dir = \"down\"", "let d: Dir = \"left\"", "None"], 2, "\"left\" isn't in the union."],
  p: [{ t: "Define <code>type Coin = \"penny\" | \"nickel\" | \"dime\" | \"quarter\"</code> and use it so the misspelled coin is caught. Fix it and print the total.",
    c: R`function cents(coin: string): number {
  switch (coin) {
    case "penny": return 1;
    case "nickel": return 5;
    case "dime": return 10;
    case "quarter": return 25;
  }
  return 0;
}
console.log(["dime", "quater", "penny"].map(cents).reduce((a, b) => a + b, 0));`,
    s: R`type Coin = "penny" | "nickel" | "dime" | "quarter";
function cents(coin: Coin): number {
  switch (coin) {
    case "penny": return 1;
    case "nickel": return 5;
    case "dime": return 10;
    case "quarter": return 25;
  }
}
const coins: Coin[] = ["dime", "quarter", "penny"];
console.log(coins.map(cents).reduce((a, b) => a + b, 0));`,
    o: "36" }] },
narrowing: { e: "🔎", k: "Checks like <code>typeof</code>, <code>instanceof</code>, <code>in</code>, <code>===</code> and early returns <b>narrow</b> a union to the type you can safely use.",
  r: ["After a <code>return</code>, ruled-out types are gone.", "Truthiness checks remove null and undefined.", "<code>Array.isArray</code> narrows to arrays."],
  q: ["Inside if (typeof x === \"number\") with x: string | number, x is…", ["string", "number", "string | number", "never"], 1, "typeof narrows to number."],
  p: [{ t: "Make <code>len</code> compile: return the string's length, or the array's length, or 0 for null.",
    c: R`function len(value: string | string[] | null): number {
  return value.length;   // error: possibly null
}
console.log(len("hello"), len(["a", "b"]), len(null));`,
    s: R`function len(value: string | string[] | null): number {
  if (value === null) return 0;
  return value.length;
}
console.log(len("hello"), len(["a", "b"]), len(null));`,
    o: "5 2 0" }] },
enums: { e: "🏷️", k: "Enums name a set of constants and produce real JavaScript. <code>as const</code> objects and literal unions give the same safety with no extra output.",
  r: ["String enums are readable in logs.", "<code>(typeof ARR)[number]</code> turns a const array into a union.", "<code>keyof typeof OBJ</code> turns object keys into a union."],
  q: ["const SIZES = [\"S\", \"M\"] as const; what is (typeof SIZES)[number]?", ["string", "\"S\" | \"M\"", "string[]", "readonly string[]"], 1, "as const keeps the literals."],
  p: [{ t: "Derive a <code>Planet</code> type from the array and make <code>gravity</code> accept only those planets.",
    c: R`const PLANETS = ["mercury", "earth", "mars"];
const G = { mercury: 3.7, earth: 9.8, mars: 3.7 };
function gravity(p: string) { return G[p]; }
console.log(gravity("mars"));`,
    s: R`const PLANETS = ["mercury", "earth", "mars"] as const;
type Planet = (typeof PLANETS)[number];
const G: Record<Planet, number> = { mercury: 3.7, earth: 9.8, mars: 3.7 };
function gravity(p: Planet) { return G[p]; }
console.log(gravity("mars"), PLANETS.length);`,
    o: "3.7 3" }] },
classes: { e: "🏛️", k: "TypeScript adds <code>private</code>/<code>protected</code>/<code>readonly</code>, parameter properties, <code>implements</code> and <code>abstract</code> to JavaScript classes.",
  r: ["<code>constructor(private x: T)</code> declares and assigns.", "<code>private</code> is compile-time; <code>#x</code> is runtime-private.", "Abstract methods must be implemented by subclasses."],
  q: ["What does implements check?", ["Inheritance", "That the class has the interface's members", "Runtime types", "Private fields"], 1, "It's a compile-time shape check."],
  p: [{ t: "Implement <code>Square</code> so it satisfies <code>Shape</code> using a parameter property.",
    c: R`interface Shape { area(): number; name: string }
class Square implements Shape {
  // TODO
}
const sq = new Square(3);
console.log(sq.name, sq.area());`,
    s: R`interface Shape { area(): number; name: string }
class Square implements Shape {
  name = "square";
  constructor(private side: number) {}
  area() { return this.side ** 2; }
}
const sq = new Square(3);
console.log(sq.name, sq.area());`,
    o: "square 9" }] },
generics: { e: "🧬", k: "A type parameter <code>&lt;T&gt;</code> links input and output types. Constraints (<code>T extends …</code>) say what T must have.",
  r: ["TypeScript usually infers T from the arguments.", "<code>K extends keyof T</code> restricts to real keys.", "Generic classes: <code>new Queue&lt;string&gt;()</code>."],
  q: ["first<T>(xs: T[]): T | undefined called with [\"a\"] returns…", ["any", "string | undefined", "T", "unknown"], 1, "T is inferred as string."],
  p: [{ t: "Make <code>last</code> generic so the result keeps its type (the <code>.toUpperCase()</code> call must compile).",
    c: R`function last(items: unknown[]): unknown {
  return items[items.length - 1];
}
const word = last(["alpha", "omega"]);
console.log(word.toUpperCase(), last([1, 2, 3]));`,
    s: R`function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}
const word = last(["alpha", "omega"]);
console.log(word?.toUpperCase(), last([1, 2, 3]));`,
    o: "OMEGA 3" }] },
utility: { e: "🧰", k: "Build new types from existing ones: <code>Partial</code>, <code>Required</code>, <code>Readonly</code>, <code>Pick</code>, <code>Omit</code>, <code>Record</code>, <code>ReturnType</code>…",
  r: ["Derived types follow the original when it changes.", "<code>Partial&lt;T&gt;</code> is ideal for update payloads.", "<code>Omit&lt;T, \"id\"&gt;</code> for create forms."],
  q: ["Which type has only the id and name of User?", ["Partial<User>", "Pick<User, \"id\" | \"name\">", "Omit<User, \"id\">", "Record<User>"], 1, "Pick keeps the listed keys."],
  p: [{ t: "Type <code>patch</code> as a <code>Partial</code> update that can't change <code>id</code>.",
    c: R`interface Task { id: number; title: string; done: boolean }
function patch(task: Task, changes: any): Task {
  return { ...task, ...changes };
}
console.log(patch({ id: 1, title: "Write", done: false }, { done: true }));
// @ts-expect-error: changing the id must be rejected
patch({ id: 1, title: "Write", done: false }, { id: 2 });`,
    s: R`interface Task { id: number; title: string; done: boolean }
function patch(task: Task, changes: Partial<Omit<Task, "id">>): Task {
  return { ...task, ...changes };
}
console.log(patch({ id: 1, title: "Write", done: false }, { done: true }));
// @ts-expect-error: changing the id must be rejected
patch({ id: 1, title: "Write", done: false }, { id: 2 });`,
    o: "{ id: 1, title: 'Write', done: true }" }] },
structural: { e: "🦆", k: "Types match by <b>shape</b>, not by name. Extra properties are fine for variables; inline object literals are checked for typos.",
  r: ["Classes are compared structurally too.", "Excess property checks apply only to fresh object literals.", "Brand types to opt out when needed."],
  q: ["const p = { x: 1, y: 2, z: 3 }; f(p) where f takes { x: number; y: number } —", ["error", "OK", "OK only with as", "runtime error"], 1, "A variable with extra properties fits the shape."],
  p: [{ t: "<code>logArea</code> needs anything with <code>width</code> and <code>height</code>. Write the parameter type so both calls compile.",
    c: R`function logArea(box) {
  console.log(box.width * box.height);
}
const photo = { width: 4, height: 3, url: "pic.jpg" };
class Rect { constructor(public width: number, public height: number) {} }
logArea(photo);
logArea(new Rect(2, 5));`,
    s: R`function logArea(box: { width: number; height: number }) {
  console.log(box.width * box.height);
}
const photo = { width: 4, height: 3, url: "pic.jpg" };
class Rect { constructor(public width: number, public height: number) {} }
logArea(photo);
logArea(new Rect(2, 5));`,
    o: "12, then 10" }] },
discriminated: { e: "🧭", k: "Give union members a shared literal tag; switching on it narrows to one member. A <code>never</code> default makes the switch exhaustive.",
  r: ["Model states so impossible combinations can't be written.", "Add a member → the compiler lists every switch to update.", "<code>Result&lt;T&gt;</code> = success or failure, never both."],
  q: ["In case \"circle\": of switch (shape.kind), shape is…", ["Shape", "the circle member", "never", "unknown"], 1, "The discriminant narrows it."],
  p: [{ t: "Add a <code>\"triangle\"</code> member (base, height) to <code>Shape</code> and handle it so the exhaustive check passes.",
    c: R`type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
    default: { const never: never = s; return never; }
  }
}
console.log(area({ kind: "triangle", base: 4, height: 3 }));`,
    s: R`type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number } | { kind: "triangle"; base: number; height: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
    case "triangle": return (s.base * s.height) / 2;
    default: { const never: never = s; return never; }
  }
}
console.log(area({ kind: "triangle", base: 4, height: 3 }));`,
    o: "6" }] },
unknown: { e: "🛂", k: "Type outside data as <code>unknown</code> and check it. Type guards (<code>x is T</code>) and assertion functions (<code>asserts x is T</code>) package those checks.",
  r: ["<code>as</code> changes beliefs, not values.", "Catch-clause variables are <code>unknown</code>.", "Guards work with <code>filter</code> to narrow arrays."],
  q: ["What does function isCat(x: unknown): x is Cat return at run time?", ["Cat", "boolean", "unknown", "void"], 1, "A boolean; the 'is' part narrows the caller's type."],
  p: [{ t: "Write the type guard <code>isPoint</code> so only valid points are printed.",
    c: R`interface Point { x: number; y: number }
function isPoint(v: unknown): v is Point {
  return false; // TODO
}
const inputs: unknown[] = [{ x: 1, y: 2 }, { x: "1", y: 2 }, null, { x: 5, y: -1 }];
console.log(inputs.filter(isPoint).map(p => p.x + p.y));`,
    s: R`interface Point { x: number; y: number }
function isPoint(v: unknown): v is Point {
  return typeof v === "object" && v !== null &&
    "x" in v && typeof v.x === "number" && "y" in v && typeof v.y === "number";
}
const inputs: unknown[] = [{ x: 1, y: 2 }, { x: "1", y: 2 }, null, { x: 5, y: -1 }];
console.log(inputs.filter(isPoint).map(p => p.x + p.y));`,
    o: "[ 3, 4 ]" }] },
nullsafety: { e: "🛡️", k: "In strict mode, possibly-missing values carry <code>| undefined</code> or <code>| null</code>, and the compiler makes you handle them.",
  r: ["<code>?.</code> stops at null/undefined; <code>??</code> supplies a default.", "<code>find</code>, <code>Map.get</code>, <code>pop</code> may return undefined.", "Avoid <code>!</code> unless you truly know better."],
  q: ["What's the type of new Map<string, number>().get(\"a\")?", ["number", "number | undefined", "number | null", "any"], 1, "The key may not exist."],
  p: [{ t: "Fix the errors without using <code>!</code>: print the user's city, or \"unknown\".",
    c: R`interface User { name: string; address?: { city?: string } }
const users: User[] = [{ name: "Ada", address: { city: "London" } }, { name: "Linus" }];
for (const name of ["Ada", "Linus", "Grace"]) {
  const u = users.find(x => x.name === name);
  console.log(name, u.address.city.toUpperCase());
}`,
    s: R`interface User { name: string; address?: { city?: string } }
const users: User[] = [{ name: "Ada", address: { city: "London" } }, { name: "Linus" }];
for (const name of ["Ada", "Linus", "Grace"]) {
  const u = users.find(x => x.name === name);
  console.log(name, u?.address?.city?.toUpperCase() ?? "unknown");
}`,
    o: "Ada LONDON, Linus unknown, Grace unknown" }] },
asyncts: { e: "⏳", k: "Async functions return <code>Promise&lt;T&gt;</code>. API responses are untyped (<code>any</code>): declare what you expect, and validate what matters.",
  r: ["<code>res.json()</code> gives <code>any</code>: annotate or validate.", "<code>Promise.all</code> keeps each element's type.", "Type rejections as <code>unknown</code> in catch."],
  q: ["Return type of async function load(): Promise<string> when awaited?", ["Promise<string>", "string", "unknown", "any"], 1, "await unwraps the promise."],
  p: [{ t: "Give <code>delay</code> a generic type so <code>value</code> is a <code>number</code> and <code>.toFixed</code> compiles.",
    c: R`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
const value = await delay(50, 3.14159);
console.log(value.toFixed(2));`,
    s: R`function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
const value = await delay(50, 3.14159);
console.log(value.toFixed(2));`,
    o: "3.14" }] },
modules: { e: "📦", k: "Same <code>import</code>/<code>export</code> as JavaScript, plus <code>import type</code>. Libraries ship types in <code>.d.ts</code> files or via <code>@types/…</code>.",
  r: ["<code>import type</code> is erased from output.", "<code>declare</code> describes things that exist elsewhere.", "Prefer packages that ship their own types."],
  q: ["Where do types for a JS-only package usually come from?", ["tsconfig", "@types/<package>", "node_modules/.bin", "They can't be typed"], 1, "DefinitelyTyped publishes them as @types packages."],
  p: [{ t: "Declare the global <code>APP_CONFIG</code> (provided by the page at run time) so the code type-checks. Here we create it first so it runs.",
    c: R`(globalThis as any).APP_CONFIG = { apiUrl: "https://api.test", retries: 3 };
// TODO: declare const APP_CONFIG: …
console.log(APP_CONFIG.apiUrl, APP_CONFIG.retries + 1);`,
    s: R`(globalThis as any).APP_CONFIG = { apiUrl: "https://api.test", retries: 3 };
declare const APP_CONFIG: { apiUrl: string; retries: number };
console.log(APP_CONFIG.apiUrl, APP_CONFIG.retries + 1);`,
    o: "https://api.test 4" }] },
keyof: { e: "🔑", k: "<code>keyof T</code> = T's keys, <code>typeof v</code> = a value's type, <code>T[K]</code> = a property's type. Types computed from data stay in sync.",
  r: ["<code>K extends keyof T</code> + <code>T[K]</code> = type-safe property access.", "<code>keyof typeof obj</code> for object keys.", "<code>(typeof arr)[number]</code> for array items."],
  q: ["interface P { a: string; b: number } — what is P[\"b\"]?", ["\"b\"", "number", "string", "keyof P"], 1, "Indexed access looks up the property type."],
  p: [{ t: "Write <code>setProp</code> so the value must match the key's type.",
    c: R`function setProp(obj, key, value) {
  obj[key] = value;
}
const user = { name: "Ada", age: 36 };
setProp(user, "age", 37);
setProp(user, "name", "Ada L.");
console.log(user);`,
    s: R`function setProp<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}
const user = { name: "Ada", age: 36 };
setProp(user, "age", 37);
setProp(user, "name", "Ada L.");
console.log(user);`,
    o: "{ name: 'Ada L.', age: 37 }" }] },
mapped: { e: "🗺️", k: "<code>{ [K in keyof T]: … }</code> builds a new type key by key. Add/remove <code>?</code> and <code>readonly</code>, change value types, rename keys with <code>as</code>.",
  r: ["<code>-?</code> and <code>-readonly</code> remove modifiers.", "<code>as never</code> filters a key out.", "Partial, Readonly and Record are mapped types."],
  q: ["What does { [K in keyof T]: string } do?", ["Removes keys", "Same keys, every value becomes string", "Makes keys strings", "Nothing"], 1, "It maps every property's type to string."],
  p: [{ t: "Write <code>Optionalize&lt;T&gt;</code> (every property optional and possibly null) and use it.",
    c: R`type Optionalize<T> = T; // TODO
interface Settings { theme: string; fontSize: number }
const s: Optionalize<Settings> = { fontSize: null };
console.log(s);`,
    s: R`type Optionalize<T> = { [K in keyof T]?: T[K] | null };
interface Settings { theme: string; fontSize: number }
const s: Optionalize<Settings> = { fontSize: null };
console.log(s);`,
    o: "{ fontSize: null }" }] },
conditional: { e: "🔀", k: "<code>T extends U ? X : Y</code> chooses a type. Over unions it distributes; <code>infer</code> captures parts of a type.",
  r: ["<code>ReturnType</code> is <code>F extends (...a: any) =&gt; infer R ? R : never</code>.", "Distribution applies when T is a naked type parameter.", "Combine with mapped types for powerful utilities."],
  q: ["type X<T> = T extends string ? 1 : 0; X<\"a\" | 5> is…", ["1", "0", "1 | 0", "never"], 2, "It distributes: \"a\" → 1, 5 → 0."],
  p: [{ t: "Write <code>ArrayItem&lt;T&gt;</code>: the item type for arrays, otherwise T itself.",
    c: R`type ArrayItem<T> = T; // TODO: use infer
const a: ArrayItem<string[]> = "text";
const b: ArrayItem<number> = 5;
console.log(a, b);`,
    s: R`type ArrayItem<T> = T extends (infer E)[] ? E : T;
const a: ArrayItem<string[]> = "text";
const b: ArrayItem<number> = 5;
console.log(a, b);`,
    o: "text 5" }] },
templatelit: { e: "🧵", k: "Template literal types build string types from other types, generating every combination of unions.",
  r: ["<code>`${A}-${B}`</code> multiplies unions.", "Capitalize, Uppercase… transform string types.", "<code>infer</code> inside templates parses strings."],
  q: ["How many members in `${\"a\" | \"b\"}${1 | 2}`?", ["2", "3", "4", "1"], 2, "a1, a2, b1, b2."],
  p: [{ t: "Type <code>css</code> so only <code>px</code>, <code>rem</code> or <code>%</code> values are allowed, then fix the bad value.",
    c: R`type Length = string; // TODO
const css: Record<"width" | "margin", Length> = { width: "50%", margin: "2em" };
console.log(css);`,
    s: R`type Length = \`\${number}\${"px" | "rem" | "%"}\`;
const css: Record<"width" | "margin", Length> = { width: "50%", margin: "2rem" };
console.log(css);`,
    o: "{ width: '50%', margin: '2rem' }" }] },
tspatterns: { e: "🧱", k: "<code>satisfies</code> checks without widening; brands make look-alike values incompatible; const type parameters keep literals.",
  r: ["Brands cost nothing at run time.", "<code>satisfies</code> keeps autocomplete for exact keys.", "Encode \"has been set\" in types to prevent misuse."],
  q: ["const c = { a: 1 } satisfies Record<string, number>; what is typeof c?", ["Record<string, number>", "{ a: number }", "unknown", "{ [k: string]: number }"], 1, "satisfies keeps the inferred type."],
  p: [{ t: "Brand <code>Email</code> so <code>send</code> only accepts strings that went through <code>toEmail</code>.",
    c: R`type Email = string; // TODO: brand it
function toEmail(s: string): Email {
  if (!s.includes("@")) throw new Error("bad email");
  return s as Email;
}
function send(to: Email) { return "sent to " + to; }
console.log(send(toEmail("ada@x.dev")));
// @ts-expect-error: a plain string must be rejected
console.log(send("raw@x.dev"));`,
    s: R`type Email = string & { readonly __brand: "Email" };
function toEmail(s: string): Email {
  if (!s.includes("@")) throw new Error("bad email");
  return s as Email;
}
function send(to: Email) { return "sent to " + to; }
console.log(send(toEmail("ada@x.dev")));
// @ts-expect-error: a plain string must be rejected
console.log(send("raw@x.dev"));`,
    o: "sent to ada@x.dev, sent to raw@x.dev" }] },
tsconfig: { e: "⚙️", k: "<code>tsconfig.json</code> controls checking. Use <code>\"strict\": true</code>; let a bundler strip types and run <code>tsc --noEmit</code> to check.",
  r: ["<code>noUncheckedIndexedAccess</code> catches index bugs.", "<code>@ts-expect-error</code> documents intended errors.", "Node 23+, tsx and Vite run .ts directly."],
  q: ["Which flag makes array[i] possibly undefined?", ["strict", "noUncheckedIndexedAccess", "noEmit", "skipLibCheck"], 1, "It's separate from strict."],
  p: [{ t: "Under <code>noUncheckedIndexedAccess</code>, <code>arr[0]</code> is <code>T | undefined</code>. Rewrite <code>firstWord</code> to be safe either way.",
    c: R`function firstWord(text: string): string {
  return text.split(" ")[0].toUpperCase();
}
console.log(firstWord("hello world"), firstWord(""));`,
    s: R`function firstWord(text: string): string {
  const [first] = text.split(" ");
  return first?.toUpperCase() ?? "";
}
console.log(firstWord("hello world"), JSON.stringify(firstWord("")));`,
    o: "HELLO \"\"" }] },
tsdom: { e: "🖥️", k: "DOM APIs are typed: <code>querySelector&lt;HTMLInputElement&gt;</code> says what you expect, and the result may be <code>null</code> until you check.",
  r: ["Tag selectors infer element types automatically.", "Event listeners know their event types.", "A small <code>$&lt;T&gt;</code> helper that throws keeps code clean."],
  q: ["What type does document.querySelector(\"input\") return?", ["HTMLElement", "HTMLInputElement | null", "Element", "any"], 1, "Tag-name selectors are mapped to element types."],
  p: [{ t: "No DOM in the console runner, so model it: type <code>handle</code>'s event parameter with a discriminated union of key and click events.",
    c: R`function handle(e) {
  if (e.type === "key") return "pressed " + e.key;
  return \`clicked at \${e.x},\${e.y}\`;
}
console.log(handle({ type: "key", key: "Enter" }), handle({ type: "click", x: 3, y: 4 }));`,
    s: R`type UIEvent = { type: "key"; key: string } | { type: "click"; x: number; y: number };
function handle(e: UIEvent) {
  if (e.type === "key") return "pressed " + e.key;
  return \`clicked at \${e.x},\${e.y}\`;
}
console.log(handle({ type: "key", key: "Enter" }), handle({ type: "click", x: 3, y: 4 }));`,
    o: "pressed Enter clicked at 3,4" }] },
"p-grades": { e: "🎓", k: "Model data first: derive unions from <code>as const</code> lists and use <code>Record</code> so every case must be filled in.",
  r: ["One source of truth for subjects.", "Explicit return types guard function outputs.", "Copy readonly arrays before sorting."],
  q: ["Why use Record<Subject, number> for scores?", ["It's faster", "Every subject must have a score", "It allows extra subjects", "It's required by console.table"], 1, "Missing keys become compile errors."],
  p: [{ t: "Extension: add a <code>weights</code> table and compute a weighted average.",
    c: R`type Subject = "math" | "science" | "english";
const weights = { math: 2, science: 1.5, english: 1 }; // TODO: type with Record
function weighted(scores: Record<Subject, number>): number {
  return 0; // TODO
}
console.log(weighted({ math: 90, science: 80, english: 70 }).toFixed(1));`,
    s: R`type Subject = "math" | "science" | "english";
const weights: Record<Subject, number> = { math: 2, science: 1.5, english: 1 };
function weighted(scores: Record<Subject, number>): number {
  const subjects = Object.keys(weights) as Subject[];
  const total = subjects.reduce((sum, s) => sum + scores[s] * weights[s], 0);
  const weightSum = subjects.reduce((sum, s) => sum + weights[s], 0);
  return total / weightSum;
}
console.log(weighted({ math: 90, science: 80, english: 70 }).toFixed(1));`,
    o: "82.2" }] },
"p-bank": { e: "🏦", k: "Return <code>Result</code> values for expected failures so callers must handle them, and keep state behind <code>#private</code> fields.",
  r: ["Error unions carry the data needed for good messages.", "Failure results can be returned as-is after narrowing.", "Roll back multi-step operations on failure."],
  q: ["Why return Result instead of throwing for 'insufficient funds'?", ["Exceptions are slow", "The type forces callers to handle it", "JSON can't hold errors", "It's required by classes"], 1, "Expected failures become part of the function's type."],
  p: [{ t: "Extension: add a <code>\"LIMIT_EXCEEDED\"</code> error to <code>withdraw</code> for amounts above 50,000 cents, and explain it.",
    c: R`type Err = { code: "INSUFFICIENT_FUNDS"; balance: number } | { code: "LIMIT_EXCEEDED"; limit: number };
type Result = { ok: true; balance: number } | { ok: false; error: Err };
function withdraw(balance: number, cents: number): Result {
  // TODO: check the limit first
  if (cents > balance) return { ok: false, error: { code: "INSUFFICIENT_FUNDS", balance } };
  return { ok: true, balance: balance - cents };
}
const explain = (e: Err) => e.code === "LIMIT_EXCEEDED" ? \`limit is \${e.limit}\` : \`only \${e.balance} available\`;
for (const amount of [1000, 60000, 90000]) {
  const r = withdraw(80000, amount);
  console.log(r.ok ? r.balance : explain(r.error));
}`,
    s: R`type Err = { code: "INSUFFICIENT_FUNDS"; balance: number } | { code: "LIMIT_EXCEEDED"; limit: number };
type Result = { ok: true; balance: number } | { ok: false; error: Err };
const LIMIT = 50_000;
function withdraw(balance: number, cents: number): Result {
  if (cents > LIMIT) return { ok: false, error: { code: "LIMIT_EXCEEDED", limit: LIMIT } };
  if (cents > balance) return { ok: false, error: { code: "INSUFFICIENT_FUNDS", balance } };
  return { ok: true, balance: balance - cents };
}
const explain = (e: Err) => e.code === "LIMIT_EXCEEDED" ? \`limit is \${e.limit}\` : \`only \${e.balance} available\`;
for (const amount of [1000, 60000, 90000]) {
  const r = withdraw(80000, amount);
  console.log(r.ok ? r.balance : explain(r.error));
}`,
    o: "79000, limit is 50000, limit is 50000" }] },
"p-store": { e: "🗃️", k: "Actions as a discriminated union + an exhaustive reducer + a generic store = state changes the compiler can check end to end.",
  r: ["<code>readonly</code> state prevents in-place mutation.", "<code>assertNever</code> catches unhandled actions.", "Middleware wraps dispatch: <code>store =&gt; next =&gt; action</code>."],
  q: ["What type does action have in the default branch when all cases are handled?", ["Action", "never", "unknown", "void"], 1, "Every member was narrowed away."],
  p: [{ t: "Extension: add an <code>\"incremented\"</code> action with a <code>by</code> number to this counter reducer.",
    c: R`type Action = { type: "reset" } | { type: "set"; value: number };
function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "reset": return 0;
    case "set": return action.value;
    default: { const x: never = action; return x; }
  }
}
const actions: Action[] = [{ type: "set", value: 5 }, { type: "incremented", by: 3 }];
console.log(actions.reduce(reducer, 0));`,
    s: R`type Action = { type: "reset" } | { type: "set"; value: number } | { type: "incremented"; by: number };
function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "reset": return 0;
    case "set": return action.value;
    case "incremented": return state + action.by;
    default: { const x: never = action; return x; }
  }
}
const actions: Action[] = [{ type: "set", value: 5 }, { type: "incremented", by: 3 }];
console.log(actions.reduce(reducer, 0));`,
    o: "8" }] },
"p-inventory": { e: "📦", k: "One generic <code>Repository&lt;T extends Entity&gt;</code> gives every entity type typed CRUD, queries and sorting.",
  r: ["Constraints let generic code use <code>item.id</code>.", "<code>Partial&lt;Omit&lt;T, \"id\"&gt;&gt;</code> for safe updates.", "<code>K extends keyof T</code> for sort keys."],
  q: ["In class Repo<T extends { id: string }>, what can the class use without knowing T?", ["Nothing", "item.id", "Any property", "Only methods"], 1, "The constraint guarantees id."],
  p: [{ t: "Extension: add a generic <code>count(items, filter)</code> that counts items matching a <code>Partial&lt;T&gt;</code>.",
    c: R`function count(items, filter) {
  return 0; // TODO
}
const tools = [{ id: "a", kind: "saw", sharp: true }, { id: "b", kind: "hammer", sharp: false }, { id: "c", kind: "saw", sharp: false }];
console.log(count(tools, { kind: "saw" }), count(tools, { kind: "saw", sharp: true }));`,
    s: R`function count<T>(items: T[], filter: Partial<T>): number {
  const entries = Object.entries(filter) as [keyof T, unknown][];
  return items.filter(item => entries.every(([k, v]) => item[k] === v)).length;
}
const tools = [{ id: "a", kind: "saw", sharp: true }, { id: "b", kind: "hammer", sharp: false }, { id: "c", kind: "saw", sharp: false }];
console.log(count(tools, { kind: "saw" }), count(tools, { kind: "saw", sharp: true }));`,
    o: "2 1" }] },
"p-validator": { e: "✅", k: "Describe rules once as a schema; <code>Infer&lt;typeof schema&gt;</code> derives the TypeScript type from the same object that validates at run time.",
  r: ["<code>infer</code> extracts T from <code>Schema&lt;T&gt;</code>.", "Validators take <code>unknown</code>.", "Collect all errors, not just the first."],
  q: ["What does type Infer<S> = S extends Schema<infer T> ? T : never return for Schema<number>?", ["Schema", "number", "never", "unknown"], 1, "infer captures T."],
  p: [{ t: "Extension: add <code>array(item)</code> that returns a <code>Schema&lt;T[]&gt;</code>.",
    c: R`type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };
interface Schema<T> { parse(input: unknown): Result<T> }
const num: Schema<number> = { parse: v => (typeof v === "number" ? { ok: true, value: v } : { ok: false, errors: [\`\${String(v)} is not a number\`] }) };
function array<T>(item: Schema<T>): Schema<T[]> {
  return { parse: () => ({ ok: false, errors: ["TODO"] }) };
}
console.log(array(num).parse([1, 2, 3]), array(num).parse([1, "x", null]));`,
    s: R`type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };
interface Schema<T> { parse(input: unknown): Result<T> }
const num: Schema<number> = { parse: v => (typeof v === "number" ? { ok: true, value: v } : { ok: false, errors: [\`\${String(v)} is not a number\`] }) };
function array<T>(item: Schema<T>): Schema<T[]> {
  return {
    parse(input) {
      if (!Array.isArray(input)) return { ok: false, errors: ["not an array"] };
      const out: T[] = [], errors: string[] = [];
      for (const x of input) {
        const r = item.parse(x);
        if (r.ok) out.push(r.value); else errors.push(...r.errors);
      }
      return errors.length ? { ok: false, errors } : { ok: true, value: out };
    },
  };
}
console.log(array(num).parse([1, 2, 3]), array(num).parse([1, "x", null]));`,
    o: "{ ok: true, value: [ 1, 2, 3 ] } { ok: false, errors: [ 'x is not a number', 'null is not a number' ] }" }] },
"p-pomodoro": { e: "🍅", k: "Keep behavior in a pure <code>transition(state, event)</code> function; the typed page code only sends events and renders.",
  r: ["Union states make invalid states unrepresentable.", "Compute ticks from real elapsed time.", "Narrow <code>dataset</code> strings to literal unions with checks."],
  q: ["Why can the timer's logic be tested without a page?", ["It uses console.log", "transition is a pure function", "TypeScript runs it", "setInterval is mocked"], 1, "Same input, same output, no DOM."],
  p: [{ t: "Extension: add a <code>\"skip\"</code> event that ends the current session immediately (as if it ran out).",
    c: R`type Mode = "focus" | "break";
interface S { mode: Mode; remaining: number; done: number }
type Ev = { type: "tick"; seconds: number }; // TODO: add skip
function next(s: S, e: Ev): S {
  const remaining = s.remaining - e.seconds;
  if (remaining > 0) return { ...s, remaining };
  return s.mode === "focus" ? { mode: "break", remaining: 300, done: s.done + 1 } : { mode: "focus", remaining: 1500, done: s.done };
}
let s: S = { mode: "focus", remaining: 1500, done: 0 };
s = next(s, { type: "skip" });
console.log(s);`,
    s: R`type Mode = "focus" | "break";
interface S { mode: Mode; remaining: number; done: number }
type Ev = { type: "tick"; seconds: number } | { type: "skip" };
function next(s: S, e: Ev): S {
  const remaining = e.type === "skip" ? 0 : s.remaining - e.seconds;
  if (remaining > 0) return { ...s, remaining };
  return s.mode === "focus" ? { mode: "break", remaining: 300, done: s.done + 1 } : { mode: "focus", remaining: 1500, done: s.done };
}
let s: S = { mode: "focus", remaining: 1500, done: 0 };
s = next(s, { type: "skip" });
console.log(s);`,
    o: "{ mode: 'break', remaining: 300, done: 1 }" }] },
cheatsheet: { e: "📋" }
  }
};
})();
