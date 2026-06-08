import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const script = await fs.readFile(path.join(root, 'scripts', 'discover-genre-book-candidates.mjs'), 'utf8')
  const checks = [
    ['discovery script exists', script.includes('search/aggregated')],
    ['discovery script reads growth plan', script.includes('genre-growth-plan.json')],
    ['discovery script outputs candidates', script.includes('discovered-book-candidates.json')],
    ['discovery script filters relevance', script.includes('isLikelyRelevant')],
    ['discovery script deduplicates', script.includes('isDuplicateCandidate')],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:discovery-engine')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
