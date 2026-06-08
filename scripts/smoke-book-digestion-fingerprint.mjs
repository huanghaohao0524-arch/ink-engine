import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['sample library paths exist', main.includes('sampleLibrary') && main.includes('humanWritingFingerprint')],
  ['local analyzer exists', main.includes('function analyzeHumanWritingSamples') && main.includes('function buildHumanWritingFingerprintMarkdown')],
  ['analyzer stores abstract fingerprints not source text', main.includes('不保存原文') && main.includes('只沉淀统计规律')],
  ['style sample seed mentions book digestion', main.includes('拆书样本指纹') && main.includes('人写感统计')],
  ['stable context includes human fingerprint', main.includes('## 拆书样本指纹') && main.includes('context.humanWritingFingerprint')],
  ['natural prose calibration uses fingerprint', main.includes('人写感指纹') && main.includes('样本统计只作为规律')],
  ['project context reads fingerprint material', main.includes('readHumanWritingFingerprintMaterial') && main.includes('human-writing-fingerprint.md')],
  ['ipc handler exists', main.includes("ipcMain.handle('book:analyze-writing-samples'")],
  ['preload exposes analyzer', preload.includes('analyzeWritingSamples')],
  ['types expose analyzer', types.includes('analyzeWritingSamples:')],
  ['package exposes smoke script', pkg.scripts?.['smoke:book-digestion'] === 'node scripts/smoke-book-digestion-fingerprint.mjs'],
  ['core smoke includes book digestion', pkg.scripts?.['smoke:core']?.includes('smoke:book-digestion')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Book digestion fingerprint smoke passed')
