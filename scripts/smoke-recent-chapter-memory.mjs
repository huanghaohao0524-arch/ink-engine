import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'recent chapter memory material exists',
    ok: main.includes('chapter-memory.md') &&
      main.includes('buildChapterMemorySeed') &&
      main.includes('ensureChapterMemoryMaterial') &&
      main.includes("id: 'chapterMemory'"),
  },
  {
    name: 'project context reads recent chapter memory',
    ok: main.includes('chapterMemory: await readChapterMemoryMaterial(bookPath)') &&
      main.includes('chapterMemory: limitText(fullContext.chapterMemory'),
  },
  {
    name: 'stable context uses chapter memory as continuity layer',
    ok: main.includes('## 最近章节记忆') &&
      main.includes('context.chapterMemory') &&
      main.includes('最近三章'),
  },
  {
    name: 'final draft sync emits chapter memory update',
    ok: main.includes('## 章节记忆更新') &&
      main.includes("parseSyncSection(finalSync, '章节记忆更新')") &&
      main.includes('memoryPatch'),
  },
  {
    name: 'apply writing candidate persists chapter memory patch',
    ok: main.includes("appendSection(input.bookPath, `${names.tracking}/chapter-memory.md`") &&
      main.includes('input.memoryPatch'),
  },
  {
    name: 'frontend carries chapter memory patch through writing apply',
    ok: types.includes('memoryPatch?: string') &&
      app.includes('memoryPatch?: string') &&
      app.includes('memoryPatch: generated.memoryPatch') &&
      app.includes('memoryPatch: candidate.memoryPatch'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Recent chapter memory smoke failed')
}
