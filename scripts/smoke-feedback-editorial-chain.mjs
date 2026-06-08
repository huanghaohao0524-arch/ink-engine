import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['feedback package runs natural prose calibration', main.includes('feedbackNaturalProseDetail') && main.includes('calibrateNaturalProse({')],
  ['feedback package runs editorial final pass', main.includes('feedbackEditorialFinalPass') && main.includes('evaluateEditorialFinalPass({')],
  ['feedback package can repair final pass', main.includes('feedback-editorial-final-pass-repair') && main.includes('buildEditorialFinalPassRevisionPrompt({')],
  ['feedback package re-syncs after repair', main.includes('feedbackFinalSync') && main.includes('syncFinalDraftState({')],
  ['feedback warnings include final pass warnings', main.includes('feedbackEditorialFinalPassWarnings')],
  ['feedback detail exposes editor chain', main.includes('feedbackDirectorDetail') && main.includes('## 反馈改稿主编链路')],
  ['package exposes smoke script', pkg.scripts?.['smoke:feedback-editorial-chain'] === 'node scripts/smoke-feedback-editorial-chain.mjs'],
  ['core smoke includes feedback editorial chain', pkg.scripts?.['smoke:core']?.includes('smoke:feedback-editorial-chain')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Feedback editorial chain smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Feedback editorial chain smoke passed')
