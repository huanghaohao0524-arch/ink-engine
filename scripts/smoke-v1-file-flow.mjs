import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  manuscript: '正文',
  exportDir: '导出',
}

function markdownToPlainText(content) {
  return content.replace(/^#{1,6}\s+/gm, '').trim()
}

const libraryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-v1-'))
const bookPath = path.join(libraryPath, '第一版闭环测试')

await Promise.all([bookPath, path.join(bookPath, names.manuscript), path.join(bookPath, names.exportDir), path.join(bookPath, '.backup', 'chapters', 'chapter-001')].map((folder) => fs.mkdir(folder, { recursive: true })))

const firstChapter = `${names.manuscript}/chapter-001.md`
const secondChapter = `${names.manuscript}/chapter-002.md`

await fs.writeFile(
  path.join(bookPath, 'book.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      title: '第一版闭环测试',
      platform: '起点',
      stage: 'drafting',
      chapters: [
        { id: 'chapter-001', title: '第001章', file: firstChapter, status: 'draft', targetWords: 2200 },
        { id: 'chapter-002', title: '第002章', file: secondChapter, status: 'draft', targetWords: 2200 },
      ],
    },
    null,
    2,
  )}\n`,
  'utf8',
)

await fs.writeFile(path.join(bookPath, firstChapter), '# 第001章\n\n原始正文\n', 'utf8')
await fs.writeFile(path.join(bookPath, secondChapter), '# 第002章\n\n新增章节\n', 'utf8')

const snapshotPath = path.join(bookPath, '.backup', 'chapters', 'chapter-001', '20260516120000-manual.md')
await fs.writeFile(snapshotPath, '# 第001章\n\n快照正文\n', 'utf8')
await fs.copyFile(snapshotPath, path.join(bookPath, firstChapter))

const restored = await fs.readFile(path.join(bookPath, firstChapter), 'utf8')
const chapterExport = path.join(bookPath, names.exportDir, '第001章.txt')
await fs.writeFile(chapterExport, `${markdownToPlainText(restored)}\n`, 'utf8')

const allBookExport = path.join(bookPath, names.exportDir, '第一版闭环测试_全书_20260516120000.txt')
const allContent = await Promise.all([firstChapter, secondChapter].map(async (file) => markdownToPlainText(await fs.readFile(path.join(bookPath, file), 'utf8'))))
await fs.writeFile(allBookExport, `${allContent.join('\n\n')}\n`, 'utf8')

const results = {
  bookPath,
  restoredOk: restored.includes('快照正文'),
  chapterExportOk: (await fs.readFile(chapterExport, 'utf8')).includes('第001章'),
  bookExportOk: (await fs.readFile(allBookExport, 'utf8')).includes('新增章节'),
}

console.log(JSON.stringify(results, null, 2))

if (!results.restoredOk || !results.chapterExportOk || !results.bookExportOk) {
  throw new Error('V1 file flow smoke failed')
}
