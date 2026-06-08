import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const script = await fs.readFile(path.join(root, 'scripts', 'bulk-collect-from-curated-candidates.mjs'), 'utf8')
  const checks = [
    ['bulk collector exists', script.includes('latest-bulk-collection-report.json')],
    ['bulk collector can skip refresh during per-genre collection', script.includes('--skip-refresh')],
    ['bulk collector rewrites one temp booklist per genre', script.includes('bulk-booklist.txt')],
    ['bulk collector rebuilds fingerprints at end', script.includes('analyze-sample-fingerprints-cli.mjs')],
    ['bulk collector rebuilds growth report at end', script.includes('build-fingerprint-growth-report.mjs')],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:bulk-collection')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
