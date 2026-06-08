import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['strategy prompt builder exists', main.includes('function buildChapterStrategyPrompt')],
  ['strategy planner runs before task card', main.indexOf("recordWritingTaskStep(taskTrace, 'chapter-strategy'") < main.indexOf("recordWritingTaskStep(taskTrace, 'task-card'")],
  ['task card consumes strategy', main.includes('function buildChapterTaskCardPrompt({ instruction, book, selectedChapter, context, executionContract, chapterStrategy })')],
  ['draft consumes strategy', main.includes('function buildChapterDraftPrompt({ instruction, book, selectedChapter, context, taskCard, executionContract, chapterStrategy })')],
  ['self check consumes strategy', main.includes('function buildChapterSelfCheckPrompt({ book, selectedChapter, context, taskCard, draft, executionContract, chapterStrategy })')],
  ['final pass repair consumes strategy', main.includes('function buildEditorialFinalPassRevisionPrompt({ instruction, book, selectedChapter, context, taskCard, finalPass, finalContent, executionContract, chapterStrategy })')],
  ['director detail shows strategy', main.includes('chapterStrategy') && main.includes('## 章节战略规划')],
  ['strategy output requires reader gain and no-repeat', main.includes('读者本章获得') && main.includes('禁止重复')],
  ['package exposes smoke script', pkg.scripts?.['smoke:chapter-strategy-planner'] === 'node scripts/smoke-chapter-strategy-planner.mjs'],
  ['core smoke includes strategy planner', pkg.scripts?.['smoke:core']?.includes('smoke:chapter-strategy-planner')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Chapter strategy planner smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Chapter strategy planner smoke passed')
