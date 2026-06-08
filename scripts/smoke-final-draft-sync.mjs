import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')

const checks = [
  {
    name: 'final draft sync output limit exists',
    ok: main.includes('chapterFinalSync: 900'),
  },
  {
    name: 'final draft sync prompt exists',
    ok: main.includes('function buildFinalDraftSyncPrompt') &&
      main.includes('最终正文') &&
      main.includes('只根据最终正文生成可沉淀状态'),
  },
  {
    name: 'director re-syncs after auto revision',
    ok: main.includes('await syncFinalDraftState({') &&
      main.includes('finalContent') &&
      main.includes('maxOutputTokens: aiOutputLimits.chapterFinalSync'),
  },
  {
    name: 'final sync parses both state and progress patches',
    ok: main.includes("parseSyncSection(finalSync, '章节后状态更新')") &&
      main.includes("parseSyncSection(finalSync, '章节推进更新')"),
  },
  {
    name: 'director detail shows final sync report',
    ok: main.includes('finalSync') &&
      main.includes('## 最终稿状态同步'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Final draft sync smoke failed')
}
