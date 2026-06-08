import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['unified patch persistence exists', main.includes('async function persistWritingCandidatePatches')],
  ['state patch is governed', main.includes("appendGovernedSection(bookPath, `${names.tracking}/story-state.md`")],
  ['progress patch is governed', main.includes("appendGovernedSection(bookPath, `${names.tracking}/chapter-progress.md`")],
  ['memory patch is governed', main.includes("appendGovernedSection(bookPath, `${names.tracking}/chapter-memory.md`")],
  ['structured state merge is centralized', main.includes('await mergeStructuredStatePatch(bookPath, draft.structuredPatch)')],
  ['future plan patch is governed', main.includes("appendGovernedSection(bookPath, `${names.tracking}/future-plan.md`")],
  ['style patch is governed', main.includes("appendGovernedSection(bookPath, `${names.settings}/style-sample.md`")],
  ['memory governance patch is governed', main.includes("appendGovernedSection(bookPath, `${names.tracking}/memory-index.md`")],
  ['application sync report is persisted', main.includes("`${names.tracking}/writing-sync-report.md`") && main.includes('buildWritingSyncReport')],
  ['batch draft persistence uses unified helper', main.includes('persistWritingCandidatePatches({') && main.includes("sourceLabel: '批量生成应用'")],
  ['single candidate persistence uses unified helper', main.includes("sourceLabel: '候选应用'")],
  ['package exposes smoke script', pkg.scripts?.['smoke:writing-candidate-persistence'] === 'node scripts/smoke-writing-candidate-persistence.mjs'],
  ['core smoke includes persistence smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-candidate-persistence')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Writing candidate persistence smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Writing candidate persistence smoke passed')
