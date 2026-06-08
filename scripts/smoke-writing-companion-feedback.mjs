import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['route includes companion decision schema', main.includes('companionDecision') && main.includes('understoodProblem') && main.includes('applyAdvice')],
  ['route normalizes companion decision', main.includes('function normalizeCompanionDecision') && main.includes('normalizeCompanionDecision(route.companionDecision')],
  ['companion decision drives project repair feedback', main.includes('smartFeedbackRoute.companionDecision?.impactScope')],
  ['type exposes companion decision', types.includes('interface CompanionDecision') && types.includes('companionDecision?: CompanionDecision')],
  ['candidate carries companion decision', app.includes('companionDecision?: CompanionDecision') && app.includes('companionDecision: generated.smartFeedbackRoute.companionDecision')],
  ['candidate panel shows companion card', app.includes('className="companion-decision-card"') && app.includes('搭档判断')],
  ['project update smart feedback can show companion card', app.includes("candidate.kind === 'chapter-feedback' || candidate.kind === 'project-update'")],
  ['package exposes smoke', pkg.scripts?.['smoke:writing-companion-feedback'] === 'node scripts/smoke-writing-companion-feedback.mjs'],
  ['core includes smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-companion-feedback')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Writing companion feedback smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Writing companion feedback smoke passed.')
