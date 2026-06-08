import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'generic story state material exists',
    ok: main.includes('story-state.md') &&
      main.includes('ensureStoryStateMaterial') &&
      main.includes('buildStoryStateSeed'),
  },
  {
    name: 'genre state templates cover major genres',
    ok: main.includes("genreKey === 'webGame'") &&
      main.includes("genreKey === 'fantasy'") &&
      main.includes("genreKey === 'urban'") &&
      main.includes("genreKey === 'romance'") &&
      main.includes("genreKey === 'suspense'"),
  },
  {
    name: 'chapter context reads story state with legacy game-state fallback',
    ok: main.includes('storyState: await readStoryStateMaterial(bookPath)') &&
      main.includes("names.tracking, 'game-state.md'"),
  },
  {
    name: 'chapter prompts use story state as hard continuity',
    ok: main.includes('context.storyState') &&
      main.includes('## 类型状态卡') &&
      main.includes('连续变量') &&
      main.includes('硬约束'),
  },
  {
    name: 'director extracts and persists genre state patch',
    ok: main.includes("parseSyncSection(selfCheck, '章节后状态更新')") &&
      main.includes('statePatch') &&
      main.includes("appendSection(input.bookPath, `${names.tracking}/story-state.md`"),
  },
  {
    name: 'frontend carries state patch through writing apply',
    ok: types.includes('statePatch?: string') &&
      app.includes('statePatch: candidate.statePatch') &&
      app.includes('api.applyWritingCandidate'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Genre state machine smoke failed')
}
