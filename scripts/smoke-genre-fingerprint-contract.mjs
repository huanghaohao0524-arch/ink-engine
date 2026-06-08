import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const hardGateStart = main.indexOf('function extractBookScopedGenreSignals')
const hardGateEnd = main.indexOf('function buildGenreRequirement', hardGateStart)
const hardGateBlock = hardGateStart >= 0 && hardGateEnd > hardGateStart
  ? main.slice(hardGateStart, hardGateEnd)
  : ''

const checks = [
  ['contract builder exists', main.includes('function buildGenreFingerprintContract')],
  ['assist profile builder exists', main.includes('function buildGenreFingerprintAssistProfile')],
  ['contract reads sample pool fingerprints', main.includes('context.samplePoolFingerprints')],
  ['contract extracts rhythm lines', main.includes('平均章节长度') && main.includes('对白段落占比')],
  ['contract extracts signal lines', main.includes('推进反馈密度') && main.includes('必保留信号')],
  ['contract extracts anti-ai lines', main.includes('去 AI 味')],
  ['contract is assistive, not hard gate', main.includes('题材指纹辅助层') && main.includes('不作为硬门禁') && main.includes('不要求逐条命中')],
  ['stable context includes contract', main.includes('buildGenreFingerprintContract(context)')],
  ['execution contract includes contract', main.includes('const fingerprintContract = buildGenreFingerprintContract(context)') && main.includes('fingerprintContract,')],
  ['outline prompt includes assistive rule', main.includes('题材指纹是辅助参考') && main.includes('不把样本标签当硬门禁')],
  ['sample fingerprints do not affect hard genre gate', !hardGateBlock.includes('context.samplePoolFingerprints') && !hardGateBlock.includes('context.humanWritingFingerprint')],
  ['package exposes smoke script', pkg.scripts?.['smoke:genre-fingerprint-contract'] === 'node scripts/smoke-genre-fingerprint-contract.mjs'],
  ['core smoke includes contract smoke', pkg.scripts?.['smoke:core']?.includes('smoke:genre-fingerprint-contract')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Genre fingerprint contract smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Genre fingerprint contract smoke passed')
