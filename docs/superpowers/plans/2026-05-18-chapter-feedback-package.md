# Chapter Feedback Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one clear chapter feedback flow where the user can say why a chapter is wrong, receive a rewritten chapter plus long-term memory patches, and apply everything in one action.

**Architecture:** Add a new backend IPC `book:generate-chapter-feedback-package` that reads the current chapter and project context, asks AI to produce a rewritten chapter and scoped patches, then returns a candidate. Reuse the existing `applyWritingCandidate` persistence path so chapter text, story state, chapter progress, chapter memory, structured state, future plan, and style patches are saved together.

**Tech Stack:** Electron main IPC, React renderer, TypeScript ambient types, existing smoke scripts, existing AI call helpers.

---

### Task 1: Contract Smoke

**Files:**
- Create: `scripts/smoke-chapter-feedback-package.mjs`

- [ ] **Step 1: Write the failing smoke**

Check that preload exposes the new IPC, the backend has prompt/generator functions, the frontend has `chapter-feedback` candidate handling, and applying the candidate uses replace mode plus long-term patches.

- [ ] **Step 2: Run smoke to verify failure**

Run: `node scripts\smoke-chapter-feedback-package.mjs`
Expected: failures for missing contract.

### Task 2: Backend Generator

**Files:**
- Modify: `electron/main.mjs`
- Modify: `electron/preload.mjs`
- Modify: `electron/preload.cjs`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Add generated package types**

Add `GeneratedChapterFeedbackPackage` with `title`, `content`, `feedbackSummary`, `impactSummary`, and the same patch fields as writing candidates.

- [ ] **Step 2: Add prompt builder**

Create `buildChapterFeedbackPackagePrompt({ instruction, book, selectedChapter, context, currentContent })`. It must require:
- rewritten full chapter only in `## 本章重写稿`
- long-term decisions in `## 长期记忆更新`
- impact explanation in `## 影响范围`
- final sync sections compatible with existing parsers: `章节后状态更新`, `章节推进更新`, `章节记忆更新`, `结构化状态更新`, `未来章节规划更新`, `风格校准更新`

- [ ] **Step 3: Add generator**

Create `generateChapterFeedbackPackage(input)` that validates chapter and feedback, saves unsaved current content passed from frontend into the prompt, calls `callOpenAiText`, parses sections, and returns a package.

- [ ] **Step 4: Expose IPC**

Add preload methods and `ipcMain.handle('book:generate-chapter-feedback-package', ...)`.

### Task 3: Frontend Flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add state and copy**

Add `chapterFeedback`, `isFeedbackBoxOpen`, `chapterFeedbackPackage` text labels, and candidate kind `chapter-feedback`.

- [ ] **Step 2: Add UI entry**

Add a visible AI panel block: button `这章不行，反馈重写`, textarea for the user's feedback, and a generate button. Keep it compact and collapsible.

- [ ] **Step 3: Generate candidate**

Add `generateChapterFeedbackPackage()` that sends book path, selected chapter file, current editor text, and feedback. Store the response as candidate kind `chapter-feedback`.

- [ ] **Step 4: Apply candidate**

Extend `applyCandidate` so `chapter-feedback` replaces the target chapter and sends all long-term patches through `applyWritingCandidate`.

- [ ] **Step 5: Candidate display**

Show feedback summary and impact summary above the rewritten text so the user sees whether the change is local or long-term.

### Task 4: Verification And Package

**Files:**
- Existing scripts and build output.

- [ ] **Step 1: Run targeted smoke**

Run: `node scripts\smoke-chapter-feedback-package.mjs`

- [ ] **Step 2: Run existing foundation checks**

Run:
- `node scripts\smoke-source-contracts.mjs`
- `node scripts\smoke-writing-foundation-95.mjs`
- `node scripts\smoke-chapter-quality-chain.mjs`

- [ ] **Step 3: Build and package**

Run:
- `npm run lint`
- `npm run build`
- `npm run dist:win`

- [ ] **Step 4: Copy portable exe to desktop**

Copy `release\AI Writing Workbench 0.1.0.exe` to `C:\Users\damon\Desktop\AI Writing Workbench 0.1.0.exe`.
