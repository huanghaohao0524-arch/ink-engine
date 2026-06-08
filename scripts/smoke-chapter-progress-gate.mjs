import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['progress gate exists', main.includes('function evaluateChapterProgressGate')],
  ['progress gate checks major story axes', main.includes('章节推进不足') && main.includes('主线、阻碍、爽点、信息差、伏笔、关系')],
  ['progress gate checks next chapter handoff', main.includes('下一章承接不足') && main.includes('nextRequiredMove')],
  ['progress gate checks open loops', main.includes('开放问题不足') && main.includes('openLoops')],
  ['progress gate checks web game continuity', main.includes('网游状态不足') && main.includes('网游后果不足')],
  ['director evaluates progress gate', main.includes('progressGate = evaluateChapterProgressGate')],
  ['director records progress gate step', main.includes("recordWritingTaskStep(taskTrace, 'progress-gate'")],
  ['progress gate can trigger repair', main.includes('!stateGate.passed || !executionGate.passed || !progressGate.passed')],
  ['progress gate affects director status', main.includes('if (!progressGate.passed)') && main.includes("directorStatus = 'needs-review'")],
  ['feedback rewrite uses progress gate', (main.includes('const progressGate = evaluateChapterProgressGate') || main.includes('let progressGate = evaluateChapterProgressGate')) && main.includes('feedbackFuturePlanPatch')],
  ['package exposes smoke script', pkg.scripts?.['smoke:chapter-progress-gate'] === 'node scripts/smoke-chapter-progress-gate.mjs'],
  ['core smoke includes progress gate smoke', pkg.scripts?.['smoke:core']?.includes('smoke:chapter-progress-gate')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Chapter progress gate smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Chapter progress gate smoke passed')
