# Learn Visually

Animated, interactive programming tutorials in one tabbed site:

| Tab | Folder | What it covers |
| --- | --- | --- |
| Java Strings | `tutorials/java-strings/` | 18 `java.lang.String` interview questions with memory diagrams and a quiz |
| Java Arrays | `tutorials/java-arrays/` | 16 Java array questions with heap diagrams and algorithm tracers |
| Python | `tutorials/python/` | Python from beginner to advanced, with step-through animations, a cheat sheet and runnable code |
| JavaScript | `tutorials/javascript/` | JavaScript from first `console.log` to promises, the event loop and the DOM, with runnable console and page examples and 6 step-by-step projects (tip splitter, to-do list, quiz, expense tracker, weather app, memory game) |
| TypeScript | `tutorials/typescript/` | TypeScript from basic types to generics, mapped and conditional types, type-checked in the browser by the real compiler, with 6 step-by-step projects (grade book, bank, typed store, inventory, form validator, Pomodoro timer) |
| MCP | `tutorials/mcp/` | Model Context Protocol: architecture, an animated end-to-end flow (plus an MP4), building and connecting a server |
| Playwright | `tutorials/playwright/` | Playwright Test with TypeScript: runner, config, browsers and projects, locators and flaky locators, assertions, debugging, CI, plus a searchable CLI reference |

No build step and no dependencies: it is plain HTML, CSS and JavaScript.

## Run it locally

Open `index.html` in a browser, or (recommended, so every feature works) serve the folder:

```bash
cd learn-visually
python3 -m http.server 8000
# then open http://localhost:8000
```

In VS Code you can also use the **Live Server** extension and click “Go Live”.

## Project structure

```
learn-visually/
├── index.html              # the tab shell
├── assets/
│   ├── tutorials.js        # ← the list of tabs (add/rename/reorder tabs here)
│   ├── shell.css           # styles for the top bar and tabs
│   ├── shell.js            # tab switching, URL hash, theme switcher
│   ├── palettes.css        # Sepia / Ocean / Forest color themes
│   ├── theme.css           # ← YOUR global style overrides (loaded last everywhere)
│   ├── embed.js            # lets the shell set each page's theme
│   ├── course.js/.css      # course mode: one lesson per screen, progress, practice, quick checks
│   ├── java-runner.js/.css # Edit/Run boxes for the Java examples
│   ├── jsts.js/.css        # runner + shared layout for the JavaScript and TypeScript tabs
│   └── ask.js/.css         # the "Ask a question" window on every tutorial page
└── tutorials/
    ├── java-strings/  index.html · style.css · script.js · course-data.js
    ├── java-arrays/   index.html · style.css · script.js · course-data.js
    ├── python/        index.html · style.css · script.js · course-data.js
    ├── javascript/    index.html · style.css · script.js · course-data.js
    ├── typescript/    index.html · style.css · script.js · course-data.js
    └── mcp/           index.html · style.css · script.js · mcp-end-to-end.mp4 · poster.jpg
```

Each tutorial also works on its own: open `tutorials/python/index.html` directly.

## Change the content

- **Text and code examples**: edit the tutorial's `index.html`. Lessons are `<section>` blocks; code examples are `<pre class="code">` blocks. In the Python page, add `data-run` to a `<pre class="code">` to give it a **Run** button. In the Java pages, a runnable example is `<pre class="jrun" data-title="…">` holding a full program with a non-public `class Main`; it gets **Edit**, **Reset** and **Run** buttons (`assets/java-runner.js`). In the JavaScript and TypeScript pages, `<pre class="code" data-run>` runs console code and `<pre class="code" data-run="page">` runs a small HTML page (markup, `<style>`, `<script>`) in a live preview (`assets/jsts.js`). Inside code, write `<` as `&lt;` and `&` as `&amp;`.
- **Animations and widgets**: edit the tutorial's `script.js`. In the Python page each widget is a function in the `W` object (for example `W.slicer`), mounted by `<div class="widget" data-w="slicer"></div>`.
- **Lesson notes and practice** (Java Strings, Java Arrays, Python, JavaScript, TypeScript): edit the tutorial's `course-data.js`. Each lesson id has an emoji `e`, a key idea `k`, three Remember points `r`, a quick check `q: [question, [options], answerIndex, why]` and practice exercises `p: [{ t: task, c: starter code, s: solution, o: expected output }]`. `assets/course.js` turns the page into one lesson per screen with a lesson menu, ← → keys and saved progress.
- **Tabs**: edit `assets/tutorials.js`. Each entry has an `id` (used in the URL, e.g. `index.html#python`), a `label`, a `note`, the page `path` and a tab `color`.

