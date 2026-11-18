/* Course mode for this page (see assets/course.js): which parts of the page are lessons,
   plus each lesson's key idea, Remember points, practice exercises and quick check. */
window.COURSE = {
  key: "js", title: "Inside java.lang.String", lang: "java",
  parts: [
    { name: "Memory", color: "var(--stack)" },
    { name: "Immutability", color: "var(--pool)" },
    { name: "Concatenation", color: "var(--heap)" },
    { name: "Internals", color: "var(--hot)" },
    { name: "Coding", color: "var(--stack)" },
    { name: "Wrap-up", color: "var(--pool)" }
  ],
  fold: ".jx",
  foldLabel: el => (el.querySelector("h4") && el.querySelector("h4").textContent) || "More runnable examples",
  tag() {
    const hero = document.querySelector(".hero");
    hero.parentElement.dataset.onlyHome = "";
    hero.insertAdjacentHTML("beforeend", '<div data-cta></div><div data-parts></div>');
    document.querySelector("nav.topics").dataset.onlyAll = "";
    let n = 0;
    document.querySelectorAll("section.topic").forEach((sec, p) => {
      if (sec.id === "quiz" || sec.id === "quick") {
        sec.dataset.lesson = ""; sec.dataset.part = 5; sec.dataset.title = sec.querySelector("h2").textContent;
        return;
      }
      sec.dataset.wrap = ""; sec.firstElementChild.dataset.onlyAll = "";
      sec.querySelectorAll("article.q").forEach(a => {
        const h = a.querySelector("h3"), t = h.cloneNode(true); t.querySelector(".n")?.remove();
        a.id = "q" + (++n); a.dataset.lesson = ""; a.dataset.part = p; a.dataset.title = t.textContent.trim();
        h.dataset.head = "";
      });
    });
  },
  data: {
q1: { e: "🧱", k: "A String is an <b>object</b>. Your variable holds only its address; the characters live in a <code>byte[]</code> inside the object.",
  r: ["<code>String</code> is a <code>final</code> class, not a primitive.", "Since Java 9 the characters are stored in a <code>byte[]</code> plus a <code>coder</code> flag.", "<code>toCharArray()</code> returns a <b>copy</b>, so changing it never changes the String."],
  q: ["What does the variable in String s = \"java\"; actually hold?", ["The four characters", "The address of a String object", "A char[] array", "A primitive value"], 1, "A variable of a class type holds a reference (address) to the object on the heap."],
  p: [{ t: "Fill in the four TODO lines using String methods (<code>length()</code>, <code>charAt()</code>, <code>toUpperCase()</code>, <code>indexOf()</code>).",
    c: `class Main {
    public static void main(String[] args) {
        String s = "Programming";
        int len = 0;          // TODO: number of characters
        char first = '?';     // TODO: first character
        char last = '?';      // TODO: last character (hint: len - 1)
        int g = -1;           // TODO: index of the first 'g'
        System.out.println(len + " " + first + " " + last + " " + s.toUpperCase() + " " + g);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String s = "Programming";
        int len = s.length();
        char first = s.charAt(0);
        char last = s.charAt(len - 1);
        int g = s.indexOf('g');
        System.out.println(len + " " + first + " " + last + " " + s.toUpperCase() + " " + g);
    }
}`, o: "11 P g PROGRAMMING 3" }] },
q2: { e: "🏊", k: "String <b>literals</b> with the same text share <b>one</b> object in the String Constant Pool.",
  r: ["The pool lives in the heap (since Java 7).", "Literals and compile-time constants go to the pool automatically.", "Strings built at run time (<code>new</code>, <code>StringBuilder</code>, concatenation of variables) do not."],
  q: ["String a = \"hi\"; String b = \"hi\"; What is a == b?", ["true: both point to the pooled object", "false: two objects are made", "It does not compile", "It depends on the JVM"], 0, "Both literals resolve to the same pooled object, so the addresses are equal."],
  p: [{ t: "Change only the line that creates <code>d</code> so that the last value printed becomes <code>true</code>.",
    c: `class Main {
    public static void main(String[] args) {
        String a = "hi";
        String b = "hi";
        String c = new String("hi");
        String d = c;            // TODO: make d point to the pooled "hi"
        System.out.println((a == b) + " " + (a == c) + " " + (a == d));
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String a = "hi";
        String b = "hi";
        String c = new String("hi");
        String d = c.intern();   // returns the pooled copy
        System.out.println((a == b) + " " + (a == c) + " " + (a == d));
    }
}`, o: "true false true" }] },
q3: { e: "🔢", k: "<code>new String(\"java\")</code> always makes a <b>new heap object</b>. The literal inside it may add one more to the pool, if it is not there yet.",
  r: ["Up to 2 objects: one in the pool (first time only) and one on the heap.", "<code>new</code> never returns a pooled object.", "Avoid <code>new String(\"...\")</code> in real code; it only wastes memory."],
  q: ["The pool already holds \"java\". How many new objects does new String(\"java\") create now?", ["0", "1", "2", "3"], 1, "The literal is already pooled, so only the new heap object is created."],
  p: [{ t: "Change how <code>s2</code> is created so the program prints <code>true false</code> (same text, different objects).",
    c: `class Main {
    public static void main(String[] args) {
        String s1 = "java";
        String s2 = "java";      // TODO: create a separate object with the same text
        System.out.println(s1.equals(s2) + " " + (s1 == s2));
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String s1 = "java";
        String s2 = new String("java");
        System.out.println(s1.equals(s2) + " " + (s1 == s2));
    }
}`, o: "true false" }] },
q4: { e: "⚖️", k: "<code>==</code> compares <b>addresses</b>. <code>equals()</code> compares the <b>characters</b>. Use <code>equals()</code> for text.",
  r: ["<code>==</code> on Strings is almost always a bug.", "Write <code>\"java\".equals(s)</code> so a null <code>s</code> can't throw.", "<code>equalsIgnoreCase()</code> ignores upper/lower case."],
  q: ["Which comparison is null-safe when s may be null?", ["s.equals(\"yes\")", "\"yes\".equals(s)", "s == \"yes\"", "s.compareTo(\"yes\") == 0"], 1, "Calling equals on the literal never dereferences s, so a null s just gives false."],
  p: [{ t: "Write <code>safeEquals</code> so it never throws: two nulls are equal, one null is not, otherwise compare the text. Don't use <code>Objects.equals</code>.",
    c: `class Main {
    static boolean safeEquals(String a, String b) {
        return a.equals(b);      // TODO: this throws when a is null
    }
    public static void main(String[] args) {
        System.out.println(safeEquals(null, null) + " " + safeEquals(null, "x") + " "
            + safeEquals("x", new String("x")) + " " + safeEquals("Java", "java"));
    }
}`,
    s: `class Main {
    static boolean safeEquals(String a, String b) {
        if (a == b) return true;           // same object, or both null
        if (a == null || b == null) return false;
        return a.equals(b);
    }
    public static void main(String[] args) {
        System.out.println(safeEquals(null, null) + " " + safeEquals(null, "x") + " "
            + safeEquals("x", new String("x")) + " " + safeEquals("Java", "java"));
    }
}`, o: "true false true false" }] },
q5: { e: "📌", k: "<code>intern()</code> returns the <b>pooled</b> String with the same text, adding it to the pool if needed.",
  r: ["After interning, <code>==</code> works between equal texts.", "Use it rarely: for many repeated values read at run time.", "The pool is a hash table, so interning has a cost."],
  q: ["What does s.intern() return?", ["A copy of s", "The pooled String with the same text", "s converted to char[]", "null when s is not pooled"], 1, "It looks the text up in the pool and returns that object (adding s if it was missing)."],
  p: [{ t: "<code>built</code> is made at run time. Make <code>pooled</code> refer to the pool's copy so the output becomes <code>false true</code>.",
    c: `class Main {
    public static void main(String[] args) {
        String lit = "hello";
        String built = new StringBuilder("hel").append("lo").toString();
        String pooled = built;   // TODO
        System.out.println((built == lit) + " " + (pooled == lit));
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String lit = "hello";
        String built = new StringBuilder("hel").append("lo").toString();
        String pooled = built.intern();
        System.out.println((built == lit) + " " + (pooled == lit));
    }
}`, o: "false true" }] },
q6: { e: "🧊", k: "A String object <b>never changes</b>. Methods like <code>toUpperCase()</code> return a <b>new</b> String; you must keep the result.",
  r: ["<code>s.toUpperCase();</code> on its own line does nothing useful.", "Write <code>s = s.toUpperCase();</code> to move the variable to the new object.", "The old object is left for the garbage collector."],
  q: ["String s = \"java\"; s.concat(\"!\"); System.out.println(s); prints?", ["java!", "java", "!", "It does not compile"], 1, "concat returns a new String, which was thrown away. s still points to \"java\"."],
  p: [{ t: "The program prints <code>java</code>. Fix it so it prints <code>JAVA!</code>, still using <code>toUpperCase()</code> and <code>concat()</code>.",
    c: `class Main {
    public static void main(String[] args) {
        String s = "java";
        s.toUpperCase();
        s.concat("!");
        System.out.println(s);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String s = "java";
        s = s.toUpperCase().concat("!");
        System.out.println(s);
    }
}`, o: "JAVA!" }] },
q7: { e: "🛡️", k: "Immutability makes Strings <b>safe to share</b>: in the pool, across threads, as HashMap keys and in security checks.",
  r: ["Sharing in the pool only works because nobody can change the text.", "Immutable means thread-safe without locks.", "The hash code can be cached because it never changes."],
  q: ["Which is NOT a reason String is immutable?", ["String pool sharing", "Thread safety", "Faster += in loops", "Caching hashCode"], 2, "+= in loops is slow precisely because each step creates a new String."],
  p: [{ t: "Replace every vowel with <code>*</code> using <code>replaceAll(\"[aeiou]\", \"*\")</code>. Print the original and the result to see the original is untouched.",
    c: `class Main {
    public static void main(String[] args) {
        String word = "immutable";
        String masked = word;    // TODO
        System.out.println(word + " " + masked);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String word = "immutable";
        String masked = word.replaceAll("[aeiou]", "*");
        System.out.println(word + " " + masked);
    }
}`, o: "immutable *mm*t*bl*" }] },
q8: { e: "#️⃣", k: "<code>hashCode()</code> is <code>s[0]·31ⁿ⁻¹ + … + s[n-1]</code>, computed once and <b>cached</b> in the object.",
  r: ["Equal Strings always have equal hash codes.", "Different Strings can share a hash code (a collision).", "Caching is safe only because the String can't change."],
  q: ["Two Strings have the same hashCode(). Are they equal?", ["Always", "Not necessarily", "Never", "Only if both are pooled"], 1, "Collisions exist, e.g. \"Aa\" and \"BB\" both hash to 2112."],
  p: [{ t: "Implement the formula <code>h = 31 * h + c</code> for every character, and check it matches <code>hashCode()</code>.",
    c: `class Main {
    static int myHash(String s) {
        int h = 0;
        // TODO: loop over the characters
        return h;
    }
    public static void main(String[] args) {
        String s = "abc";
        System.out.println(myHash(s) + " " + s.hashCode() + " " + (myHash(s) == s.hashCode()));
    }
}`,
    s: `class Main {
    static int myHash(String s) {
        int h = 0;
        for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
        return h;
    }
    public static void main(String[] args) {
        String s = "abc";
        System.out.println(myHash(s) + " " + s.hashCode() + " " + (myHash(s) == s.hashCode()));
    }
}`, o: "96354 96354 true" }] },
q9: { e: "🧩", k: "The compiler joins <b>constants</b> ahead of time, so <code>\"hel\" + \"lo\"</code> is the pooled <code>\"hello\"</code>. A <b>variable</b> in the mix means a new object at run time.",
  r: ["Literals and <code>final</code> constants are folded at compile time.", "A non-final variable forces run-time concatenation.", "Run-time results are never pooled automatically."],
  q: ["final String y = \"hel\"; Is (y + \"lo\") == \"hello\"?", ["true", "false", "It does not compile", "It throws"], 0, "y is a compile-time constant, so y + \"lo\" is folded into the literal \"hello\"."],
  p: [{ t: "Make the program print <code>true</code> by adding a single word.",
    c: `class Main {
    public static void main(String[] args) {
        String y = "hel";
        String a = "hello";
        String b = y + "lo";
        System.out.println(a == b);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        final String y = "hel";   // now a compile-time constant
        String a = "hello";
        String b = y + "lo";      // folded to "hello"
        System.out.println(a == b);
    }
}`, o: "true" }] },
q10: { e: "🐌", k: "<code>s += x</code> inside a loop copies the whole String every time: <b>O(n²)</b>. A <code>StringBuilder</code> appends in place.",
  r: ["Each <code>+=</code> makes a new String and copies every old character.", "Create one <code>StringBuilder</code> before the loop.", "<code>String.join</code> and <code>Collectors.joining</code> are good too."],
  q: ["Why is += in a loop slow?", ["Strings are stored on disk", "Each step copies all previous characters into a new String", "The JIT is disabled in loops", "It uses synchronization"], 1, "n appends copy 1 + 2 + … + n characters, which is quadratic."],
  p: [{ t: "This works but uses <code>+=</code>. Rewrite it with a <code>StringBuilder</code>, putting commas only between numbers.",
    c: `class Main {
    public static void main(String[] args) {
        String out = "";
        for (int i = 1; i <= 5; i++) {
            out += i;
            if (i < 5) out += ",";
        }
        System.out.println(out);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            if (i > 1) sb.append(',');
            sb.append(i);
        }
        System.out.println(sb);
    }
}`, o: "1,2,3,4,5" }] },
q11: { e: "📈", k: "A StringBuilder starts with room for <b>16</b> chars and, when full, grows to <b>old × 2 + 2</b>, copying into a bigger array.",
  r: ["<code>capacity()</code> is room; <code>length()</code> is what's used.", "Pre-size with <code>new StringBuilder(n)</code> when you know the size.", "Growth is amortised O(1) per append."],
  q: ["A new StringBuilder() is full at 16 chars and you add one more. New capacity?", ["17", "32", "34", "64"], 2, "16 × 2 + 2 = 34."],
  p: [{ t: "Run it and check the rule old × 2 + 2. Then pre-size the builder so the capacity stays <code>64</code> the whole time.",
    c: `class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();   // TODO: pre-size it
        System.out.print(sb.capacity() + " ");
        sb.append("a".repeat(17));
        System.out.print(sb.capacity() + " ");
        sb.append("a".repeat(18));
        System.out.println(sb.capacity());
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder(64);
        System.out.print(sb.capacity() + " ");
        sb.append("a".repeat(17));
        System.out.print(sb.capacity() + " ");
        sb.append("a".repeat(18));
        System.out.println(sb.capacity());
    }
}`, o: "64 64 64   (before your change: 16 34 70)" }] },
q12: { e: "🧰", k: "<b>String</b> for fixed text, <b>StringBuilder</b> for building text in one thread, <b>StringBuffer</b> only for old code that shares a builder across threads.",
  r: ["StringBuilder and StringBuffer have the same methods.", "StringBuffer synchronises every call, so it is slower.", "Prefer StringBuilder; sharing a builder across threads is rare."],
  q: ["You build a long CSV line in one method. Which do you use?", ["String with +=", "StringBuilder", "StringBuffer", "char[] only"], 1, "One thread, lots of appends: StringBuilder is the fast choice."],
  p: [{ t: "Reverse the <b>order of words</b>: <code>\"Java is fun\"</code> → <code>\"fun is Java\"</code>. Use <code>split(\" \")</code> and a StringBuilder.",
    c: `class Main {
    static String reverseWords(String s) {
        StringBuilder sb = new StringBuilder();
        // TODO
        return sb.toString();
    }
    public static void main(String[] args) {
        System.out.println(reverseWords("Java is fun"));
    }
}`,
    s: `class Main {
    static String reverseWords(String s) {
        String[] words = s.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }
    public static void main(String[] args) {
        System.out.println(reverseWords("Java is fun"));
    }
}`, o: "fun is Java" }] },
q13: { e: "🗜️", k: "Compact Strings (Java 9) store Latin-1 text as <b>1 byte per char</b> and switch to 2 bytes (UTF-16) only if a character needs it.",
  r: ["The <code>coder</code> field says LATIN1 (0) or UTF16 (1).", "Most strings are Latin-1, so this halves their memory.", "One character above U+00FF makes the whole String UTF-16."],
  q: ["\"café\" is stored with which coder?", ["LATIN1: é is U+00E9", "UTF16: é is not ASCII", "UTF-8", "It depends on the OS"], 0, "é (233) fits in Latin-1 (0–255), so 1 byte per char is enough."],
  p: [{ t: "Count the characters that do <b>not</b> fit in Latin-1 (code above 255). One such character makes the String use 2 bytes per char.",
    c: `class Main {
    public static void main(String[] args) {
        String s = "na\\u00efve caf\\u00e9 \\u2615 \\u65e5\\u672c";
        int wide = 0;
        // TODO: loop and count chars > 255
        System.out.println(wide);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String s = "na\\u00efve caf\\u00e9 \\u2615 \\u65e5\\u672c";
        int wide = 0;
        for (char c : s.toCharArray()) if (c > 255) wide++;
        System.out.println(wide);
    }
}`, o: "3" }] },
q14: { e: "✂️", k: "Since Java 7u6, <code>substring()</code> <b>copies</b> the characters it needs, so a small piece never keeps a huge original alive.",
  r: ["<code>substring(begin, end)</code>: end is exclusive.", "Old JDKs shared the array, which could leak memory.", "Use <code>indexOf</code> to find the cut points."],
  q: ["\"hello\".substring(1, 3) is?", ["\"hel\"", "\"el\"", "\"ell\"", "\"ello\""], 1, "Indexes 1 and 2: 'e' and 'l'. The end index 3 is excluded."],
  p: [{ t: "Split an email into user and domain with <code>indexOf('@')</code> and <code>substring</code>.",
    c: `class Main {
    public static void main(String[] args) {
        String email = "ada@lovelace.dev";
        String user = "";     // TODO
        String domain = "";   // TODO
        System.out.println(user + " " + domain);
    }
}`,
    s: `class Main {
    public static void main(String[] args) {
        String email = "ada@lovelace.dev";
        int at = email.indexOf('@');
        String user = email.substring(0, at);
        String domain = email.substring(at + 1);
        System.out.println(user + " " + domain);
    }
}`, o: "ada lovelace.dev" }] },
q15: { e: "🔐", k: "A password in a <code>char[]</code> can be <b>wiped</b> after use. A String stays in memory, unchangeable, until garbage collected.",
  r: ["Wipe with <code>Arrays.fill(pw, '\\0')</code> when done.", "Strings may also end up in logs and heap dumps.", "<code>Console.readPassword()</code> returns a <code>char[]</code> for this reason."],
  q: ["Why is char[] preferred for passwords?", ["It is faster to compare", "You can overwrite it after use", "It is encrypted automatically", "It uses less memory"], 1, "You control its lifetime: clear it as soon as it is checked."],
  p: [{ t: "After the check, wipe the password array with <code>java.util.Arrays.fill</code> using <code>'*'</code>, so the secret is gone.",
    c: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        char[] pw = "s3cret!!".toCharArray();
        boolean ok = Arrays.equals(pw, new char[]{'s','3','c','r','e','t','!','!'});
        // TODO: wipe pw
        System.out.println(ok + " " + new String(pw));
    }
}`,
    s: `import java.util.Arrays;

class Main {
    public static void main(String[] args) {
        char[] pw = "s3cret!!".toCharArray();
        boolean ok = Arrays.equals(pw, new char[]{'s','3','c','r','e','t','!','!'});
        Arrays.fill(pw, '*');
        System.out.println(ok + " " + new String(pw));
    }
}`, o: "true ********" }] },
q16: { e: "🔄", k: "Reverse with <b>two pointers</b>: swap the outer characters of a <code>char[]</code> and walk inwards until they meet.",
  r: ["O(n) time, O(n) space for the char array.", "Loop while <code>i &lt; j</code>; the middle char stays put.", "<code>new StringBuilder(s).reverse()</code> is the one-liner."],
  q: ["How many swaps does the two-pointer reverse do for a 7-letter word?", ["7", "6", "3", "4"], 2, "It swaps pairs until the pointers meet: floor(7 / 2) = 3."],
  p: [{ t: "Reverse <b>each word</b> but keep the word order: <code>\"Java is fun\"</code> → <code>\"avaJ si nuf\"</code>.",
    c: `class Main {
    static String reverseEach(String s) {
        // TODO: split into words, reverse each, join with spaces
        return s;
    }
    public static void main(String[] args) {
        System.out.println(reverseEach("Java is fun"));
    }
}`,
    s: `class Main {
    static String reverseEach(String s) {
        String[] words = s.split(" ");
        StringBuilder out = new StringBuilder();
        for (String w : words) {
            if (out.length() > 0) out.append(' ');
            for (int i = w.length() - 1; i >= 0; i--) out.append(w.charAt(i));
        }
        return out.toString();
    }
    public static void main(String[] args) {
        System.out.println(reverseEach("Java is fun"));
    }
}`, o: "avaJ si nuf" }] },
q17: { e: "🪞", k: "A palindrome reads the same both ways. Compare <code>s[i]</code> with <code>s[n-1-i]</code> from both ends; stop at the first mismatch.",
  r: ["Only n/2 comparisons are needed.", "Decide first: ignore case? ignore spaces and punctuation?", "<code>Character.isLetterOrDigit</code> helps skip punctuation."],
  q: ["Is \"Racecar\" a palindrome with a case-sensitive check?", ["Yes", "No: 'R' ≠ 'r'", "Only on Java 21", "It throws"], 1, "'R' and 'r' are different chars, so a case-sensitive check says false."],
  p: [{ t: "Make <code>isPal</code> ignore case and anything that isn't a letter or digit.",
    c: `class Main {
    static boolean isPal(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            // TODO: skip non letters/digits, compare ignoring case
            if (s.charAt(i) != s.charAt(j)) return false;
            i++; j--;
        }
        return true;
    }
    public static void main(String[] args) {
        System.out.println(isPal("A man, a plan, a canal: Panama") + " " + isPal("race a car"));
    }
}`,
    s: `class Main {
    static boolean isPal(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            char a = s.charAt(i), b = s.charAt(j);
            if (!Character.isLetterOrDigit(a)) { i++; continue; }
            if (!Character.isLetterOrDigit(b)) { j--; continue; }
            if (Character.toLowerCase(a) != Character.toLowerCase(b)) return false;
            i++; j--;
        }
        return true;
    }
    public static void main(String[] args) {
        System.out.println(isPal("A man, a plan, a canal: Panama") + " " + isPal("race a car"));
    }
}`, o: "true false" }] },
q18: { e: "🔤", k: "Two words are anagrams when every letter appears the <b>same number of times</b>. Count with an <code>int[26]</code>: +1 for one word, −1 for the other.",
  r: ["Different lengths? Not anagrams; stop early.", "Counting is O(n); sorting both is O(n log n).", "The same counting trick finds duplicates and first unique characters."],
  q: ["After counting \"rat\" (+1) and \"car\" (−1), which counts are non-zero?", ["None", "t and c", "r and a", "All of them"], 1, "r and a cancel out; t is +1 and c is −1, so they are not anagrams."],
  p: [{ t: "Write <code>isAnagram</code> with an <code>int[26]</code> counter (lower-case letters only).",
    c: `class Main {
    static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] count = new int[26];
        // TODO: count up for a, down for b, then check all zero
        return false;
    }
    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent") + " " + isAnagram("rat", "car"));
    }
}`,
    s: `class Main {
    static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < a.length(); i++) {
            count[a.charAt(i) - 'a']++;
            count[b.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent") + " " + isAnagram("rat", "car"));
    }
}`, o: "true false" },
  { t: "Use the same counting idea to find the <b>first character that appears only once</b>.",
    c: `class Main {
    static char firstUnique(String s) {
        int[] count = new int[26];
        // TODO: first pass counts, second pass finds the first count == 1
        return '_';
    }
    public static void main(String[] args) {
        System.out.println(firstUnique("swiss"));
    }
}`,
    s: `class Main {
    static char firstUnique(String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        for (char c : s.toCharArray()) if (count[c - 'a'] == 1) return c;
        return '_';
    }
    public static void main(String[] args) {
        System.out.println(firstUnique("swiss"));
    }
}`, o: "w" }] },
quiz: { e: "🎯", k: "Predict first, then click. Every wrong guess shows you which memory rule you missed." },
quick: { e: "⚡", k: "Short answers to the follow-up questions interviewers like to add at the end." }
  }
};
