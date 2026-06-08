import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['readback checker exists', main.includes('async function buildWritingApplyReadbackCheck')],
  ['readback formatter exists', main.includes('function formatWritingApplyReadbackCheck')],
  ['patch persistence returns readback check', main.includes('const applyReadbackCheck = await buildWritingApplyReadbackCheck') && main.includes('return applyReadbackCheck')],
  ['single candidate response exposes readback check', main.includes('applyReadbackCheck') && main.includes('return { ...detail, applyReadbackCheck }')],
  ['batch generated draft captures readback check', main.includes('const applyReadbackCheck = await persistWritingCandidatePatches') && main.includes('readbackOk: applyReadbackCheck.ok')],
  ['types define readback check', types.includes('interface WritingApplyReadbackCheck') && types.includes('interface WritingApplyReadbackItem')],
  ['apply writing candidate returns readback detail', types.includes('Promise<BookDetail & { applyReadbackCheck?: WritingApplyReadbackCheck }>')],
  ['frontend stores latest readback check', app.includes('latestApplyReadbackCheck') && app.includes('setLatestApplyReadbackCheck')],
  ['frontend shows readback summary and modal entry', app.includes('apply-readback-compact') && app.includes('readback-modal') && app.includes('latestApplyReadbackCheck.summary')],
  ['package exposes smoke script', pkg.scripts?.['smoke:writing-apply-readback'] === 'node scripts/smoke-writing-apply-readback.mjs'],
  ['core smoke includes readback smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-apply-readback')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Writing apply readback smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Writing apply readback smoke passed')
