import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['editorial review index report builder exists', main.includes('function buildEditorialReviewIndexReport')],
  ['editorial review index file is persisted', main.includes('editorial-review-index.md') && main.includes('buildEditorialReviewIndexReport({ sourceLabel, chapterFile, mode, draft })')],
  ['editorial reader combines index and recent reviews', main.includes("const index = await readTextFileIfExists(path.join(bookPath, names.tracking, 'editorial-review-index.md'))") && main.includes("'# 主编风险索引'")],
  ['editorial reader limits raw review tail', main.includes('limitText(review, 2200)')],
  ['editorial review log remains governed', main.includes("`${names.tracking}/editorial-review.md`") && main.includes('26000')],
  ['editorial index remains governed', main.includes("`${names.tracking}/editorial-review-index.md`") && main.includes('12000')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-review-compaction'] === 'node scripts/smoke-editorial-review-compaction.mjs'],
  ['core smoke includes compaction smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-review-compaction')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Editorial review compaction smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial review compaction smoke passed')
