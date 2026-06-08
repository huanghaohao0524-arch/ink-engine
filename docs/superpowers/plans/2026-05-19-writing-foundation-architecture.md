# Writing Foundation Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the writing foundation from prompt-only constraints into a task-traced, memory-governed, state-gated chapter pipeline.

**Architecture:** Keep the current Electron main process as the orchestration layer, but add three explicit foundation units inside it: writing task traces, governed memory append/seed/read helpers, and deterministic chapter state gates with one automatic repair pass. The renderer only needs to carry the new memory/state fields in candidates and show them inside the existing candidate detail area.

**Tech Stack:** Electron main IPC, React renderer, TypeScript ambient types, static smoke tests, existing AI call helpers.

---

### Task 1: Foundation Contract Smoke

**Files:**
- Create: `scripts/smoke-foundation-architecture.mjs`

- [ ] **Step 1: Write the failing smoke**

Check for:
- `createWritingTaskTrace`, `recordWritingTaskStep`, and `formatWritingTaskTrace`
- `buildMemoryGovernanceSeed`, `readMemoryGovernanceMaterial`, `memory-index.md`, `appendGovernedSection`
- final sync and feedback prompts emitting `记忆治理更新`
- candidate/apply types carrying `memoryGovernancePatch`
- `evaluateChapterStateGate`, `buildChapterStateGateRevisionPrompt`, and director auto repair after state gate failure

- [ ] **Step 2: Run smoke to verify failure**

Run: `node scripts\smoke-foundation-architecture.mjs`
Expected: failures for missing architecture pieces.

### Task 2: Memory Governance Layer

**Files:**
- Modify: `electron/main.mjs`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add memory seed/read helpers**

Add `buildMemoryGovernanceSeed({ title })`, create `追踪/memory-index.md` for new/organized projects, expose it in project material definitions, and include it in `readProjectContext`.

- [ ] **Step 2: Add governed append**

Add `appendGovernedSection(bookPath, relativeFile, title, content, maxLength)` that appends a dated section but prunes old tail-heavy content once the file exceeds a bounded size.

- [ ] **Step 3: Persist memory governance patches**

Add `memoryGovernancePatch` to generated writing candidates and apply inputs, parse `## 记忆治理更新`, and append it to `追踪/memory-index.md`.

### Task 3: Chapter State Gate

**Files:**
- Modify: `electron/main.mjs`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add deterministic gate**

Add `evaluateChapterStateGate({ context, content, statePatch, progressPatch })`. It must check generic chapter progression and, for web-game projects, visible game signals.

- [ ] **Step 2: Add gate repair prompt**

Add `buildChapterStateGateRevisionPrompt(...)` that rewrites the candidate when deterministic checks fail.

- [ ] **Step 3: Wire one auto repair pass**

After final sync, evaluate the gate. If it fails, run one targeted repair, sync again, and re-evaluate. Preserve warnings if it still fails.

### Task 4: Task Trace Layer

**Files:**
- Modify: `electron/main.mjs`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add task trace helpers**

Create a trace object with ordered steps, status, duration, and detail strings.

- [ ] **Step 2: Record chapter director phases**

Record task card, draft, self-check, self-check repair, final sync, state gate, and state-gate repair phases.

- [ ] **Step 3: Surface trace in director detail**

Include the formatted task trace in candidate detail so failures show what completed and what was skipped.

### Task 5: Verification And Package

**Files:**
- Existing scripts and build output.

- [ ] **Step 1: Run new and existing smokes**

Run:
- `node scripts\smoke-foundation-architecture.mjs`
- `node scripts\smoke-writing-foundation-95.mjs`
- `node scripts\smoke-chapter-quality-chain.mjs`
- `node scripts\smoke-chapter-feedback-package.mjs`
- `node scripts\smoke-source-contracts.mjs`

- [ ] **Step 2: Build and package**

Run:
- `npm run lint`
- `npm run build`
- `npm run dist:win`

- [ ] **Step 3: Copy portable exe to desktop**

Copy `release\AI Writing Workbench 0.1.0.exe` to `C:\Users\damon\Desktop\AI Writing Workbench 0.1.0.exe`.
