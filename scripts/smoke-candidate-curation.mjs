import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const script = await fs.readFile(path.join(root, 'scripts', 'curate-discovered-book-candidates.mjs'), 'utf8')
  const checks = [
    ['curation script exists', script.includes('curated-book-candidates.json')],
    ['curation script writes curated booklists', script.includes('booklists/curated')],
    ['curation script has genre rules', script.includes('buildGenreRules')],
    ['curation script rejects noisy candidates', script.includes('titleExclude') && script.includes('category-excluded')],
    ['curation script scores candidates', script.includes('scoreByRegex') && script.includes('minScore')],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:candidate-curation')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