### Add a new tutorial tab

1. Copy a folder, e.g. `tutorials/python` → `tutorials/rust`, and replace its content.
2. Keep these lines in its `<head>` so the theme switcher works:
   ```html
   <link rel="stylesheet" href="../../assets/palettes.css">
   <link rel="stylesheet" href="../../assets/theme.css">
   <script src="../../assets/embed.js"></script>
   ```
3. Add an entry to `assets/tutorials.js`.

## Change the style

- **Color themes**: the top bar has Auto / Light / Dark plus three color swatches (Sepia, Ocean, Forest). Edit or add palettes in `assets/palettes.css`; a new one also needs a swatch button in `index.html` and its name added to the `sepia|ocean|forest` checks in `assets/shell.js` and `assets/embed.js`.
- **Quick, site-wide**: uncomment and edit the examples in `assets/theme.css`.
- **One page**: edit the `:root { ... }` block at the top of that tutorial's `style.css`. Colors, fonts and spacing are CSS variables, so changing a token updates the whole page. The light palette is in `:root`, the dark palette in the two blocks right below it.
- **The tab bar**: `assets/shell.css` (tab colors are `--t1` … `--t7`).

## Put it on GitHub

```bash
cd learn-visually
git init
git add .
git commit -m "Initial commit: Learn Visually tutorials"
git branch -M main
git remote add origin https://github.com/<your-username>/learn-visually.git
git push -u origin main
```

### Publish it as a website (GitHub Pages)

The site is plain static files, so GitHub Pages can serve it straight from the branch. After pushing:

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**, then `main` and `/ (root)`.
3. Every push to `main` then republishes the site at
   `https://<your-username>.github.io/learn-visually/` within a minute or two.

The empty `.nojekyll` file tells Pages to serve the files as they are, without running Jekyll.

## Re-record the MCP video

The MCP flow animation is drawn by `tutorials/mcp/script.js` (see `SCENES`). Open
`tutorials/mcp/index.html?film` to get just the 1280×720 stage; `window.__flow.renderAt(seconds)`
draws any frame, which is how `mcp-end-to-end.mp4` was recorded (Playwright screenshots piped into ffmpeg at 30 fps).
After editing scenes, either re-record or remove the `<video>` block from the page.

## Ask a question (AI help)

Every tutorial page has an **💬 Ask** button (bottom right). It opens a chat window where you can ask about the lesson on screen; select some text or code first to ask about exactly that. Answers come from Claude (model `claude-opus-5-5`) through the official Anthropic SDK, loaded from jsDelivr on the first question.

The site has no server, so each person uses **their own Anthropic API key**: create one at [console.anthropic.com](https://console.anthropic.com/settings/keys), press **Key** in the window and paste it. The key is stored only in that browser's `localStorage` and sent only to `api.anthropic.com`; questions are billed to that account (usually a few cents each). Remove it with **Key → Remove saved key**, and don't save a key on a shared computer. Conversations are kept per page in `localStorage`; **New** starts over.

To change the model, the tutor's instructions or the CDN version, edit the constants and `systemPrompt()` at the top of `assets/ask.js`. A new tutorial page gets the window by adding `<link rel="stylesheet" href="../../assets/ask.css">` and `<script src="../../assets/ask.js" defer></script>`.

## Notes

- The Python page's **Run** buttons load [Pyodide](https://pyodide.org) (CPython in WebAssembly, about 10 MB) from the jsDelivr CDN the first time you press Run, so they need an internet connection.
- The Java pages' **Run** buttons send the example's code to a free online compiler, [Compiler Explorer](https://godbolt.org) (JDK 21), falling back to [Wandbox](https://wandbox.org), and show its output, so they also need an internet connection.
- The JavaScript page runs console examples in a Web Worker (stopped after 8 seconds) and page examples in a sandboxed frame, all offline except the examples that call public APIs.
- The TypeScript page loads the TypeScript compiler (about 1.6 MB, from jsDelivr) on the first Run, type-checks each example in strict mode, then compiles and runs it like the JavaScript page. The **JS** button shows the compiled output.
- Fonts come from Google Fonts; without internet the pages fall back to system fonts.
- Lesson progress and the chosen theme are saved in the browser's `localStorage`.
