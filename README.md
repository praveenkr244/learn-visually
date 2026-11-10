# Learn Visually

Animated, interactive programming tutorials in one tabbed site:

| Tab | Folder | What it covers |
| --- | --- | --- |
| Java Strings | `tutorials/java-strings/` | 18 `java.lang.String` interview questions with memory diagrams and a quiz |
| Java Arrays | `tutorials/java-arrays/` | 16 Java array questions with heap diagrams and algorithm tracers |
| Python | `tutorials/python/` | Python from beginner to advanced, with step-through animations, a cheat sheet and runnable code |

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
│   ├── shell.js            # tab switching, URL hash, light/dark theme
│   ├── theme.css           # ← YOUR global style overrides (loaded last everywhere)
│   └── embed.js            # lets the shell set each page's theme
└── tutorials/
    ├── java-strings/  index.html · style.css · script.js
    ├── java-arrays/   index.html · style.css · script.js
    └── python/        index.html · style.css · script.js
```

Each tutorial also works on its own: open `tutorials/python/index.html` directly.

## Change the content

- **Text and code examples**: edit the tutorial's `index.html`. Lessons are `<section>` blocks; code examples are `<pre class="code">` blocks. In the Python page, add `data-run` to a `<pre class="code">` to give it a **Run** button. Inside code, write `<` as `&lt;` and `&` as `&amp;`.
- **Animations and widgets**: edit the tutorial's `script.js`. In the Python page each widget is a function in the `W` object (for example `W.slicer`), mounted by `<div class="widget" data-w="slicer"></div>`.
- **Tabs**: edit `assets/tutorials.js`. Each entry has an `id` (used in the URL, e.g. `index.html#python`), a `label`, a `note`, the page `path` and a tab `color`.

### Add a new tutorial tab

1. Copy a folder, e.g. `tutorials/python` → `tutorials/javascript`, and replace its content.
2. Keep these lines in its `<head>` so the theme switcher works:
   ```html
   <link rel="stylesheet" href="../../assets/theme.css">
   <script src="../../assets/embed.js"></script>
   ```
3. Add an entry to `assets/tutorials.js`.

## Change the style

- **Quick, site-wide**: uncomment and edit the examples in `assets/theme.css`.
- **One page**: edit the `:root { ... }` block at the top of that tutorial's `style.css`. Colors, fonts and spacing are CSS variables, so changing a token updates the whole page. The light palette is in `:root`, the dark palette in the two blocks right below it.
- **The tab bar**: `assets/shell.css` (tab colors are `--t1`, `--t2`, `--t3`).

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

This repo includes `.github/workflows/pages.yml`. After pushing:

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. The next push (or **Actions → Deploy to GitHub Pages → Run workflow**) publishes the site at
   `https://<your-username>.github.io/learn-visually/`.

## Notes

- The Python page's **Run** buttons load [Pyodide](https://pyodide.org) (CPython in WebAssembly, about 10 MB) from the jsDelivr CDN the first time you press Run, so they need an internet connection.
- Fonts come from Google Fonts; without internet the pages fall back to system fonts.
- Lesson progress and the chosen theme are saved in the browser's `localStorage`.
