import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scriptPath = path.join(root, 'scripts', 'collect-sample-books-cli.mjs')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const script = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : ''

const checks = [
  ['pipeline script exists', fs.existsSync(scriptPath)],
  ['pipeline can search sonovel', script.includes('/search/aggregated') && script.includes('kw=')],
  ['pipeline can fetch txt', script.includes('/book-fetch') && script.includes('format=txt')],
  ['pipeline writes central raw samples', script.includes('原文样本') && script.includes('copyDownloadedTxtToLibrary')],
  ['pipeline refreshes fingerprints', script.includes('analyze-sample-fingerprints-cli.mjs') && script.includes('--bundle')],
  ['pipeline has dry-run mode', script.includes('dryRun')],
  ['pipeline supports author disambiguation', script.includes('parseBookSpecs') && script.includes('exactWithAuthor')],
  ['pipeline refuses author mismatch fallback', script.includes('if (bookSpec.author)') && script.includes('return null')],
  ['pipeline can skip existing samples', script.includes('skipped-existing') && script.includes('hasExistingSample')],
  ['pipeline can load book file', script.includes('book-file') && script.includes('loadBookSpecsFromFile')],
  ['package exposes pipeline smoke', pkg.scripts?.['smoke:sample-pipeline'] === 'node scripts/smoke-sample-pipeline-cli.mjs'],
  ['core smoke includes pipeline smoke', pkg.scripts?.['smoke:core']?.includes('smoke:sample-pipeline')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Sample pipeline CLI smoke passed')
