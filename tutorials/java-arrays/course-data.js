/* Course mode for this page (see assets/course.js): which parts of the page are lessons,
   plus each lesson's key idea, Remember points, practice exercises and quick check. */
window.COURSE = {
  key: "ja", title: "Inside Java Arrays", lang: "java",
  parts: [
    { name: "Memory", color: "var(--stack)" },
    { name: "Copying & 2D", color: "var(--heap)" },
    { name: "Internals", color: "var(--hot)" },
    { name: "Coding", color: "var(--pool)" },
    { name: "Wrap-up", color: "var(--stack)" }
  ],
  fold: ".jx",
  foldLabel: el => (el.querySelector("h4") && el.querySelector("h4").textContent) || "More runnable examples",
  tag() {
    const hero = document.querySelector(".hero");
    hero.parentElement.dataset.onlyHome = "";
    hero.insertAdjacentHTML("beforeend", '<div data-cta></div><div data-parts></div>');
    document.querySelector("nav.topics").dataset.onlyAll = "";
    let n = 0, p = 0;
    document.querySelectorAll("section.topic").forEach(sec => {
      if (sec.id === "quiz" || sec.id === "quick") {
        sec.dataset.lesson = ""; sec.dataset.part = 4; sec.dataset.title = sec.querySelector("h2").textContent;
        return;
      }
      sec.dataset.wrap = ""; sec.firstElementChild.dataset.onlyAll = "";
      sec.querySelectorAll("article.q").forEach(a => {
        const h = a.querySelector("h3"), t = h.cloneNode(true); t.querySelector(".n")?.remove();
        if (!a.id) a.id = "q" + (++n); a.dataset.lesson = ""; a.dataset.part = p; a.dataset.title = t.textContent.trim();
        h.dataset.head = "";
      });
      p++;
    });
  },
  data: {
q1: { e: "📦", k: "An array is <b>one object on the heap</b> with a fixed number of slots. The variable holds only its address.",
  r: ["The size is fixed when the array is created.", "<code>length</code> is a field, not a method.", "Indexes run from <code>0</code> to <code>length - 1</code>."],
  q: ["int[] a = new int[5]; What is a.length?", ["4", "5", "6", "It depends on the values"], 1, "length is the number of slots: 5. The last index is 4."],
  p: [{ t: "Compute the sum and the average of the array with a loop. Make the average a <code>double</code>.",
    c: `class Main {
    public static void main(String[] args) {
        int[] nums = {4, 8, 15, 16, 23, 42};
        int sum = 0;            // TODO
        double avg = 0;         // TODO
        System.out.println(sum + " " + avg);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        int[] nums = {4, 8, 15, 16, 23, 42};
        int sum = 0;
        for (int n : nums) sum += n;
        double avg = (double) sum / nums.length;
        System.out.println(sum + " " + avg);
    }
}`, o: "108 18.0" }] },
q2: { e: "0️⃣", k: "New arrays are <b>filled with defaults</b>: <code>0</code> for numbers, <code>false</code> for boolean, <code>'\\u0000'</code> for char, <code>null</code> for objects.",
  r: ["Local variables have no default, but array slots always do.", "An array of objects starts as all <code>null</code>: no objects yet.", "<code>Arrays.fill</code> sets every slot to one value."],
  q: ["new String[3] holds what?", ["Three empty strings \"\"", "Three nulls", "Nothing: it throws", "Three \"null\" texts"], 1, "Slots of a reference type start as null. No String objects exist yet."],
  p: [{ t: "Create the four arrays (sizes 3, 2, 2 and 1) so the program prints their default values.",
    c: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = null;        // TODO: new int[3]
        boolean[] b = null;    // TODO
        String[] c = null;     // TODO
        double[] d = null;     // TODO
        System.out.println(Arrays.toString(a) + " " + Arrays.toString(b) + " "
            + Arrays.toString(c) + " " + Arrays.toString(d));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = new int[3];
        boolean[] b = new boolean[2];
        String[] c = new String[2];
        double[] d = new double[1];
        System.out.println(Arrays.toString(a) + " " + Arrays.toString(b) + " "
            + Arrays.toString(c) + " " + Arrays.toString(d));
    }
}`, o: "[0, 0, 0] [false, false] [null, null] [0.0]" }] },
q3: { e: "🔗", k: "An array of objects stores <b>references</b>, not the objects. Each slot points somewhere else, or holds <code>null</code>.",
  r: ["Creating the array does not create the elements.", "Calling a method on a <code>null</code> slot throws NullPointerException.", "Two slots can point at the same object."],
  q: ["String[] s = new String[2]; s[0].length() does what?", ["Returns 0", "Throws NullPointerException", "Returns null", "Does not compile"], 1, "s[0] is null, so calling a method on it throws."],
  p: [{ t: "Print each name's length, or <code>-</code> for an empty (null) slot. The starter crashes; make it safe.",
    c: `class Main {
    public static void main(String[] args) {
        String[] names = {"Ada", null, "Linus"};
        StringBuilder out = new StringBuilder();
        for (String n : names) {
            out.append(n.length()).append(' ');   // TODO: handle null
        }
        System.out.println(out.toString().trim());
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String[] names = {"Ada", null, "Linus"};
        StringBuilder out = new StringBuilder();
        for (String n : names) {
            out.append(n == null ? "-" : String.valueOf(n.length())).append(' ');
        }
        System.out.println(out.toString().trim());
    }
}`, o: "3 - 5" }] },
q4: { e: "📨", k: "Java passes the <b>address by value</b>. A method can change the array's slots, but reassigning its parameter doesn't affect the caller.",
  r: ["<code>a[i] = …</code> inside a method is visible to the caller.", "<code>a = new int[3]</code> inside a method only moves the local copy.", "Java has no pass-by-reference."],
  q: ["void f(int[] a) { a = new int[]{9}; } After f(x), x is…", ["[9]", "unchanged", "null", "a compile error"], 1, "The method rebinds its own copy of the address; x still points to the old array."],
  p: [{ t: "Write <code>doubleAll</code> so it doubles every element <b>in place</b> (the caller sees the change).",
    c: `import java.util.Arrays;

class Main {
    static void doubleAll(int[] a) {
        // TODO
    }
    public static void main(String[] args) {
        int[] x = {1, 2, 3};
        doubleAll(x);
        System.out.println(Arrays.toString(x));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    static void doubleAll(int[] a) {
        for (int i = 0; i < a.length; i++) a[i] *= 2;
    }
    public static void main(String[] args) {
        int[] x = {1, 2, 3};
        doubleAll(x);
        System.out.println(Arrays.toString(x));
    }
}`, o: "[2, 4, 6]" }] },
q5: { e: "📋", k: "<code>b = a</code> copies the <b>address</b>, not the array. Use <code>clone()</code>, <code>Arrays.copyOf</code>, <code>copyOfRange</code> or <code>System.arraycopy</code> for a real copy.",
  r: ["<code>Arrays.copyOf(a, n)</code> can also grow or shrink.", "<code>copyOfRange(a, from, to)</code>: <code>to</code> is exclusive.", "<code>System.arraycopy</code> copies into an array you already have."],
  q: ["int[] b = a; b[0] = 9; What is a[0]?", ["The old value", "9", "0", "It throws"], 1, "a and b point to the same array object."],
  p: [{ t: "Take the middle three numbers with <code>Arrays.copyOfRange</code>, and grow the array to length 9 with <code>Arrays.copyOf</code>.",
    c: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 6, 7};
        int[] mid = a;   // TODO: [3, 4, 5]
        int[] big = a;   // TODO: length 9
        System.out.println(Arrays.toString(mid) + " " + Arrays.toString(big));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 6, 7};
        int[] mid = Arrays.copyOfRange(a, 2, 5);
        int[] big = Arrays.copyOf(a, 9);
        System.out.println(Arrays.toString(mid) + " " + Arrays.toString(big));
    }
}`, o: "[3, 4, 5] [1, 2, 3, 4, 5, 6, 7, 0, 0]" }] },
q6: { e: "🪆", k: "A <b>shallow</b> copy duplicates the outer array only; inner arrays and objects are still shared. A <b>deep</b> copy duplicates every level.",
  r: ["<code>clone()</code> on a 2D array is shallow.", "Deep-copy a 2D array by cloning each row.", "Shared rows mean a change through one copy shows in the other."],
  q: ["int[][] b = a.clone(); b[0][0] = 9; Does a[0][0] change?", ["Yes: the rows are shared", "No: clone is deep", "It throws", "Only for Integer[][]"], 0, "clone copied the row references, so a[0] and b[0] are the same row."],
  p: [{ t: "<code>deepCopy</code> uses <code>clone()</code>, which is shallow, so both print 99. Fix it so the original keeps its 1.",
    c: `class Main {
    static int[][] deepCopy(int[][] g) {
        return g.clone();   // TODO: copy each row too
    }
    public static void main(String[] args) {
        int[][] g = {{1, 2}, {3, 4}};
        int[][] copy = deepCopy(g);
        copy[0][0] = 99;
        System.out.println(g[0][0] + " " + copy[0][0]);
    }
}`,
    s: `class Main {
    static int[][] deepCopy(int[][] g) {
        int[][] c = new int[g.length][];
        for (int i = 0; i < g.length; i++) c[i] = g[i].clone();
        return c;
    }
    public static void main(String[] args) {
        int[][] g = {{1, 2}, {3, 4}};
        int[][] copy = deepCopy(g);
        copy[0][0] = 99;
        System.out.println(g[0][0] + " " + copy[0][0]);
    }
}`, o: "1 99" }] },
q7: { e: "🪜", k: "A 2D array is an <b>array of arrays</b>, so each row can have its own length: a <b>jagged</b> array.",
  r: ["<code>new int[3][]</code> makes 3 empty row slots (null).", "Use <code>grid[i].length</code> for each row's size.", "Good for triangles and uneven data."],
  q: ["int[][] t = new int[3][]; What is t[1]?", ["An empty int[]", "null", "0", "It throws"], 1, "Only the outer array exists; each row must be created separately."],
  p: [{ t: "Build Pascal's triangle with 5 rows as a jagged array (row <code>i</code> has <code>i + 1</code> numbers) and print the last row.",
    c: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[][] tri = new int[5][];
        for (int i = 0; i < 5; i++) {
            tri[i] = new int[i + 1];
            // TODO: ends are 1, inside is the sum of the two numbers above
        }
        System.out.println(Arrays.toString(tri[4]));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[][] tri = new int[5][];
        for (int i = 0; i < 5; i++) {
            tri[i] = new int[i + 1];
            tri[i][0] = tri[i][i] = 1;
            for (int j = 1; j < i; j++) tri[i][j] = tri[i - 1][j - 1] + tri[i - 1][j];
        }
        System.out.println(Arrays.toString(tri[4]));
    }
}`, o: "[1, 4, 6, 4, 1]" }] },
q8: { e: "🟰", k: "<code>==</code> and <code>a.equals(b)</code> both compare <b>addresses</b> for arrays. Use <code>Arrays.equals</code>, or <code>Arrays.deepEquals</code> for nested arrays.",
  r: ["Arrays don't override <code>equals()</code>.", "<code>Arrays.equals</code> on 2D arrays compares row addresses: use <code>deepEquals</code>.", "<code>Arrays.hashCode</code> matches <code>Arrays.equals</code>."],
  q: ["a = {1,2}; b = {1,2}; What does a.equals(b) return?", ["true", "false", "It doesn't compile", "It throws"], 1, "Arrays inherit Object.equals, which is ==."],
  p: [{ t: "Both comparisons print <code>false</code>. Use the right <code>Arrays</code> helpers so both print <code>true</code>.",
    c: `class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3}, b = {1, 2, 3};
        int[][] x = {{1}, {2}}, y = {{1}, {2}};
        boolean same1 = a == b;          // TODO
        boolean same2 = x.equals(y);     // TODO
        System.out.println(same1 + " " + same2);
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3}, b = {1, 2, 3};
        int[][] x = {{1}, {2}}, y = {{1}, {2}};
        boolean same1 = Arrays.equals(a, b);
        boolean same2 = Arrays.deepEquals(x, y);
        System.out.println(same1 + " " + same2);
    }
}`, o: "true true" }] },
q9: { e: "⚡", k: "The address of <code>a[i]</code> is <b>base + i × size</b>: one multiplication, so access is O(1). Index 0 means \"0 steps from the base\".",
  r: ["Slots are contiguous in memory.", "Access time doesn't depend on the array's length.", "Index arithmetic (<code>%</code>, <code>+ k</code>) lets you rotate and wrap around."],
  q: ["Why is a[i] O(1)?", ["The JVM caches every element", "Its address is computed directly from i", "Arrays are sorted", "It uses a hash table"], 1, "base + i × elementSize: no searching."],
  p: [{ t: "Rotate the array left by <code>k</code> using index arithmetic: <code>res[i] = a[(i + k) % n]</code>.",
    c: `import java.util.Arrays;

