# Next Chapter Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "start next chapter" run the chapter preparation chain automatically: save, create chapter, generate/apply chapter outline, then generate a draft candidate.

**Architecture:** Keep the existing Electron APIs and compose them in the React app as a guarded workflow. The outline is auto-applied to the new chapter's outline file, while the正文 draft remains a candidate for user confirmation.

**Tech Stack:** React, TypeScript, Electron IPC, existing smoke scripts.

---

### Task 1: Frontend Workflow Orchestration

**Files:**
- Modify: `src/App.tsx`

- [ ] Add a small typed progress state for the next-chapter pipeline.
- [ ] Replace the old save-and-create-only handler with a sequential workflow:
  save current chapter, create next chapter, generate chapter outline, apply outline, generate draft candidate.
- [ ] Keep正文 candidate anchored to the generated chapter.
- [ ] Preserve manual generation as advanced tools.

### Task 2: UI Progress Feedback

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] Render a compact progress card in the AI panel while the next-chapter pipeline is active.
- [ ] Show step states: pending, running, done, failed.
- [ ] Keep stop button behavior through the active request id.

### Task 3: Regression Smoke Test

**Files:**
- Create: `scripts/smoke-next-chapter-flow.mjs`
- Modify: `package.json`

- [ ] Verify the frontend contains the dedicated workflow function.
- [ ] Verify it calls create chapter, generate outline, apply candidate, and generate draft in order.
- [ ] Verify UI renders next-chapter pipeline progress.

### Task 4: Verification and Packaging

**Commands:**
- `npm run smoke:next-chapter-flow`
- `npm run lint`
- `npm run build`
- `npm run dist:win`

- [ ] Copy `release/墨引擎 0.1.0.exe` to the desktop if the existing exe is not locked.
