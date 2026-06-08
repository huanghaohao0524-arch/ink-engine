import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const runtime = readFileSync('public/legacy-runtime.js', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['copilot status type exists', app.includes("type CompanionActionIntent") && app.includes('interface CompanionCopilotStatus')],
  ['copilot builder exists', app.includes('function buildCompanionCopilotStatus')],
  ['copilot handles user feedback first', app.includes("intent: 'handle-feedback'") && app.includes('feedback.trim()')],
  ['main action routes feedback to smart package', app.includes('async function runUserPrimaryWriteAction') && app.includes('await generateSmartFeedbackPackage()')],
  ['main action applies existing candidate', app.includes("candidate.kind !== 'setup'") && app.includes('await applyCandidate()')],
  ['handled feedback releases primary action', app.includes('setChapterFeedback(\'\')') && app.includes('setBatchWritingResult(null)')],
  ['legacy runtime clears handled feedback', runtime.includes('At(null),Gt(""),gt(s.candidateReady)') && runtime.includes('at(null),At(null),Gt(""),N(null)')],
  ['copilot detects foundation repair', app.includes("intent: 'fix-foundation'") && app.includes('detail.contextCheck.level !==')],
  ['copilot drives main button label', app.includes('companionCopilot.label') && app.includes('assistant-main-action')],
  ['copilot card is visible', app.includes('className={`companion-copilot-status ${companionCopilot.intent}`}') && app.includes('搭档判断')],
  ['copilot styles exist', styles.includes('.companion-copilot-status') && styles.includes('.companion-copilot-status.handle-feedback')],
  ['package exposes smoke', pkg.scripts?.['smoke:writing-companion-copilot'] === 'node scripts/smoke-writing-companion-copilot.mjs'],
  ['core includes smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-companion-copilot')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Writing companion copilot smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Writing companion copilot smoke passed.')
