import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['editorial action text builder exists', app.includes('function buildEditorialFeedbackDraft')],
  ['editorial actions fill feedback box', app.includes('useEditorialFeedbackDraft') && app.includes('setChapterFeedback(buildEditorialFeedbackDraft(editorialJudgement))')],
  ['editorial actions can immediately run smart feedback', app.includes('runEditorialFeedbackDraft') && app.includes('void generateSmartFeedbackPackage(nextFeedback)')],
  ['smart feedback accepts override text', app.includes('async function generateSmartFeedbackPackage(feedbackOverride?: string)') && app.includes('const feedbackText = feedbackOverride?.trim() || chapterFeedback.trim()')],
  ['assistant renders editorial actions', app.includes('editorial-action-row') && app.includes('采用主编建议') && app.includes('按建议重写')],
  ['styles for editorial actions exist', styles.includes('.editorial-action-row')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-action-layer'] === 'node scripts/smoke-editorial-action-layer.mjs'],
  ['core smoke includes action smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-action-layer')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(`Editorial action layer smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial action layer smoke passed')
