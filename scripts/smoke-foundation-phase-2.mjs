import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = fs.readFileSync('electron/preload.cjs', 'utf8')

const checks = [
  {
    name: 'task engine persists recoverable task run snapshots',
    ok:
      main.includes('async function createWritingTaskRun') &&
      main.includes('async function persistWritingTaskRun') &&
      main.includes('async function recordWritingTaskRunStep') &&
      main.includes('task-runs') &&
      main.includes('partialContent') &&
      main.includes('recoverable'),
  },
  {
    name: 'context compiler centralizes chapter context slices',
    ok:
      main.includes('function compileChapterWritingContext') &&
      main.includes('contextBudget') &&
      main.includes('compiledContext') &&
      main.includes('buildChapterStableContext({ book, context: compiledContext })'),
  },
  {
    name: 'memory compaction task exists and is exposed',
    ok:
      main.includes('function buildMemoryCompactionPrompt') &&
      main.includes('async function compactProjectMemory') &&
      main.includes("ipcMain.handle('book:compact-project-memory'") &&
      preload.includes("compactProjectMemory: (input) => ipcRenderer.invoke('book:compact-project-memory', input)") &&
      preloadCjs.includes("compactProjectMemory: (input) => ipcRenderer.invoke('book:compact-project-memory', input)") &&
      types.includes('compactProjectMemory'),
  },
  {
    name: 'frontend has one main chapter workflow decision entry',
    ok:
      app.includes('function buildPrimaryWorkflowDecision') &&
      app.includes('async function runPrimaryWorkflowAction') &&
      app.includes('primaryWorkflowDecision.label') &&
      app.includes('advanced-ai-tools'),
  },
  {
    name: 'memory compaction can be triggered from frontend',
    ok:
      app.includes('compactProjectMemory') &&
      app.includes('整理长期记忆') &&
      app.includes('memoryCompaction'),
  },
]

const failed = checks.filter((check) => !check.ok)

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
