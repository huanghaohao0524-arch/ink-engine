import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['editorial final pass evaluator exists', main.includes('function evaluateEditorialFinalPass')],
  ['editorial final pass repair prompt exists', main.includes('function buildEditorialFinalPassRevisionPrompt')],
  ['final pass reads editorial review index', main.includes('context.editorialReview') && main.includes('主编审稿记录')],
  ['pipeline records editorial final pass step', main.includes("'editorial-final-pass'")],
  ['pipeline can auto repair after final pass', main.includes("'editorial-final-pass-repair'") && main.includes('buildEditorialFinalPassRevisionPrompt({')],
  ['final pass affects director status', main.includes('editorialFinalPass.passed') && main.includes('editorialFinalPassWarnings')],
  ['director detail shows final pass', main.includes('editorialFinalPassDetail') && main.includes('## 主编终审')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-final-pass'] === 'node scripts/smoke-editorial-final-pass.mjs'],
  ['core smoke includes final pass', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-final-pass')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Editorial final pass smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial final pass smoke passed')
