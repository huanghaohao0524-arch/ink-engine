import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const loaderBlock = main.slice(main.indexOf('async function readRelevantSampleFingerprints'), main.indexOf('async function readProjectContext'))

const checks = [
  ['sample pool constants exist', main.includes('sampleFingerprintLibrary')],
  ['sample pool grouping exists', main.includes('function groupSamplePoolFiles') && main.includes('platform') && main.includes('genre')],
  ['sample pool analyzer exists', main.includes('async function analyzeSamplePoolFingerprints')],
  ['fingerprint files output by platform genre', main.includes('buildSamplePoolFingerprintFileName') && main.includes('platform-genre-index.json')],
  ['sample pool stores fingerprints not source text', main.includes('只输出指纹库') && main.includes('不把原文带入生成上下文')],
  ['project fingerprint loader exists', main.includes('readRelevantSampleFingerprints') && main.includes('sampleFingerprintLibrary')],
  ['project fingerprint loader accepts genre index', main.includes("genre-index.json") && main.includes('index?.genres')],
  ['project fingerprint loader is not platform gated', loaderBlock.includes('readBookGenreFingerprints(bookPath, preferredGenres)') && !loaderBlock.includes('platform')],
  ['project fingerprint loader can fallback to bundled genre fingerprints', main.includes('readBundledGenreFingerprints') && main.includes('getBundledFingerprintRoot')],
  ['stable context includes sample pool fingerprints', main.includes('## 样本池指纹库') && main.includes('context.samplePoolFingerprints')],
  ['ipc handler exists', main.includes("ipcMain.handle('book:analyze-sample-pool-fingerprints'")],
  ['preload exposes sample pool api', preload.includes('analyzeSamplePoolFingerprints')],
  ['types expose sample pool api', types.includes('SamplePoolFingerprintResult') && types.includes('analyzeSamplePoolFingerprints:')],
  ['package exposes smoke script', pkg.scripts?.['smoke:sample-pool'] === 'node scripts/smoke-sample-pool-fingerprints.mjs'],
  ['core smoke includes sample pool', pkg.scripts?.['smoke:core']?.includes('smoke:sample-pool')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Sample pool fingerprints smoke passed')
