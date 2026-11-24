# Learn Visually

Animated, interactive programming tutorials in one tabbed static site. Plain HTML, CSS and JavaScript: **no build step, no package manager, no dependencies.** Do not add a bundler, framework, npm or TypeScript.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

`.claude/launch.json` has this as the `site` preview config. Serve over HTTP rather than opening `file://`, so the iframes, `postMessage` theming and code runners all work. There are no automated tests; verify changes in the browser (both light and dark theme, and at phone width).

## Architecture

- `index.html` + `assets/shell.{js,css}`: the tab shell. Tabs are built from `window.TUTORIALS` in `assets/tutorials.js`; each tutorial is lazy-loaded into its own `<iframe>`. The URL hash is the tab `id` (`index.html#python`).
- `tutorials/<name>/`: each tutorial is a standalone page (`index.html`, `style.css`, `script.js`) that also works when opened directly.
- Theme: the shell sends `{type: "lv-theme", theme}` to each iframe; `assets/embed.js` (loaded in every tutorial `<head>`) applies it as `data-theme` (`light`/`dark`) plus `data-palette` (`sepia`/`ocean`/`forest`, defined in `assets/palettes.css`). Saved in `localStorage` key `lv-theme`.
- `assets/theme.css` is the user's global override file, loaded **last** everywhere. Keep it as commented-out examples; don't put real styles there.

### Course mode (Java Strings, Java Arrays, Python)

`assets/course.{js,css}` turns a long page into one lesson per screen with progress, a lesson menu, Remember boxes, practice and a quick check. Each page defines `window.COURSE` in its `course-data.js` (the header comment in `assets/course.js` documents the shape: `key`, `title`, `lang`, `parts`, `tag()`, `data`). Lesson ids in `data` must match the `id` of the `[data-lesson]` sections that `tag()` marks.

Script order matters:
- Java pages: `script.js` → `course-data.js` → `../../assets/course.js` → `../../assets/java-runner.js`
- Python page: `course-data.js` → `../../assets/course.js` → `script.js` (which holds the Pyodide runner)

MCP and Playwright tabs do **not** use course mode; they have their own `script.js`.

### Runnable code

- Java: `<pre class="jrun" data-title="…">` holding a full program with a non-public `class Main`. `assets/java-runner.js` adds Edit/Reset/Run and runs it on Compiler Explorer (godbolt.org, JDK 21), falling back to Wandbox.
- Python: `<pre class="code" data-run>` gets a Run button; Pyodide loads from jsDelivr on first run.
- Inside HTML code blocks escape `<` as `&lt;` and `&` as `&amp;`. In `course-data.js`, Python code uses `String.raw` (`R\`...\``) so backslashes survive.

## Conventions

- `.editorconfig`: UTF-8, LF, 2-space indent, final newline. (The user's git has `core.autocrlf` on; the CRLF warnings on commit are harmless.)
- Style each page with CSS variables in the `:root` block at the top of its `style.css`; light palette in `:root`, dark palette in the blocks right below. Use tokens, not hard-coded colors.
- Match the existing JS style: IIFE-wrapped, `"use strict"`, small helpers (`$`, `$$`, `esc`, `store`), `localStorage` access always in `try/catch`.
- Every tutorial `<head>` must include `../../assets/palettes.css`, then `../../assets/theme.css`, then `<script src="../../assets/embed.js">`.
- Fonts come from Google Fonts only; no other external CSS/JS beyond the runners above.

## Adding a tutorial tab

1. Create `tutorials/<name>/` with `index.html`, `style.css`, `script.js` (copy an existing one and keep the `<head>` includes above).
2. Add an entry to `assets/tutorials.js` (`id`, `label`, `note`, `path`, `color`; tab colors are `--t1`…`--t5` in `assets/shell.css`, add a new token there if needed).
3. Update the tab table in `README.md`.

## Publishing

Repo: `praveenkr244/learn-visually` (public). GitHub Pages serves the `main` branch as-is (`.nojekyll`), so anything merged to `main` goes live. `gh` is installed at `~/.local/bin/gh` (may not be on PATH).
