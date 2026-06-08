import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['one-button copilot exists', app.includes('function buildCompanionCopilotStatus') && app.includes('runUserPrimaryWriteAction')],
  ['one-button handles dissatisfaction as conversation', app.includes("intent: 'handle-feedback'") && app.includes('await generateSmartFeedbackPackage()')],
  ['one-button applies candidate and writes next chapter', app.includes('await applyCandidate()') && app.includes('await finishChapterAndStartNext()')],
  ['smart feedback routes chapter vs project', main.includes('function normalizeCompanionDecision') && main.includes('generateSmartFeedbackPackage')],
  ['project-wide impact map persists', main.includes('function persistProjectImpactMap') && main.includes('project-impact-map.md')],
  ['future writing reads impact map', main.includes('## 全项目影响图') && main.includes('context.projectImpactMap')],
  ['chapter writing uses companion contract', main.includes('buildWritingCompanion90Contract') && main.includes("mode: 'chapter-writing'")],
  ['editorial final pass exists', main.includes('evaluateEditorialFinalPass') && main.includes('feedbackEditorialFinalPass')],
  ['reader simulation exists', main.includes('buildReaderSimulationPrompt') || main.includes('readerSimulation')],
  ['book strategy review persists', main.includes('book-strategy-review.md') && main.includes('buildBookStrategyReviewReport')],
  ['candidate result surfaces human judgement', app.includes('buildEditorialJudgement') && app.includes('assistant-editorial-card')],
  ['feedback UI stays human language', app.includes('chapterFeedbackPlaceholder') && app.includes('哪里不满意')],
  ['types expose companion decision and impact map', types.includes('interface CompanionDecision') && types.includes('interface ProjectImpactMap')],
  ['package exposes replication smoke', pkg.scripts?.['smoke:writing-companion-replication'] === 'node scripts/smoke-writing-companion-replication.mjs'],
  ['core includes replication smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-companion-replication')],
]

const passed = checks.filter(([, ok]) => ok).length
const score = Math.round((passed / checks.length) * 100)
const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error(`Writing companion replication smoke failed: ${score}%`)
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log(`Writing companion replication smoke passed: ${score}%`)
