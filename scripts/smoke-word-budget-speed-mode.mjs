import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const start = main.indexOf('async function enforceChapterWordBudget')
const end = main.indexOf('\nfunction getPlatformProfile', start)
const fn = start >= 0 && end > start ? main.slice(start, end) : ''
const pipelineStart = main.indexOf('async function runChapterWritingDirectorPipeline')
const pipelineEnd = main.indexOf('async function generateAiEditCandidate', pipelineStart)
const pipeline = pipelineStart >= 0 && pipelineEnd > pipelineStart ? main.slice(pipelineStart, pipelineEnd) : ''

const failures = []

if (!fn.includes("speedMode = 'guarded'")) {
  failures.push('enforceChapterWordBudget must default speedMode for non-director callers')
}

if (!fn.includes('normalizeWritingSpeedMode(speedMode)')) {
  failures.push('enforceChapterWordBudget must normalize speedMode before choosing reasoning effort')
}

const directorBudgetCalls = (pipeline.match(/enforceChapterWordBudget\(\{[\s\S]*?\n\s*\}\)/g) || [])
if (directorBudgetCalls.length < 4) {
  failures.push(`expected director budget calls, found ${directorBudgetCalls.length}`)
}

const missingSpeedMode = directorBudgetCalls.filter((call) => !call.includes('speedMode'))
if (missingSpeedMode.length) {
  failures.push(`director enforceChapterWordBudget calls missing speedMode: ${missingSpeedMode.length}`)
}

if (pkg.scripts?.['smoke:word-budget-speed-mode'] !== 'node scripts/smoke-word-budget-speed-mode.mjs') {
  failures.push('package exposes smoke:word-budget-speed-mode')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Word budget speed mode smoke passed')
