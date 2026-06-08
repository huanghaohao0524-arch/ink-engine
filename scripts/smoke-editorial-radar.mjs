import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['radar item type exists', app.includes('interface EditorialRadarItem') && app.includes("status: 'ok' | 'watch' | 'risk' | 'idle'")],
  ['radar builder exists', app.includes('function buildEditorialRadar')],
  ['radar covers core writing checks', ['题材味', '主角主动性', '收益反馈', '主线推进', '章末承接', '记忆同步'].every((label) => app.includes(label))],
  ['radar reads candidate gates', app.includes('stateGateWarnings') && app.includes('qualityGateWarnings') && app.includes('nextChapterReadiness')],
  ['assistant renders radar panel', app.includes('editorialRadar') && app.includes('editorial-radar-grid') && app.includes('editorial-radar-item')],
  ['styles for radar exist', styles.includes('.editorial-radar-grid') && styles.includes('.editorial-radar-item')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-radar'] === 'node scripts/smoke-editorial-radar.mjs'],
  ['core smoke includes radar smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-radar')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(`Editorial radar smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial radar smoke passed')