class Main {
    static int[] rotateLeft(int[] a, int k) {
        int n = a.length;
        int[] res = new int[n];
        // TODO
        return res;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(rotateLeft(new int[]{1, 2, 3, 4, 5}, 2)));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    static int[] rotateLeft(int[] a, int k) {
        int n = a.length;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[i] = a[(i + k) % n];
        return res;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(rotateLeft(new int[]{1, 2, 3, 4, 5}, 2)));
    }
}`, o: "[3, 4, 5, 1, 2]" }] },
q10: { e: "🚧", k: "Every access is <b>bounds-checked</b>: an index below 0 or ≥ <code>length</code> throws <code>ArrayIndexOutOfBoundsException</code>.",
  r: ["The classic bug is <code>i &lt;= a.length</code>; use <code>&lt;</code>.", "The last element is <code>a[a.length - 1]</code>.", "Enhanced for (<code>for (int x : a)</code>) can't go out of bounds."],
  q: ["int[] a = new int[3]; Which access throws?", ["a[0]", "a[2]", "a[3]", "a[a.length - 1]"], 2, "Valid indexes are 0, 1 and 2."],
  p: [{ t: "This crashes with an off-by-one bug. Fix the loop.",
    c: `class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int i = 0; i <= a.length; i++) sum += a[i];
        System.out.println(sum);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int i = 0; i < a.length; i++) sum += a[i];
        System.out.println(sum);
    }
}`, o: "15" }] },
q11: { e: "🧨", k: "Arrays are <b>covariant</b> (<code>String[]</code> is an <code>Object[]</code>), so the JVM checks every store at run time and throws <code>ArrayStoreException</code> on a wrong type.",
  r: ["It compiles fine and fails only at run time.", "Generic collections catch this at compile time instead.", "The array remembers its real element type."],
  q: ["Object[] o = new String[1]; o[0] = 1; What happens?", ["Compile error", "ArrayStoreException at run time", "o[0] becomes \"1\"", "Nothing"], 1, "The real array is a String[], so storing an Integer fails at run time."],
  p: [{ t: "Catch the exception and print <code>caught</code> plus its simple class name.",
    c: `class Main {
    public static void main(String[] args) {
        Object[] objs = new String[2];
        objs[0] = "ok";
        objs[1] = 42;       // TODO: wrap in try/catch
        System.out.println("done");
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        Object[] objs = new String[2];
        objs[0] = "ok";
        try {
            objs[1] = 42;
        } catch (ArrayStoreException e) {
            System.out.println("caught " + e.getClass().getSimpleName());
        }
    }
}`, o: "caught ArrayStoreException" }] },
q12: { e: "⚖️", k: "Use an <b>array</b> for a fixed size and primitives (fast, compact). Use an <b>ArrayList</b> when the size changes or you want handy methods.",
  r: ["ArrayList holds objects, so <code>int</code> becomes <code>Integer</code>.", "ArrayList grows by about 1.5× when full.", "<code>removeIf</code>, <code>contains</code>, <code>sort</code> come for free."],
  q: ["You need a list that grows as users add items. Which?", ["int[]", "ArrayList<Integer>", "int[][]", "String"], 1, "An array has a fixed size; ArrayList grows."],
  p: [{ t: "Put the numbers in an <code>ArrayList</code> and remove the even ones with <code>removeIf</code>.",
    c: `import java.util.*;

