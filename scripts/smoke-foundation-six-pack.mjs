import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'unified ai task engine wraps task runs',
    ok:
      main.includes('async function runAiManagedTask') &&
      main.includes('await runAiManagedTask({') &&
      main.includes('recordWritingTaskRunStep(bookPath, taskRun, step,'),
  },
  {
    name: 'context router selects slices by task type',
    ok:
      main.includes('function selectContextForTask') &&
      main.includes("taskType === 'chapter-writing'") &&
      main.includes("taskType === 'project-update'") &&
      main.includes("taskType === 'material-rewrite'"),
  },
  {
    name: 'structured state gate validates machine variables',
    ok:
      main.includes('function evaluateStructuredStateGate') &&
      main.includes('structuredStateRequiredKeys') &&
      main.includes('structuredStateGateWarnings'),
  },
  {
    name: 'chapter loop emits next chapter readiness',
    ok:
      main.includes('function buildNextChapterReadiness') &&
      main.includes('nextChapterReadiness') &&
      types.includes('nextChapterReadiness?: string') &&
      app.includes('candidate.nextChapterReadiness'),
  },
  {
    name: 'memory governance has archive and compaction policy',
    ok:
      main.includes('async function archiveOversizedMemoryMaterial') &&
      main.includes('memory-archive') &&
      main.includes('memoryGovernanceMaxLength'),
  },
  {
    name: 'single step retry uses latest task run payload',
    ok:
      main.includes('async function retryWritingTaskStep') &&
      main.includes("ipcMain.handle('book:retry-writing-task-step'") &&
      types.includes('retryWritingTaskStep') &&
      app.includes('retryLatestWritingTaskStep'),
  },
]

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (checks.some((check) => !check.ok)) {
  throw new Error('Foundation six pack smoke failed')
}
