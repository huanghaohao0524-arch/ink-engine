import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['context budget includes editorial review', main.includes('editorialReview: 1600')],
  ['project materials expose editorial review', main.includes("{ id: 'editorialReview'") && main.includes('editorial-review.md')],
  ['reader exists for editorial review', main.includes('async function readEditorialReviewMaterial')],
  ['project context reads editorial review', main.includes('editorialReview: await readEditorialReviewMaterial(bookPath)')],
  ['light chat context carries editorial review', main.includes('editorialReview: limitText(fullContext.editorialReview, 1200)')],
  ['chapter stable context uses editorial review', main.includes('context.editorialReview ||') && main.includes('editorial-review.md')],
  ['project update context can see editorial review', main.includes('editorialReview: limitText(context.editorialReview, 1000)')],
  ['material rewrite context can see editorial review', main.includes('editorialReview: limitText(context.editorialReview, 1000)')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-review-context'] === 'node scripts/smoke-editorial-review-context.mjs'],
  ['core smoke includes editorial review context', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-review-context')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Editorial review context smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial review context smoke passed')
