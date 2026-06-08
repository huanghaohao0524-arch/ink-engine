import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const failures = []

const extractStart = main.indexOf('function extractBookScopedGenreSignals')
const extractEnd = main.indexOf('function buildGenreRequirement', extractStart)
const extractBlock = extractStart >= 0 && extractEnd > extractStart
  ? main.slice(extractStart, extractEnd)
  : ''

const contractStart = main.indexOf('function buildGenreFingerprintContract')
const contractEnd = main.indexOf('function stripNegatedGenreLines', contractStart)
const contractBlock = contractStart >= 0 && contractEnd > contractStart
  ? main.slice(contractStart, contractEnd)
  : ''

const outlineStart = main.indexOf('function buildOutlinePrompt')
const outlineEnd = main.indexOf('function buildProjectProfilePrompt', outlineStart)
const outlineBlock = outlineStart >= 0 && outlineEnd > outlineStart
  ? main.slice(outlineStart, outlineEnd)
  : ''

if (!main.includes('function buildGenreFingerprintAssistProfile')) {
  failures.push('missing assistive genre fingerprint profile builder')
}

if (!contractBlock.includes('buildGenreFingerprintAssistProfile')) {
  failures.push('genre fingerprint contract should be assembled from assistive profile')
}

if (extractBlock.includes('samplePoolFingerprints') || extractBlock.includes('humanWritingFingerprint')) {
  failures.push('hard book-scoped gate must not read sample/human fingerprints')
}

if (!contractBlock.includes('题材指纹辅助层')) {
  failures.push('fingerprint prompt should present itself as an assistive layer')
}

if (!contractBlock.includes('不作为硬门禁') || !contractBlock.includes('不要求逐条命中')) {
  failures.push('fingerprint prompt should explicitly say fingerprints are not hard gates')
}

if (/题材指纹合同/.test(contractBlock) || /必须兑现这里的题材信号与人写感约束/.test(contractBlock)) {
  failures.push('fingerprint prompt still uses hard-contract language')
}

if (/题材指纹合同是硬约束/.test(outlineBlock)) {
  failures.push('outline prompt still treats fingerprint contract as a hard constraint')
}

if (pkg.scripts?.['smoke:genre-fingerprint-assistive-layer'] !== 'node scripts/smoke-genre-fingerprint-assistive-layer.mjs') {
  failures.push('package exposes smoke:genre-fingerprint-assistive-layer')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:genre-fingerprint-assistive-layer')) {
  failures.push('core smoke includes assistive layer smoke')
}

if (failures.length) {
  console.error(`Genre fingerprint assistive layer smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Genre fingerprint assistive layer smoke passed')
