import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'chapter progress material is created and listed',
    ok: main.includes('chapter-progress.md') &&
      main.includes('buildChapterProgressSeed') &&
      main.includes('ensureChapterProgressMaterial') &&
      main.includes("id: 'chapterProgress'"),
  },
  {
    name: 'project context reads chapter progress',
    ok: main.includes('chapterProgress: await readChapterProgressMaterial(bookPath)') &&
      main.includes('chapterProgress: limitText(fullContext.chapterProgress'),
  },
  {
    name: 'chapter stable context treats progress as hard constraint',
    ok: main.includes('context.chapterProgress') &&
      main.includes('## 章节推进状态') &&
      main.includes('不能只重复上一章'),
  },
  {
    name: 'director extracts chapter progress patch',
    ok: main.includes("parseSyncSection(selfCheck, '章节推进更新')") &&
      main.includes('progressPatch') &&
      main.includes("appendSection(input.bookPath, `${names.tracking}/chapter-progress.md`"),
  },
  {
    name: 'frontend carries chapter progress patch through apply',
    ok: types.includes('progressPatch?: string') &&
      app.includes('progressPatch?: string') &&
      app.includes('progressPatch: generated.progressPatch') &&
      app.includes('progressPatch: candidate.progressPatch'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Chapter progress state smoke failed')
}
