import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['reader simulation output limit exists', main.includes('readerSimulation: 800')],
  ['reader simulation prompt exists', main.includes('function buildReaderSimulationPrompt')],
  ['reader simulation evaluator exists', main.includes('function evaluateReaderSimulation')],
  ['pipeline records reader simulation', main.includes("'reader-simulation'")],
  ['reader simulation uses reader desire dimensions', main.includes('翻页欲') && main.includes('弃读风险') && main.includes('读者本章获得')],
  ['reader simulation affects quality warnings', main.includes('readerSimulationWarnings') && main.includes('qualityWarnings: [...executionGate.warnings, ...editorialFinalPassWarnings, ...readerSimulationWarnings]')],
  ['director detail shows reader simulation', main.includes('readerSimulationDetail') && main.includes('## 读者试读模拟')],
  ['package exposes smoke script', pkg.scripts?.['smoke:reader-simulation'] === 'node scripts/smoke-reader-simulation.mjs'],
  ['core smoke includes reader simulation', pkg.scripts?.['smoke:core']?.includes('smoke:reader-simulation')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Reader simulation smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Reader simulation smoke passed')
