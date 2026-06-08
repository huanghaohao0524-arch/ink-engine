import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const main = fs.readFileSync(path.join(root, 'electron', 'main.mjs'), 'utf8')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const bundledRoot = path.join(root, 'build', 'writing-fingerprints')
const genreDir = path.join(bundledRoot, '题材指纹')
const genreIndex = path.join(bundledRoot, 'genre-index.json')
const webGameFingerprint = path.join(genreDir, '网游.md')

const checks = [
  ['bundled fingerprint directory exists', fs.existsSync(genreDir)],
  ['bundled genre index exists', fs.existsSync(genreIndex)],
  ['bundled web game fingerprint exists', fs.existsSync(webGameFingerprint)],
  ['bundled fingerprint keeps source boundary', fs.readFileSync(webGameFingerprint, 'utf8').includes('不保存原文章节')],
  ['main can read bundled fingerprints', main.includes('readBundledGenreFingerprints') && main.includes('build/writing-fingerprints')],
  ['book fingerprint is override not default storage', main.includes('readBookGenreFingerprints') && main.includes('书籍自定义题材指纹优先')],
  ['packaging includes build resources', Array.isArray(pkg.build?.files) && pkg.build.files.includes('build/**/*')],
  ['package exposes bundled smoke', pkg.scripts?.['smoke:bundled-fingerprints'] === 'node scripts/smoke-bundled-fingerprints.mjs'],
  ['core smoke includes bundled smoke', pkg.scripts?.['smoke:core']?.includes('smoke:bundled-fingerprints')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Bundled fingerprints smoke passed')
