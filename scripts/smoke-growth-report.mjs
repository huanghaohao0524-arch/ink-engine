import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

async function main() {
  const script = await fs.readFile(path.join(root, 'scripts', 'build-fingerprint-growth-report.mjs'), 'utf8')
  const plan = JSON.parse(await fs.readFile(path.join(root, 'build', 'writing-fingerprints', 'genre-growth-plan.json'), 'utf8'))

  const checks = [
    ['growth report script exists', script.includes('latest-growth-report.json')],
    ['growth report reads plan', script.includes('genre-growth-plan.json')],
    ['growth report tracks genre target', script.includes('genreTargetSampleCount')],
    ['growth report tracks subgenre target', script.includes('subgenreTargetSampleCount')],
    ['plan has genres', Array.isArray(plan?.genres) && plan.genres.length >= 5],
    ['plan has subgenres', Array.isArray(plan?.genres) && plan.genres.every((genre) => Array.isArray(genre.subgenres) && genre.subgenres.length >= 1)],
  ]

  const failed = checks.filter(([, ok]) => !ok)
  if (failed.length) {
    for (const [name] of failed) {
      console.error(`FAIL: ${name}`)
    }
    process.exit(1)
  }

  console.log('OK smoke:growth-report')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
