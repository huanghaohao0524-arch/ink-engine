# Bookshelf Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a reversible bookshelf-style home screen on top of the current working runtime.

**Architecture:** Add a small DOM enhancement layer loaded after the legacy runtime. It observes the dashboard, wraps the book grid with a fixed genre rail, filters visible cards, and applies a more book-library visual system through CSS.

**Tech Stack:** Electron, Vite, React legacy bundle, vanilla DOM enhancement, CSS.

---

### Task 1: Bookshelf Enhancer

**Files:**
- Create: `public/bookshelf-enhancer.js`
- Modify: `index.html`

- [ ] Add a browser-only enhancer that detects `.books-section`, adds `.bookshelf-home`, creates a `.genre-rail`, and filters `.book-card` nodes.
- [ ] Store custom genre order and active genre in `localStorage`.
- [ ] Keep original book actions intact by only hiding and showing existing cards.

### Task 2: Bookshelf Styling

**Files:**
- Create: `public/bookshelf-enhancer.css`
- Modify: `index.html`

- [ ] Add restrained product styling for the bookshelf layout.
- [ ] Hide platform rows inside cards on the dashboard.
- [ ] Restyle book cards as quiet information tiles.
- [ ] Preserve hover, focus, empty, and responsive states.

### Task 3: Verification

**Files:**
- Read: `dist/index.html`
- Run: `npm run build`

- [ ] Build the app.
- [ ] Verify the generated dist includes `bookshelf-enhancer.js` and `bookshelf-enhancer.css`.
- [ ] Start preview and confirm the page serves the enhancer files.
