import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['editorial judgement type exists', app.includes('interface EditorialJudgement') && app.includes("level: 'apply' | 'review' | 'reject' | 'idle'")],
  ['editorial judgement builder exists', app.includes('function buildEditorialJudgement')],
  ['judgement uses gates and director status', app.includes("directorStatus === 'needs-review'") && app.includes('stateGateWarnings') && app.includes('qualityGateWarnings')],
  ['judgement produces why and next action', app.includes('why:') && app.includes('nextAction:') && app.includes('reasons:')],
  ['assistant renders judgement levels', app.includes('editorialJudgement') && app.includes('assistant-editorial-card') && app.includes('editorial-reason-list')],
  ['old plain result judgement is no longer primary', !app.includes('const resultJudgement = buildUserResultJudgement')],
  ['styles for editorial judgement exist', styles.includes('.assistant-editorial-card') && styles.includes('.editorial-reason-list')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-judgement-layer'] === 'node scripts/smoke-editorial-judgement-layer.mjs'],
  ['core smoke includes judgement smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-judgement-layer')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(`Editorial judgement layer smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial judgement layer smoke passed')
