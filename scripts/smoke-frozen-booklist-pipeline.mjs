import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const freezeScript = await fs.readFile(path.join(root, 'scripts', 'freeze-genre-booklists.mjs'), 'utf8')
  const downloadScript = await fs.readFile(path.join(root, 'scripts', 'download-from-frozen-booklists.mjs'), 'utf8')
  const analyzeScript = await fs.readFile(path.join(root, 'scripts', 'analyze-local-sample-library.mjs'), 'utf8')

  const checks = [
    ['freeze script writes frozen manifest', freezeScript.includes('frozen-booklists-manifest.json')],
    ['freeze script writes frozen txt files', freezeScript.includes('frozen.txt')],
    ['download script reads frozen manifest', downloadScript.includes('frozen-booklists-manifest.json')],
    ['download script delegates to collect-sample-books-cli', downloadScript.includes('collect-sample-books-cli.mjs')],
    ['download script skips refresh during download phase', downloadScript.includes('--skip-refresh')],
    ['analyze script rebuilds sample fingerprints', analyzeScript.includes('analyze-sample-fingerprints-cli.mjs')],
    ['analyze script rebuilds growth report', analyzeScript.includes('build-fingerprint-growth-report.mjs')],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:frozen-booklist-pipeline')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