class Main {
    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5, 6};
        List<Integer> list = new ArrayList<>();
        // TODO: add every number, then remove the evens
        System.out.println(list);
    }
}`,
    s: `import java.util.*;

class Main {
    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5, 6};
        List<Integer> list = new ArrayList<>();
        for (int n : nums) list.add(n);
        list.removeIf(n -> n % 2 == 0);
        System.out.println(list);
    }
}`, o: "[1, 3, 5]" }] },
q13: { e: "🔍", k: "Binary search halves a <b>sorted</b> array each step: look at the middle, then keep only the half that can hold the target. O(log n).",
  r: ["Only works on sorted data.", "Use <code>mid = lo + (hi - lo) / 2</code> to avoid overflow.", "1,000,000 items need at most 20 steps."],
  q: ["About how many halvings does binary search need for 1,024 sorted items?", ["10", "100", "512", "1024"], 0, "log₂(1024) = 10: each step halves what is left."],
  p: [{ t: "Find the <b>first</b> position of the target when there are duplicates (keep searching left after a hit). Return -1 if missing.",
    c: `class Main {
    static int firstIndex(int[] a, int target) {
        int lo = 0, hi = a.length - 1, ans = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            // TODO
            lo = hi + 1;
        }
        return ans;
    }
    public static void main(String[] args) {
        int[] a = {1, 2, 2, 2, 3, 5};
        System.out.println(firstIndex(a, 2) + " " + firstIndex(a, 4));
    }
}`,
    s: `class Main {
    static int firstIndex(int[] a, int target) {
        int lo = 0, hi = a.length - 1, ans = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) { ans = mid; hi = mid - 1; }   // keep looking left
            else if (a[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return ans;
    }
    public static void main(String[] args) {
        int[] a = {1, 2, 2, 2, 3, 5};
        System.out.println(firstIndex(a, 2) + " " + firstIndex(a, 4));
    }
}`, o: "1 -1" }] },
q14: { e: "🫧", k: "Bubble sort swaps neighbours that are out of order; after each pass the largest remaining value has bubbled to the end. O(n²).",
  r: ["After pass k, the last k items are final.", "Stop early when a pass makes no swaps.", "Fine for tiny or nearly sorted arrays only."],
  q: ["What is the best case of bubble sort with an early-exit flag?", ["O(1)", "O(n)", "O(n log n)", "O(n²)"], 1, "On sorted input one pass finds no swaps and stops."],
  p: [{ t: "Add an early-exit flag so sorting stops after a pass with no swaps. Print how many passes ran.",
    c: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 5, 4};
        int passes = 0;
        for (int i = 0; i < a.length - 1; i++) {
            passes++;
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
            }
            // TODO: stop if this pass swapped nothing
        }
        System.out.println(Arrays.toString(a) + " " + passes);
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 5, 4};
        int passes = 0;
        for (int i = 0; i < a.length - 1; i++) {
            passes++;
            boolean swapped = false;
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swapped = true; }
            }
            if (!swapped) break;
        }
        System.out.println(Arrays.toString(a) + " " + passes);
    }
}`, o: "[1, 2, 3, 4, 5] 2   (before your change: [1, 2, 3, 4, 5] 4)" }] },
q15: { e: "📈", k: "Kadane: at each number, either <b>extend</b> the current run or <b>start fresh</b> here, whichever is bigger. Track the best sum seen. O(n).",
  r: ["<code>cur = max(x, cur + x)</code>; <code>best = max(best, cur)</code>.", "Start <code>best</code> at <code>a[0]</code> so all-negative arrays work.", "One pass, no extra memory."],
  q: ["Max subarray sum of {-3, -1, -2}?", ["0", "-1", "-6", "-3"], 1, "The best non-empty subarray is just {-1}."],
  p: [{ t: "Extend Kadane to also report <b>where</b> the best subarray starts and ends.",
    c: `class Main {
    public static void main(String[] args) {
        int[] a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        int best = a[0], cur = a[0];
        int start = 0, end = 0, curStart = 0;
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);
            best = Math.max(best, cur);
            // TODO: track curStart, start and end
        }
        System.out.println(best + " " + start + " " + end);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        int[] a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        int best = a[0], cur = a[0];
        int start = 0, end = 0, curStart = 0;
        for (int i = 1; i < a.length; i++) {
            if (a[i] > cur + a[i]) { cur = a[i]; curStart = i; }
            else cur += a[i];
            if (cur > best) { best = cur; start = curStart; end = i; }
        }
        System.out.println(best + " " + start + " " + end);
    }
}`, o: "6 3 6" }] },
q16: { e: "👯", k: "On a sorted array, put one pointer at each end. Sum too small? Move the left one right. Too big? Move the right one left. O(n), no extra memory.",
  r: ["Only works because the array is sorted.", "Each step discards one element for good.", "The same two-pointer idea removes duplicates and merges sorted arrays."],
  q: ["Sum of the two pointers is too big. Which pointer moves?", ["Left moves right", "Right moves left", "Both move", "Restart"], 1, "Moving right leftwards picks a smaller number, lowering the sum."],
  p: [{ t: "Count <b>all</b> pairs that add up to the target (the numbers are distinct).",
    c: `class Main {
    static int countPairs(int[] a, int target) {
        int i = 0, j = a.length - 1, count = 0;
        // TODO: two pointers; on a match count it and move both
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countPairs(new int[]{1, 2, 3, 4, 5, 6}, 7));
    }
}`,
    s: `class Main {
    static int countPairs(int[] a, int target) {
        int i = 0, j = a.length - 1, count = 0;
        while (i < j) {
            int sum = a[i] + a[j];
            if (sum == target) { count++; i++; j--; }
            else if (sum < target) i++;
            else j--;
        }
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countPairs(new int[]{1, 2, 3, 4, 5, 6}, 7));
    }
}`, o: "3" },
  { t: "Two pointers again: remove duplicates from a sorted array <b>in place</b> and return the new length.",
    c: `import java.util.Arrays;

class Main {
    static int dedupe(int[] a) {
        int w = 1;   // next slot to write
        // TODO: copy a[r] to a[w] whenever it differs from a[w - 1]
        return w;
    }
    public static void main(String[] args) {
        int[] a = {1, 1, 2, 3, 3, 3, 4};
        int n = dedupe(a);
        System.out.println(n + " " + Arrays.toString(Arrays.copyOf(a, n)));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    static int dedupe(int[] a) {
        int w = 1;
        for (int r = 1; r < a.length; r++) {
            if (a[r] != a[w - 1]) a[w++] = a[r];
        }
        return w;
    }
    public static void main(String[] args) {
        int[] a = {1, 1, 2, 3, 3, 3, 4};
        int n = dedupe(a);
        System.out.println(n + " " + Arrays.toString(Arrays.copyOf(a, n)));
    }
}`, o: "4 [1, 2, 3, 4]" }] },
repo: { e: "🗂️", k: "Your own programs from GitHub, ready to run. Open one, press <b>Run</b>, then compare it with the fixed version: three throw errors as written and three give wrong results.",
  r: ["Programs that read the keyboard throw <code>NoSuchElementException</code> when no input is given.", "A <code>;</code> right after <code>if (...)</code> makes the next block run every time.", "Do integer division last: <code>n * (n + 1) / 2</code>."],
  q: ["SumThree always prints true. Why?", ["Arrays.sort is wrong", "A stray ; after the if", "twosum never returns false", "The array has duplicates"], 1, "if (cond); ends the if, so the { return true; } block always runs."] },
quiz: { e: "🎯", k: "Predict first, then click. Every wrong guess shows you which memory rule you missed." },
quick: { e: "⚡", k: "Short answers to the follow-up questions interviewers like to add at the end." }
  }
};
