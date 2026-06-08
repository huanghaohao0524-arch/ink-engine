import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'web game state material uses generic story state with legacy fallback',
    ok:
      main.includes('story-state.md') &&
      main.includes('ensureStoryStateMaterial') &&
      main.includes('storyState: await readStoryStateMaterial(bookPath)') &&
      main.includes("names.tracking, 'game-state.md'"),
  },
  {
    name: 'chapter prompts treat web game state as hard continuity',
    ok:
      main.includes('context.storyState') &&
      main.includes('## 类型状态卡') &&
      main.includes('等级/经验') &&
      main.includes('任务进度') &&
      main.includes('装备/技能') &&
      main.includes('硬约束'),
  },
  {
    name: 'self check extracts chapter state update',
    ok: main.includes('parseSyncSection(selfCheck,') && main.includes('章节后状态更新') && main.includes('statePatch'),
  },
  {
    name: 'applying continuation persists chapter and state update',
    ok:
      main.includes("ipcMain.handle('book:apply-writing-candidate'") &&
      main.includes('statePatch') &&
      main.includes('writeChapterSnapshot') &&
      main.includes('appendSection(input.bookPath, `${names.tracking}/story-state.md`'),
  },
  {
    name: 'frontend sends state patch when applying writing candidate',
    ok:
      types.includes('statePatch?: string') &&
      types.includes('applyWritingCandidate') &&
      app.includes('statePatch: candidate.statePatch') &&
      app.includes('api.applyWritingCandidate'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Web game state loop smoke failed')
}
