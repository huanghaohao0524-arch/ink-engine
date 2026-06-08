import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const pipelineStart = main.indexOf('async function runChapterWritingDirectorPipeline')
const pipelineEnd = main.indexOf('async function startNextChapterFlow', pipelineStart)
const pipelineFn = pipelineStart >= 0 && pipelineEnd > pipelineStart ? main.slice(pipelineStart, pipelineEnd) : ''

const failures = []

const requiredNeedles = [
  'function buildLocalChapterPlanBundle',
  'function shouldUseLocalChapterPlanBundle',
  'context.chapterOutline',
  "source: 'existing-chapter-outline'",
  "recordWritingTaskRunStep(detail.book.path, taskRun, 'chapter-strategy', 'success'",
  "recordWritingTaskRunStep(detail.book.path, taskRun, 'task-card', 'success'",
]

for (const needle of requiredNeedles) {
  if (!main.includes(needle)) {
    failures.push(`missing local chapter plan fast path piece: ${needle}`)
  }
}

if (!pipelineFn.includes('shouldUseLocalChapterPlanBundle({ context, speedMode })')) {
  failures.push('chapter director should select local plan bundle in guarded/reckless mode when chapter outline exists')
}

if (!pipelineFn.includes('buildLocalChapterPlanBundle({')) {
  failures.push('chapter director should build strategy/task card locally from existing outline')
}

if (!pipelineFn.includes('callOpenAiText({') || !pipelineFn.includes('buildChapterPlanBundlePrompt({')) {
  failures.push('polish/no-outline path should keep AI plan bundle fallback')
}

if (pkg.scripts?.['smoke:next-chapter-fast-plan'] !== 'node scripts/smoke-next-chapter-fast-plan.mjs') {
  failures.push('package exposes smoke:next-chapter-fast-plan')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Next chapter fast plan smoke passed')
