import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['book strategy budget exists', main.includes('bookStrategyReview: 1600')],
  ['book strategy material is listed', main.includes("id: 'bookStrategyReview'") && main.includes('book-strategy-review.md')],
  ['book strategy report builder exists', main.includes('function buildBookStrategyReviewReport')],
  ['book strategy persists after apply', main.includes('buildBookStrategyReviewReport({ sourceLabel, chapterFile, mode, draft })')],
  ['book strategy reader exists', main.includes('async function readBookStrategyReviewMaterial')],
  ['project context reads book strategy', main.includes('bookStrategyReview: await readBookStrategyReviewMaterial(bookPath)')],
  ['light chat context carries book strategy', main.includes('bookStrategyReview: limitText(fullContext.bookStrategyReview, 1000)')],
  ['stable context exposes book strategy', main.includes('## 全书/卷节奏复盘') && main.includes('context.bookStrategyReview')],
  ['strategy planner consumes book strategy explicitly', main.includes('# 全书/卷节奏复盘') && main.includes("context.bookStrategyReview || '暂无全书/卷节奏复盘。'")],
  ['package exposes smoke', pkg.scripts?.['smoke:book-strategy-review'] === 'node scripts/smoke-book-strategy-review.mjs'],
  ['core smoke includes book strategy review', pkg.scripts?.['smoke:core']?.includes('smoke:book-strategy-review')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Book strategy review smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Book strategy review smoke passed.')
