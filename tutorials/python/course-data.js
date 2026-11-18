/* Course mode for this page (see assets/course.js): which parts of the page are lessons,
   plus each lesson's key idea, Remember points, practice exercises and quick check.
   Code is written with String.raw (R`...`) so backslashes such as \n and \d stay as Python sees them. */
(() => {
const R = String.raw;
const GROUPS = { Beginner: 0, Intermediate: 1, Advanced: 2, Development: 3, Reference: 4 };
window.COURSE = {
  key: "pyvis", title: "Python, Visually", lang: "python", barIn: ".top",
  parts: [
    { name: "Beginner", color: "var(--good)" },
    { name: "Intermediate", color: "var(--warn)" },
    { name: "Advanced", color: "var(--adv)" },
    { name: "Development", color: "var(--accent)" },
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
      s.dataset.lesson = ""; s.dataset.part = GROUPS[s.dataset.group] ?? 4;
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
start: { e: "👋", k: "A Python program is a text file of statements that run <b>top to bottom</b>. <code>print()</code> shows values; indentation marks blocks.",
  r: ["Run a file with <code>python3 app.py</code>, or try lines in the REPL.", "Indentation (4 spaces) is part of the syntax.", "<code>#</code> starts a comment."],
  q: ["What marks a block of code in Python?", ["Curly braces { }", "Indentation", "begin / end", "Semicolons"], 1, "Python uses indentation to group statements into blocks."],
  p: [{ t: "Use an f-string to print exactly the line below, computing next year's age from <code>age</code>.",
    c: R`name = "Ada"
age = 36
# TODO: print  Hi Ada, next year you'll be 37
print("Hi")`,
    s: R`name = "Ada"
age = 36
print(f"Hi {name}, next year you'll be {age + 1}")`, o: "Hi Ada, next year you'll be 37" }] },
variables: { e: "🏷️", k: "A variable is a <b>name tag</b> stuck on an object. <code>b = a</code> adds a second tag to the <b>same</b> object; it copies nothing.",
  r: ["<code>a, b = b, a</code> swaps without a temporary.", "Changing a list through one name is visible through every name.", "<code>is</code> checks identity; <code>==</code> checks value."],
  q: ["a = [1]; b = a; b.append(2); print(a) shows?", ["[1]", "[1, 2]", "[2]", "An error"], 1, "a and b are two names for one list."],
  p: [{ t: "Swap the values of <code>a</code> and <code>b</code> in one line, without a third variable.",
    c: R`a, b = 5, 9
# TODO: swap them
print(a, b)`,
    s: R`a, b = 5, 9
a, b = b, a
print(a, b)`, o: "9 5" }] },
types: { e: "🧪", k: "Every value has a <b>type</b>: <code>int</code>, <code>float</code>, <code>str</code>, <code>bool</code>, <code>None</code>… Convert explicitly with <code>int()</code>, <code>float()</code>, <code>str()</code>.",
  r: ["<code>\"42\" + 8</code> is a TypeError; Python won't guess.", "Empty values (<code>\"\"</code>, <code>0</code>, <code>[]</code>) are falsy.", "<code>type(x)</code> tells you what you have."],
  q: ["What is bool(\"False\")?", ["False", "True", "An error", "None"], 1, "Any non-empty string is truthy, even the text \"False\"."],
  p: [{ t: "Fill in the four values using conversions: <code>\"42\"</code> plus 8 as a number, <code>\"7\"</code> times 2, <code>\"2.5\"</code> as a float, and the truth value of an empty string.",
    c: R`total = 0      # TODO: "42" plus 8
doubled = 0    # TODO: "7" times 2 (as a number)
f = 0.0        # TODO: "2.5" as a float
empty = None   # TODO: bool of ""
print(total, doubled, f, empty)`,
    s: R`total = int("42") + 8
doubled = int("7") * 2
f = float("2.5")
empty = bool("")
print(total, doubled, f, empty)`, o: "50 14 2.5 False" }] },
operators: { e: "➗", k: "<code>/</code> always gives a float. <code>//</code> is floor division and <code>%</code> the remainder; together they split numbers into units.",
  r: ["<code>7 // 2</code> is 3, <code>7 % 2</code> is 1.", "<code>**</code> is power: <code>2 ** 10</code> is 1024.", "<code>and</code>/<code>or</code> short-circuit and return an operand."],
  q: ["What is 7 / 2 in Python 3?", ["3", "3.5", "4", "3.0"], 1, "True division always returns a float."],
  p: [{ t: "Turn 3725 seconds into hours, minutes and seconds with <code>//</code> and <code>%</code>.",
    c: R`seconds = 3725
h = m = s = 0   # TODO
print(f"{h}h {m}m {s}s")`,
    s: R`seconds = 3725
h = seconds // 3600
m = seconds % 3600 // 60
s = seconds % 60
print(f"{h}h {m}m {s}s")`, o: "1h 2m 5s" }] },
strings: { e: "✂️", k: "Strings are sequences: <code>s[i]</code> picks one character and <code>s[start:stop:step]</code> slices. <code>stop</code> is excluded; negative indexes count from the end.",
  r: ["<code>s[::-1]</code> reverses.", "Strings are immutable: methods return new strings.", "<code>s[-1]</code> is the last character."],
  q: ["\"python\"[1:4] is?", ["\"pyt\"", "\"yth\"", "\"ytho\"", "\"tho\""], 1, "Indexes 1, 2, 3: y, t, h. The stop index 4 is excluded."],
  p: [{ t: "Using only slices, print the first five characters, the whole string reversed, and every second character, separated by <code>|</code>.",
    c: R`s = "Hello, World"
first5 = rev = every2 = ""   # TODO
print(first5, rev, every2, sep="|")`,
    s: R`s = "Hello, World"
first5, rev, every2 = s[:5], s[::-1], s[::2]
print(first5, rev, every2, sep="|")`, o: "Hello|dlroW ,olleH|Hlo ol" }] },
io: { e: "🖨️", k: "f-strings format values in place: <code>f\"{x:&gt;8.2f}\"</code> means right-align in 8 characters with 2 decimals.",
  r: ["<code>&lt;</code> left, <code>&gt;</code> right, <code>^</code> centre.", "<code>input()</code> always returns a <code>str</code>.", "<code>print(..., sep=\"\", end=\"\")</code> controls spacing."],
  q: ["f\"{3.14159:.2f}\" gives?", ["3.14", "3.1", "3.14159", "03.14"], 0, ".2f means two digits after the point."],
  p: [{ t: "Print a table row: the name left-aligned in 8 characters, a bar, then the price right-aligned in 7 with 2 decimals.",
    c: R`name, price = "tea", 3.5
print(f"{name}|{price}")   # TODO: add format specs`,
    s: R`name, price = "tea", 3.5
print(f"{name:<8}|{price:>7.2f}")`, o: "tea     |   3.50" }] },
conditions: { e: "🔀", k: "<code>if</code> / <code>elif</code> / <code>else</code> checks conditions <b>in order</b> and runs only the first branch that is true.",
  r: ["Order matters: put the strictest test first.", "Chained comparisons work: <code>0 &lt;= x &lt; 10</code>.", "<code>x if cond else y</code> is the one-line form."],
  q: ["score = 95. With if score >= 70 first, then elif score >= 90, which branch runs?", ["The >= 70 branch", "The >= 90 branch", "Both", "Neither"], 0, "The first true condition wins, so test the highest threshold first."],
  p: [{ t: "Write <code>grade</code>: 90+ is A, 80+ is B, 70+ is C, anything else F.",
    c: R`def grade(score):
    # TODO
    return "?"

print(" ".join(grade(s) for s in [95, 85, 72, 50]))`,
    s: R`def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    return "F"

print(" ".join(grade(s) for s in [95, 85, 72, 50]))`, o: "A B C F" }] },
loops: { e: "🔁", k: "<code>for</code> walks over any iterable; <code>while</code> repeats until a condition turns false. <code>break</code> leaves, <code>continue</code> skips ahead.",
  r: ["<code>range(1, 16)</code> stops before 16.", "<code>enumerate()</code> gives index and value.", "Don't change a list while looping over it."],
  q: ["How many times does for i in range(2, 10, 3) run?", ["2", "3", "4", "8"], 1, "i takes 2, 5 and 8."],
  p: [{ t: "FizzBuzz from 1 to 15: multiples of 3 → Fizz, of 5 → Buzz, of both → FizzBuzz. Join the results with spaces.",
    c: R`out = []
for n in range(1, 16):
    out.append(str(n))   # TODO
print(" ".join(out))`,
    s: R`out = []
for n in range(1, 16):
    if n % 15 == 0:
        out.append("FizzBuzz")
    elif n % 3 == 0:
        out.append("Fizz")
    elif n % 5 == 0:
        out.append("Buzz")
    else:
        out.append(str(n))
print(" ".join(out))`, o: "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz" }] },
lists: { e: "📃", k: "A <b>list</b> is an ordered, changeable sequence. A <b>tuple</b> is the same idea but fixed once made.",
  r: ["<code>sorted(x)</code> returns a new list; <code>x.sort()</code> sorts in place.", "<code>x[-2:]</code> takes the last two.", "Tuples are good for fixed records like (x, y)."],
  q: ["nums = [3, 1, 2]; r = nums.sort(); What is r?", ["[1, 2, 3]", "None", "[3, 1, 2]", "An error"], 1, "sort() changes the list in place and returns None."],
  p: [{ t: "Print the list sorted, its max, the sum of the even numbers, and its last two items.",
    c: R`nums = [5, 3, 8, 1, 9, 2]
# TODO
print(nums)`,
    s: R`nums = [5, 3, 8, 1, 9, 2]
print(sorted(nums), max(nums), sum(n for n in nums if n % 2 == 0), nums[-2:])`, o: "[1, 2, 3, 5, 8, 9] 9 10 [9, 2]" }] },
dicts: { e: "📖", k: "A <b>dict</b> maps keys to values with a hash table, so lookups are fast (O(1) on average). Keys must be hashable.",
  r: ["<code>d.get(k, 0)</code> avoids KeyError.", "Dicts keep insertion order (Python 3.7+).", "<code>for k, v in d.items()</code> loops over pairs."],
  q: ["d = {}; d[\"x\"] += 1 does what?", ["Sets x to 1", "Raises KeyError", "Sets x to 0", "Nothing"], 1, "There is no \"x\" yet to add to. Use d.get(\"x\", 0) + 1."],
  p: [{ t: "Count how often each word appears, using <code>dict.get</code>.",
    c: R`text = "the cat and the hat"
counts = {}
# TODO
print(counts)`,
    s: R`text = "the cat and the hat"
counts = {}
for w in text.split():
    counts[w] = counts.get(w, 0) + 1
print(counts)`, o: "{'the': 2, 'cat': 1, 'and': 1, 'hat': 1}" }] },
sets: { e: "🔵", k: "A <b>set</b> holds unique items with fast membership tests, plus maths: <code>&amp;</code> both, <code>|</code> either, <code>-</code> only in the first, <code>^</code> in exactly one.",
  r: ["<code>set(list)</code> removes duplicates (order is lost).", "<code>x in s</code> is O(1).", "<code>{}</code> is an empty dict; use <code>set()</code>."],
  q: ["What is {1, 2, 3} ^ {2, 3, 4}?", ["{2, 3}", "{1, 4}", "{1, 2, 3, 4}", "{1}"], 1, "Symmetric difference: items in exactly one of the sets."],
  p: [{ t: "Print (sorted) the items in both sets, only in <code>a</code>, and in exactly one of them.",
    c: R`a = {1, 2, 3, 4}
b = {3, 4, 5}
# TODO
print()`,
    s: R`a = {1, 2, 3, 4}
b = {3, 4, 5}
print(sorted(a & b), sorted(a - b), sorted(a ^ b))`, o: "[3, 4] [1, 2] [1, 2, 5]" }] },
functions: { e: "🧩", k: "<code>def</code> creates a function object. Each call gets its own <b>frame</b> on the call stack; <code>return</code> sends a value back (or <code>None</code>).",
  r: ["Default values give optional parameters.", "Keyword arguments make calls readable: <code>area(w=3, h=4)</code>.", "A function without return returns <code>None</code>."],
  q: ["def f(): print(\"hi\")  — what is x after x = f()?", ["\"hi\"", "None", "f", "An error"], 1, "f prints, but returns nothing, which is None."],
  p: [{ t: "Write <code>area(w, h=None)</code>: with one argument it's a square, with two a rectangle.",
    c: R`def area(w, h=None):
    return 0   # TODO

print(area(3), area(3, 4))`,
    s: R`def area(w, h=None):
    if h is None:
        h = w
    return w * h

print(area(3), area(3, 4))`, o: "9 12" }] },
scope: { e: "🔭", k: "Names are looked up <b>L</b>ocal → <b>E</b>nclosing → <b>G</b>lobal → <b>B</b>uilt-in. Assigning makes a name local unless you say <code>global</code> or <code>nonlocal</code>.",
  r: ["Reading an outer name is fine; assigning needs <code>nonlocal</code>/<code>global</code>.", "A closure keeps the enclosing variables alive.", "Prefer returning values over <code>global</code>."],
  q: ["Inside a nested function, which keyword lets you rebind a variable of the enclosing function?", ["global", "nonlocal", "outer", "static"], 1, "nonlocal targets the nearest enclosing function scope."],
  p: [{ t: "Make the counter work: each call should return the next number. (It fails until you add one keyword.)",
    c: R`def make_counter():
    count = 0
    def step():
        count += 1      # TODO: needs a keyword above this line
        return count
    return step

c = make_counter()
print(c(), c(), c())`,
    s: R`def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step

c = make_counter()
print(c(), c(), c())`, o: "1 2 3" }] },
errors: { e: "🚑", k: "<code>try</code> runs risky code; <code>except</code> handles a <b>specific</b> error; <code>else</code> runs if nothing failed; <code>finally</code> always runs.",
  r: ["Catch the narrowest exception you can.", "<code>raise ValueError(\"msg\")</code> signals bad input.", "Never use a bare <code>except:</code> to hide bugs."],
  q: ["int(\"x\") raises which exception?", ["TypeError", "ValueError", "KeyError", "SyntaxError"], 1, "The type is right (a str) but the value can't be converted."],
  p: [{ t: "Write <code>safe_int(text, default=0)</code> that returns the default when the text isn't a number.",
    c: R`def safe_int(text, default=0):
    return int(text)   # TODO: handle bad input

print([safe_int(t) for t in ["10", "x", "7"]])`,
    s: R`def safe_int(text, default=0):
    try:
        return int(text)
    except ValueError:
        return default

print([safe_int(t) for t in ["10", "x", "7"]])`, o: "[10, 0, 7]" }] },
files: { e: "📁", k: "Open files with <code>with open(path, mode) as f:</code> so they are <b>always closed</b>, even on errors. Pass <code>encoding=\"utf-8\"</code> for text.",
  r: ["<code>\"w\"</code> overwrites, <code>\"a\"</code> appends, <code>\"r\"</code> reads.", "Loop over the file object to read line by line.", "<code>pathlib.Path</code> handles paths cleanly."],
  q: ["Why use with open(...)?", ["It's faster", "The file is closed automatically", "It creates folders", "It reads binary"], 1, "The with block closes the file when it ends, even after an exception."],
  p: [{ t: "Write three lines to <code>notes.txt</code>, read them back, then print how many lines there are and the longest one.",
    c: R`lines = ["apple", "banana split", "kiwi"]
# TODO: write them (one per line), then read the file back
print()`,
    s: R`lines = ["apple", "banana split", "kiwi"]
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

with open("notes.txt", encoding="utf-8") as f:
    back = [line.rstrip("\n") for line in f]

print(len(back), max(back, key=len))`, o: "3 banana split" }] },
modules: { e: "📦", k: "<code>import</code> loads a module once and gives you its names. The standard library already has <code>collections</code>, <code>math</code>, <code>datetime</code>, <code>json</code> and much more.",
  r: ["<code>from collections import Counter</code> imports one name.", "Each module runs only once, then it's cached.", "Check the standard library before installing packages."],
  q: ["What does Counter(\"aab\") hold?", ["{'a': 1, 'b': 1}", "{'a': 2, 'b': 1}", "['a', 'a', 'b']", "3"], 1, "Counter counts each item."],
  p: [{ t: "Use <code>collections.Counter</code> to find the two most common letters in \"mississippi\".",
    c: R`word = "mississippi"
# TODO: import Counter and use most_common(2)
print()`,
    s: R`from collections import Counter

word = "mississippi"
print(Counter(word).most_common(2))`, o: "[('i', 4), ('s', 4)]" }] },
comprehensions: { e: "🏭", k: "A comprehension builds a collection in one expression: <code>[expr for x in items if cond]</code>. Dict and set versions use <code>{ }</code>.",
  r: ["Read it as: \"expr, for each x, if cond\".", "<code>{k: v for …}</code> builds a dict.", "Use a normal loop when it stops being readable."],
  q: ["[x * 2 for x in range(4) if x % 2] gives?", ["[0, 2, 4, 6]", "[2, 6]", "[1, 3]", "[0, 4]"], 1, "x % 2 keeps the odd values 1 and 3, then doubles them."],
  p: [{ t: "With comprehensions: squares of the even numbers from 1 to 10, and a dict mapping each word to its length.",
    c: R`words = ["hi", "there"]
squares = []    # TODO
lengths = {}    # TODO
print(squares, lengths)`,
    s: R`words = ["hi", "there"]
squares = [n * n for n in range(1, 11) if n % 2 == 0]
lengths = {w: len(w) for w in words}
print(squares, lengths)`, o: "[4, 16, 36, 64, 100] {'hi': 2, 'there': 5}" }] },
args: { e: "🎒", k: "<code>*args</code> collects extra positional arguments into a tuple; <code>**kwargs</code> collects extra keyword arguments into a dict.",
  r: ["Order: normal, <code>*args</code>, keyword-only, <code>**kwargs</code>.", "<code>f(*lst)</code> and <code>f(**d)</code> unpack when calling.", "Names are convention; the stars matter."],
  q: ["def f(*a): return a — what does f(1, 2) return?", ["[1, 2]", "(1, 2)", "1", "{1, 2}"], 1, "*args is always a tuple."],
  p: [{ t: "Write <code>total(*nums, **opts)</code> that sums the numbers and multiplies by <code>opts[\"scale\"]</code> if given.",
    c: R`def total(*nums, **opts):
    return 0   # TODO

print(total(1, 2, 3), total(1, 2, 3, scale=10))`,
    s: R`def total(*nums, **opts):
    return sum(nums) * opts.get("scale", 1)

print(total(1, 2, 3), total(1, 2, 3, scale=10))`, o: "6 60" }] },
functional: { e: "λ", k: "Functions are values: pass them around, return them, store them. <code>lambda</code> writes a tiny one inline, perfect for <code>key=</code>.",
  r: ["<code>sorted(items, key=lambda p: p[1])</code> sorts by a field.", "<code>map</code>/<code>filter</code> exist, but comprehensions are often clearer.", "A closure remembers variables from where it was made."],
  q: ["sorted([\"bb\", \"a\", \"ccc\"], key=len) gives?", ["['a', 'bb', 'ccc']", "['ccc', 'bb', 'a']", "['a', 'ccc', 'bb']", "An error"], 0, "key=len sorts by length."],
  p: [{ t: "Sort the people by age with a <code>lambda</code> key and print just their names.",
    c: R`people = [("Ada", 36), ("Linus", 21), ("Grace", 45)]
# TODO
print(people)`,
    s: R`people = [("Ada", 36), ("Linus", 21), ("Grace", 45)]
print([name for name, age in sorted(people, key=lambda p: p[1])])`, o: "['Linus', 'Ada', 'Grace']" }] },
oop: { e: "🏦", k: "A <b>class</b> is a blueprint; each <b>object</b> has its own attributes. <code>__init__</code> sets them up and <code>self</code> is the object itself.",
  r: ["Methods take <code>self</code> as the first parameter.", "Keep rules inside methods (e.g. no overdraft).", "Raise an exception for invalid operations."],
  q: ["What is self in a method?", ["The class", "The object the method was called on", "A keyword for static methods", "The module"], 1, "acct.deposit(5) passes acct as self."],
  p: [{ t: "Finish <code>withdraw</code>: raise <code>ValueError(\"insufficient funds\")</code> if the balance is too low.",
    c: R`class Account:
    def __init__(self, balance=0):
        self.balance = balance
    def deposit(self, amount):
        self.balance += amount
    def withdraw(self, amount):
        self.balance -= amount   # TODO: refuse overdrafts

acct = Account(100)
acct.withdraw(30)
try:
    acct.withdraw(500)
except ValueError as e:
    print(acct.balance, e)`,
    s: R`class Account:
    def __init__(self, balance=0):
        self.balance = balance
    def deposit(self, amount):
        self.balance += amount
    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

acct = Account(100)
acct.withdraw(30)
try:
    acct.withdraw(500)
except ValueError as e:
    print(acct.balance, e)`, o: "70 insufficient funds" }] },
inheritance: { e: "🧬", k: "A subclass <b>inherits</b> from a parent and can <b>override</b> methods. Code that calls <code>shape.area()</code> works for every subclass: polymorphism.",
  r: ["<code>class Rect(Shape):</code> declares the parent.", "<code>super().__init__(...)</code> runs the parent's setup.", "Prefer small, shallow hierarchies."],
  q: ["A subclass doesn't define area(). Calling it does what?", ["Raises an error", "Uses the parent's area()", "Returns None", "Asks the user"], 1, "Lookup walks up the inheritance chain (the MRO)."],
  p: [{ t: "Give <code>Rect</code> and <code>Circle</code> their own <code>area()</code> so the loop works for both.",
    c: R`import math

class Shape:
    def area(self):
        raise NotImplementedError

class Rect(Shape):
    def __init__(self, w, h):
        self.w, self.h = w, h
    # TODO: area

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    # TODO: area

shapes = [Rect(2, 3), Circle(1)]
print([round(s.area(), 2) for s in shapes])`,
    s: R`import math

class Shape:
    def area(self):
        raise NotImplementedError

class Rect(Shape):
    def __init__(self, w, h):
        self.w, self.h = w, h
    def area(self):
        return self.w * self.h

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self):
        return math.pi * self.r ** 2

shapes = [Rect(2, 3), Circle(1)]
print([round(s.area(), 2) for s in shapes])`, o: "[6, 3.14]" }] },
dunder: { e: "✨", k: "Dunder methods plug your class into Python syntax: <code>__add__</code> for <code>+</code>, <code>__eq__</code> for <code>==</code>, <code>__repr__</code> for printing, <code>__len__</code> for <code>len()</code>.",
  r: ["<code>__repr__</code> should look like code that recreates the object.", "Return <code>NotImplemented</code> for types you don't support.", "Defining <code>__eq__</code> also affects hashing."],
  q: ["Which method makes a + b work for your class?", ["__plus__", "__add__", "__sum__", "__radd__ only"], 1, "a + b calls a.__add__(b)."],
  p: [{ t: "Add <code>__add__</code> and <code>__repr__</code> so the sum prints as <code>Vector(4, 6)</code>.",
    c: R`class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    # TODO: __add__ and __repr__

print(Vector(1, 2) + Vector(3, 4))`,
    s: R`class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)
    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

print(Vector(1, 2) + Vector(3, 4))`, o: "Vector(4, 6)" }] },
iterators: { e: "🌀", k: "A <b>generator</b> function uses <code>yield</code> to produce values <b>one at a time</b>, pausing between them. It uses almost no memory, even for huge sequences.",
  r: ["Calling a generator function runs nothing yet.", "Each <code>next()</code> resumes until the next <code>yield</code>.", "A generator can be consumed only once."],
  q: ["What does calling a generator function return?", ["The first value", "A generator object, paused", "A list", "None"], 1, "The body starts running only on the first next()."],
  p: [{ t: "Write a generator <code>fib(n)</code> that yields the first <code>n</code> Fibonacci numbers.",
    c: R`def fib(n):
    # TODO: use yield
    return []

print(list(fib(8)))`,
    s: R`def fib(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fib(8)))`, o: "[0, 1, 1, 2, 3, 5, 8, 13]" }] },
decorators: { e: "🎀", k: "A decorator takes a function and returns a <b>wrapped</b> one. <code>@deco</code> above <code>def f</code> means <code>f = deco(f)</code>.",
  r: ["Use <code>functools.wraps</code> to keep the name and docstring.", "Decoration happens once, when the function is defined.", "Common uses: timing, logging, caching, access checks."],
  q: ["@timer above def greet() is the same as…", ["greet = timer", "greet = timer(greet)", "timer = greet(timer)", "greet()"], 1, "The decorator receives the function and its return value replaces it."],
  p: [{ t: "Write a <code>count_calls</code> decorator that counts calls in <code>wrapper.calls</code>.",
    c: R`import functools

def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # TODO: count, then call func
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def hello():
    return "hi"

hello(); hello(); hello()
print(hello.calls, hello.__name__)`,
    s: R`import functools

def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def hello():
    return "hi"

hello(); hello(); hello()
print(hello.calls, hello.__name__)`, o: "3 hello" }] },
context: { e: "🚪", k: "A context manager runs setup on entering <code>with</code> and cleanup on leaving, <b>even after an error</b>. <code>@contextmanager</code> builds one from a generator.",
  r: ["Code before <code>yield</code> is setup; after it is cleanup.", "Put cleanup in <code>finally</code> so errors can't skip it.", "Files, locks and DB connections all use this."],
  q: ["In a @contextmanager function, where does the with-block's body run?", ["Before the function starts", "At the yield", "After return", "In a thread"], 1, "The generator pauses at yield while the with body runs."],
  p: [{ t: "Write <code>tag(name)</code> that prints an opening tag before the block and a closing tag after it.",
    c: R`from contextlib import contextmanager

@contextmanager
def tag(name):
    yield   # TODO: print <name> before and </name> after

with tag("b"):
    print("hello")`,
    s: R`from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    try:
        yield
    finally:
        print(f"</{name}>")

with tag("b"):
    print("hello")`, o: "<b>\nhello\n</b>" }] },
mutability: { e: "🔁", k: "Mutable objects (lists, dicts, sets) can change in place; immutable ones (int, str, tuple) can't. A <b>default argument is created once</b>, so a mutable default is shared between calls.",
  r: ["Use <code>None</code> as the default and create the list inside.", "<code>copy.copy</code> is shallow; <code>copy.deepcopy</code> copies nested objects.", "<code>is</code> tells you if two names share one object."],
  q: ["def add(x, bucket=[]): bucket.append(x); return bucket — what does the second call add(2) return?", ["[2]", "[1, 2]", "[]", "An error"], 1, "The same default list is reused across calls."],
  p: [{ t: "Fix the classic mutable-default bug so each call starts with a fresh list.",
    c: R`def add(item, bucket=[]):
    bucket.append(item)
    return bucket

print(add(1), add(2))`,
    s: R`def add(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket

print(add(1), add(2))`, o: "[1] [2]   (before your fix: [1, 2] [1, 2])" }] },
typing: { e: "🏷️", k: "Type hints document what a function expects and returns. Python <b>doesn't enforce them</b> at run time; tools like mypy and your editor check them.",
  r: ["<code>list[str]</code>, <code>dict[str, int]</code> use built-in types.", "<code>str | None</code> means \"a str or None\".", "Hints help editors autocomplete and catch bugs early."],
  q: ["def f(x: int) -> int: … What happens on f(\"a\")?", ["TypeError at once", "It runs; hints aren't enforced", "SyntaxError", "x becomes 0"], 1, "Hints are for tools; the interpreter ignores them."],
  p: [{ t: "Add type hints and finish <code>first_or_none</code>: it returns the first item, or <code>None</code> for an empty list.",
    c: R`def first_or_none(items):   # TODO: add hints
    return items[0]

print(first_or_none(["a", "b"]), first_or_none([]))`,
    s: R`def first_or_none(items: list[str]) -> str | None:
    return items[0] if items else None

print(first_or_none(["a", "b"]), first_or_none([]))`, o: "a None" }] },
dataclasses: { e: "🗂️", k: "<code>@dataclass</code> writes <code>__init__</code>, <code>__repr__</code> and <code>__eq__</code> for you from the field list. <code>order=True</code> adds comparisons too.",
  r: ["<code>frozen=True</code> makes instances immutable.", "Use <code>field(default_factory=list)</code> for mutable defaults.", "<code>Enum</code> gives named constants."],
  q: ["What does @dataclass generate by default?", ["__init__, __repr__, __eq__", "Only __init__", "A database table", "__hash__ and __lt__"], 0, "Ordering needs order=True; hashing depends on eq/frozen."],
  p: [{ t: "Make <code>Point</code> a dataclass that can be sorted (by x, then y).",
    c: R`class Point:   # TODO: make it a sortable dataclass
    x: int
    y: int

print(sorted([Point(2, 0), Point(1, 5)]))`,
    s: R`from dataclasses import dataclass

@dataclass(order=True)
class Point:
    x: int
    y: int

print(sorted([Point(2, 0), Point(1, 5)]))`, o: "[Point(x=1, y=5), Point(x=2, y=0)]" }] },
match: { e: "🎯", k: "<code>match</code> compares a value against <b>shapes</b>: literals, sequences, dicts, classes, with captures and guards. The first case that fits wins.",
  r: ["<code>case [\"go\", direction]:</code> captures the second word.", "<code>case _:</code> catches everything else.", "<code>:=</code> (walrus) assigns inside an expression."],
  q: ["Which case pattern matches anything?", ["case *:", "case _:", "case else:", "case None:"], 1, "_ is the wildcard."],
  p: [{ t: "Handle three commands with <code>match</code>: <code>go &lt;dir&gt;</code>, <code>quit</code>, and anything else.",
    c: R`def handle(cmd):
    # TODO: match cmd.split()
    return cmd

for c in ["go north", "quit", "dance"]:
    print(handle(c))`,
    s: R`def handle(cmd):
    match cmd.split():
        case ["go", direction]:
            return f"moving {direction}"
        case ["quit"]:
            return "bye"
        case _:
            return f"unknown: {cmd}"

for c in ["go north", "quit", "dance"]:
    print(handle(c))`, o: "moving north\nbye\nunknown: dance" }] },
async: { e: "⏳", k: "<code>async def</code> makes a coroutine; <code>await</code> pauses it while it waits so others can run. <code>asyncio.gather</code> runs several at once.",
  r: ["Great for many slow waits (network, timers), not for heavy CPU work.", "Never call blocking <code>time.sleep</code> in async code.", "In this page you can <code>await</code> at the top level."],
  q: ["Three tasks each await asyncio.sleep(1) inside gather. Total time is about…", ["3 s", "1 s", "0 s", "It depends on CPU cores"], 1, "They wait at the same time."],
  p: [{ t: "Run the three fetches <b>concurrently</b> with <code>asyncio.gather</code> instead of one after another.",
    c: R`import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name

results = [await fetch("A", 0.3), await fetch("B", 0.2), await fetch("C", 0.1)]   # TODO: gather
print(results)`,
    s: R`import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name

results = await asyncio.gather(fetch("A", 0.3), fetch("B", 0.2), fetch("C", 0.1))
print(results)`, o: "['A', 'B', 'C']" }] },
concurrency: { e: "🧵", k: "Threads share memory and suit waiting on I/O; the <b>GIL</b> lets one thread run Python bytecode at a time. For CPU-heavy work use <b>processes</b>.",
  r: ["I/O-bound → threads or asyncio.", "CPU-bound → <code>ProcessPoolExecutor</code>.", "Split work into chunks before handing it to a pool."],
  q: ["You resize 10,000 images (CPU-heavy). Which is best?", ["threading", "multiprocessing / ProcessPoolExecutor", "asyncio", "One big loop"], 1, "Processes each have their own interpreter and GIL."],
  p: [{ t: "Pools work on chunks. Write <code>chunks(items, size)</code> that splits a list into pieces of <code>size</code> (the last can be shorter).",
    c: R`def chunks(items, size):
    return [items]   # TODO

print(chunks([1, 2, 3, 4, 5, 6, 7], 3))`,
    s: R`def chunks(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]

print(chunks([1, 2, 3, 4, 5, 6, 7], 3))`, o: "[[1, 2, 3], [4, 5, 6], [7]]" }] },
regex: { e: "🔎", k: "A regular expression describes a <b>text pattern</b>. <code>re.findall</code> returns every match; <code>re.search</code> finds the first; groups <code>( )</code> capture parts.",
  r: ["Use raw strings: <code>r\"\\d+\"</code>.", "<code>\\d</code> digit, <code>\\w</code> word char, <code>{n}</code> exactly n times.", "Compile with <code>re.compile</code> when reusing a pattern."],
  q: ["re.findall(r\"\\d+\", \"a1b22c333\") gives?", ["['1', '22', '333']", "['1', '2', '2', '3', '3', '3']", "[1, 22, 333]", "'122333'"], 0, "\\d+ grabs runs of digits, as strings."],
  p: [{ t: "Find every date written as YYYY-MM-DD in the text.",
    c: R`import re

text = "Shipped 2024-01-05, returned 2025-12-31, ref 12-3456."
dates = []   # TODO: re.findall
print(dates)`,
    s: R`import re

text = "Shipped 2024-01-05, returned 2025-12-31, ref 12-3456."
dates = re.findall(r"\d{4}-\d{2}-\d{2}", text)
print(dates)`, o: "['2024-01-05', '2025-12-31']" }] },
performance: { e: "🏎️", k: "Pick the right data structure first: <code>x in list</code> is O(n), <code>x in set</code> is O(1). Measure with <code>timeit</code> before optimising.",
  r: ["Lists: fast append/index, slow search.", "Sets/dicts: fast membership by hashing.", "Don't guess; profile."],
  q: ["Checking membership 1 million times in a 100k-item collection. Use…", ["list", "set", "tuple", "str"], 1, "Set lookups don't scan the whole collection."],
  p: [{ t: "Remove duplicates but <b>keep the original order</b>, using a set to remember what you've seen (O(n)).",
    c: R`def dedupe(items):
    out = []
    for x in items:
        if x not in out:   # TODO: O(n) each time; use a set
            out.append(x)
    return out

print(dedupe([3, 1, 3, 2, 1]))`,
    s: R`def dedupe(items):
    seen, out = set(), []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

print(dedupe([3, 1, 3, 2, 1]))`, o: "[3, 1, 2]" }] },
metaprog: { e: "🔧", k: "A <b>descriptor</b> (an object with <code>__get__</code>/<code>__set__</code>) controls attribute access; it's how <code>property</code> works. <code>__slots__</code> fixes the allowed attributes.",
  r: ["<code>__set_name__</code> tells a descriptor its attribute name.", "<code>__slots__</code> saves memory and blocks typos.", "Metaclasses customise class creation; rarely needed."],
  q: ["@property is built on…", ["metaclasses", "descriptors", "decorators only", "__slots__"], 1, "property is a descriptor class."],
  p: [{ t: "Finish the <code>Positive</code> descriptor so negative values raise <code>ValueError</code>.",
    c: R`class Positive:
    def __set_name__(self, owner, name):
        self.name = "_" + name
    def __get__(self, obj, objtype=None):
        return getattr(obj, self.name)
    def __set__(self, obj, value):
        setattr(obj, self.name, value)   # TODO: reject value < 0

class Item:
    qty = Positive()

it = Item()
it.qty = 5
try:
    it.qty = -1
    print(it.qty, "accepted -1")
except ValueError:
    print(it.qty, "rejected -1")`,
    s: R`class Positive:
    def __set_name__(self, owner, name):
        self.name = "_" + name
    def __get__(self, obj, objtype=None):
        return getattr(obj, self.name)
    def __set__(self, obj, value):
        if value < 0:
            raise ValueError(f"{self.name[1:]} must be >= 0")
        setattr(obj, self.name, value)

class Item:
    qty = Positive()

it = Item()
it.qty = 5
try:
    it.qty = -1
    print(it.qty, "accepted -1")
except ValueError:
    print(it.qty, "rejected -1")`, o: "5 rejected -1" }] },
envs: { e: "🧺", k: "A <b>virtual environment</b> is a private folder of packages for one project: <code>python3 -m venv .venv</code>, activate it, then <code>pip install</code>.",
  r: ["One venv per project avoids version clashes.", "Pin versions in <code>requirements.txt</code> or <code>pyproject.toml</code>.", "Never commit the <code>.venv</code> folder."],
  q: ["Why use a virtual environment?", ["Faster Python", "Each project gets its own package versions", "It's required by pip", "It encrypts code"], 1, "It isolates dependencies per project."],
  p: [{ t: "Parse a requirement line into package, operator and version with a regular expression.",
    c: R`import re

line = "requests>=2.31"
# TODO: match name, operator (==, >=, <=, ~=, >, <) and version
print(line)`,
    s: R`import re

line = "requests>=2.31"
m = re.match(r"([A-Za-z0-9_.-]+)\s*(==|>=|<=|~=|>|<)\s*(.+)", line)
name, op, version = m.groups()
print(name, op, version)`, o: "requests >= 2.31" }] },
project: { e: "🏗️", k: "Put logic in importable functions and keep the entry point under <code>if __name__ == \"__main__\":</code> so importing the module doesn't run it.",
  r: ["A <code>src/</code> layout with a package folder scales well.", "<code>main(argv)</code> taking arguments is easy to test.", "<code>pyproject.toml</code> describes the project."],
  q: ["When is __name__ == \"__main__\" true?", ["Always", "When the file is run directly", "When it's imported", "Only in tests"], 1, "Imported modules get their module name instead."],
  p: [{ t: "Write <code>main(argv)</code> that greets the first argument, or \"world\" when there is none.",
    c: R`def main(argv):
    return "Hello!"   # TODO

if __name__ == "__main__":
    print(main([]))
    print(main(["Ada"]))`,
    s: R`def main(argv):
    name = argv[0] if argv else "world"
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(main([]))
    print(main(["Ada"]))`, o: "Hello, world!\nHello, Ada!" }] },
testing: { e: "✅", k: "A test calls your code with known input and <b>asserts</b> the result. pytest finds <code>test_*</code> functions and reports each failing <code>assert</code>.",
  r: ["Test edge cases: 0, negatives, empty input.", "One behaviour per test keeps failures clear.", "Run tests before every commit."],
  q: ["What does assert x == 3 do when x is 2?", ["Prints False", "Raises AssertionError", "Sets x to 3", "Nothing"], 1, "A failed assert raises AssertionError, which pytest reports."],
  p: [{ t: "These tests fail because <code>is_even</code> has a bug. Fix the function, not the tests.",
    c: R`def is_even(n):
    return n % 2 == 1

def test_is_even():
    assert is_even(0)
    assert is_even(4)
    assert not is_even(7)
    assert is_even(-2)

test_is_even()
print("all tests passed")`,
    s: R`def is_even(n):
    return n % 2 == 0

def test_is_even():
    assert is_even(0)
    assert is_even(4)
    assert not is_even(7)
    assert is_even(-2)

test_is_even()
print("all tests passed")`, o: "all tests passed" }] },
quality: { e: "🧹", k: "Readable Python is idiomatic Python: <code>enumerate</code> instead of index counters, <code>zip</code> to walk lists together, clear names. Tools like Ruff and Black enforce it.",
  r: ["Format with Black or <code>ruff format</code>; lint with Ruff.", "Follow PEP 8 names: <code>snake_case</code>, <code>PascalCase</code>.", "Let tools argue about style, not people."],
  q: ["Most Pythonic way to loop over two lists together?", ["for i in range(len(a))", "zip(a, b)", "while loop", "map with lambda"], 1, "zip pairs the items for you."],
  p: [{ t: "Rewrite the loop with <code>enumerate</code> and <code>zip</code> (same output, no indexes).",
    c: R`names = ["Ada", "Linus"]
scores = [90, 85]
for i in range(len(names)):
    print(str(i + 1) + ". " + names[i] + ": " + str(scores[i]))`,
    s: R`names = ["Ada", "Linus"]
scores = [90, 85]
for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"{i}. {name}: {score}")`, o: "1. Ada: 90\n2. Linus: 85" }] },
apps: { e: "🌐", k: "Most apps talk JSON: <code>json.loads</code> turns text into dicts and lists, <code>json.dumps</code> turns them back. Web frameworks and databases build on this.",
  r: ["APIs: <code>requests</code> or <code>httpx</code>; web: FastAPI, Flask, Django.", "<code>sqlite3</code> is a database built into Python.", "Validate input before trusting it."],
  q: ["json.loads('[1, 2]') returns?", ["\"[1, 2]\"", "[1, 2] (a list)", "(1, 2)", "A dict"], 1, "JSON arrays become Python lists."],
  p: [{ t: "Parse the JSON order and print its total (quantity × price).",
    c: R`import json

data = '[{"item": "tea", "qty": 2, "price": 3.5}, {"item": "cake", "qty": 1, "price": 4}]'
total = 0   # TODO
print(total)`,
    s: R`import json

data = '[{"item": "tea", "qty": 2, "price": 3.5}, {"item": "cake", "qty": 1, "price": 4}]'
order = json.loads(data)
total = sum(line["qty"] * line["price"] for line in order)
print(total)`, o: "11.0" }] },
cheatsheet: { e: "📋", k: "Everything in one place. Use the search box at the top to filter it." }
  }
};
})();
