import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const journeys = [
  {
    name: 'new book planning path',
    checks: [
      app.includes('startPlanning'),
      app.includes('submitPlanningAnswer'),
      app.includes('generateProjectPackage'),
      app.includes('createBook'),
      preload.includes('planning:next-question'),
      preload.includes('planning:generate-project-package'),
      main.includes("ipcMain.handle('planning:next-question'"),
      main.includes("ipcMain.handle('planning:generate-project-package'"),
    ],
  },
  {
    name: 'polish next chapter path',
    checks: [
      app.includes('runUserPrimaryWriteAction'),
      app.includes('finishChapterAndStartNext'),
      app.includes('buildUserResultJudgement'),
      app.includes('applyCandidate'),
      main.includes('async function startNextChapterFlow'),
      main.includes('async function applyGeneratedWritingDraft'),
      preload.includes('startNextChapterFlow'),
      types.includes('startNextChapterFlow:'),
    ],
  },
  {
    name: 'human feedback repair path',
    checks: [
      app.includes('assistant-feedback-card'),
      app.includes('generateSmartFeedbackPackage'),
      app.includes('generateProjectRepairPackage'),
      main.includes('async function generateChapterFeedbackPackage'),
      main.includes('async function generateProjectRepairPackage'),
      preload.includes('generateChapterFeedbackPackage'),
      preload.includes('generateProjectRepairPackage'),
    ],
  },
  {
    name: 'guarded batch writing path',
    checks: [
      app.includes("writingSpeedMode === 'guarded'"),
      app.includes("setWritingSpeedMode('guarded')"),
      main.includes("mode === 'guarded'"),
      main.includes('flow.draft.directorStatus === \'needs-review\''),
      main.includes('break'),
      preload.includes('startBatchWritingFlow'),
    ],
  },
  {
    name: 'reckless batch writing path',
    checks: [
      app.includes("writingSpeedMode === 'reckless'"),
      app.includes("setWritingSpeedMode('reckless')"),
      main.includes("mode === 'reckless'"),
      main.includes('mode === \'reckless\' ? 50 : 12'),
      main.includes('results.push({'),
      types.includes("mode: 'guarded' | 'reckless'"),
    ],
  },
  {
    name: 'debug and cost path',
    checks: [
      app.includes('assistant-debug-tools'),
      app.includes('aiCostSummary'),
      app.includes('latestWritingTaskRun'),
      app.includes('loadAiCallLogs'),
      main.includes('function recordAiCallLog'),
      main.includes('totalDurationMs'),
      preload.includes('getAiCallLogs'),
      types.includes('interface AiCallLog'),
    ],
  },
]

const failures = journeys.flatMap((journey) => journey.checks.every(Boolean) ? [] : [journey.name])

if (pkg.scripts?.['smoke:user-journeys'] !== 'node scripts/smoke-user-journeys.mjs') {
  failures.push('package script smoke:user-journeys')
}

const smokeCore = pkg.scripts?.['smoke:core'] ?? ''
const requiredSmokeSteps = [
  'smoke:user-journeys',
  'smoke:user-writing-panel',
  'smoke:next-chapter-flow',
  'smoke:batch-writing',
  'smoke:writing-task-engine-ui',
  'smoke:natural-prose',
  'smoke:chapter-progress-gate',
  'smoke:writing-candidate-persistence',
  'smoke:smart-feedback-routing',
  'smoke:book-digestion',
  'smoke:authorized-sources',
  'smoke:sample-pool',
  'smoke:sample-fingerprint-cli',
  'smoke:bundled-fingerprints',
  'smoke:genre-fingerprint-contract',
  'smoke:sample-pipeline',
  'smoke:genre-orchestrator',
  'smoke:growth-report',
  'smoke:discovery-engine',
  'smoke:candidate-curation',
  'smoke:word-policy',
]

if (!requiredSmokeSteps.every((step) => smokeCore.includes(step))) {
  failures.push('package script smoke:core')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('User journeys smoke passed')
