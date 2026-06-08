import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'task trace helpers exist',
    ok:
      main.includes('function createWritingTaskTrace') &&
      main.includes('function recordWritingTaskStep') &&
      main.includes('function formatWritingTaskTrace') &&
      main.includes('const taskTrace = createWritingTaskTrace'),
  },
  {
    name: 'memory governance material exists and is read into context',
    ok:
      main.includes('function buildMemoryGovernanceSeed') &&
      main.includes('async function readMemoryGovernanceMaterial') &&
      main.includes('memory-index.md') &&
      main.includes('context.memoryGovernance') &&
      main.includes('appendGovernedSection'),
  },
  {
    name: 'final sync and feedback emit memory governance patch',
    ok:
      main.includes('## 记忆治理更新') &&
      main.includes("parseSyncSection(finalSync, '记忆治理更新')") &&
      main.includes("parseSyncSection(content, '记忆治理更新')"),
  },
  {
    name: 'chapter state and execution gates with repair pass exist',
    ok:
      main.includes('function evaluateChapterStateGate') &&
      main.includes('function evaluateChapterExecutionGate') &&
      main.includes('function buildChapterStateGateRevisionPrompt') &&
      main.includes('stateGate = evaluateChapterStateGate') &&
      main.includes('execution-gate-repair'),
  },
  {
    name: 'candidate and apply types carry memory governance and state gate fields',
    ok:
      types.includes('memoryGovernancePatch?: string') &&
      types.includes('stateGateWarnings?: string[]') &&
      app.includes('memoryGovernancePatch: candidate.memoryGovernancePatch') &&
      app.includes('stateGateWarnings: generated.stateGateWarnings'),
  },
  {
    name: 'director detail surfaces task trace and state gate',
    ok:
      main.includes('## 任务轨迹') &&
      main.includes('## 状态门禁') &&
      app.includes('candidate.stateGateWarnings'),
  },
]

const failed = checks.filter((check) => !check.ok)

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
