import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const scriptPath = path.join(root, 'scripts', 'collect-all-sample-fingerprints-cli.mjs')
  const manifestPath = path.join(root, 'build', 'writing-fingerprints', 'genre-collection-manifest.json')
  const script = await fs.readFile(scriptPath, 'utf8')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))

  const checks = [
    ['orchestrator script exists', script.includes('collect-sample-books-cli.mjs')],
    ['orchestrator supports manifest', script.includes('--manifest') && script.includes('readManifest')],
    ['orchestrator supports genre filter', script.includes('--genres') && script.includes('selectedGenres')],
    ['orchestrator supports per-genre timeouts', script.includes('searchTimeoutMs') && script.includes('fetchTimeoutMs')],
    ['orchestrator summarizes runs', script.includes('summarizeCollected') && script.includes('fingerprintOverview')],
    ['manifest includes genres array', Array.isArray(manifest?.genres)],
    ['manifest has at least one enabled genre', Array.isArray(manifest?.genres) && manifest.genres.some((item) => item.enabled !== false)],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:genre-orchestrator')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
