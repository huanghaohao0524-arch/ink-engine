import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const main = fs.readFileSync('electron/main.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['apply input carries editorial judgement', types.includes('editorialJudgement?: EditorialJudgement')],
  ['apply input carries editorial radar', types.includes('editorialRadar?: EditorialRadarItem[]')],
  ['frontend snapshots editorial review on apply', app.includes('const appliedEditorialJudgement = buildEditorialJudgement(candidate, batchWritingResult)') && app.includes('editorialJudgement: appliedEditorialJudgement')],
  ['frontend snapshots editorial radar on apply', app.includes('const appliedEditorialRadar = buildEditorialRadar(candidate, appliedEditorialJudgement)') && app.includes('editorialRadar: appliedEditorialRadar')],
  ['frontend snapshots editorial focus actions on apply', app.includes('const appliedEditorialFocusActions = buildEditorialFocusActions(appliedEditorialRadar, appliedEditorialJudgement)') && app.includes('editorialFocusActions: appliedEditorialFocusActions')],
  ['backend builds editorial review report', main.includes('function buildEditorialReviewReport') && main.includes('draft?.editorialJudgement')],
  ['backend persists editorial review file', main.includes('editorial-review.md') && main.includes('buildEditorialReviewReport({ sourceLabel, chapterFile, mode, draft })')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-review-persistence'] === 'node scripts/smoke-editorial-review-persistence.mjs'],
  ['core smoke includes editorial review persistence', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-review-persistence')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Editorial review persistence smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial review persistence smoke passed')
