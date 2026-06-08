import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  manuscript: '\u6b63\u6587',
  settings: '\u8bbe\u5b9a',
  outline: '\u5927\u7eb2',
  tracking: '\u8ffd\u8e2a',
  exportDir: '\u5bfc\u51fa',
}

const libraryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-io-'))
const bookPath = path.join(libraryPath, '\u6d4b\u8bd5\u7ae0\u8282\u4e66')

await Promise.all([bookPath, ...[names.manuscript, names.settings, names.outline, names.tracking, names.exportDir, '.backup'].map((folder) => path.join(bookPath, folder))].map((folder) => fs.mkdir(folder, { recursive: true })))

await fs.writeFile(
  path.join(bookPath, 'book.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      title: '\u6d4b\u8bd5\u7ae0\u8282\u4e66',
      platform: '\u8d77\u70b9',
      stage: 'drafting',
      chapters: [
        { id: 'chapter-001', title: '\u7b2c001\u7ae0', file: `${names.manuscript}/chapter-001.md`, status: 'draft', targetWords: 2200 },
        { id: 'chapter-002', title: '\u7b2c002\u7ae0', file: `${names.manuscript}/chapter-002.md`, status: 'draft', targetWords: 2200 },
      ],
    },
    null,
    2,
  )}\n`,
  'utf8',
)

await fs.writeFile(path.join(bookPath, names.manuscript, 'chapter-001.md'), '# \u7b2c001\u7ae0\n\n\u539f\u59cb\u5185\u5bb9\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.manuscript, 'chapter-002.md'), '# \u7b2c002\u7ae0\n\n\u7b2c\u4e8c\u7ae0\n', 'utf8')

const entries = await fs.readdir(path.join(bookPath, names.manuscript), { withFileTypes: true })
const chapters = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => `${names.manuscript}/${entry.name}`)

const targetFile = path.join(bookPath, chapters[0])
const nextContent = '# \u7b2c001\u7ae0\n\n\u5df2\u4fdd\u5b58\u7684\u65b0\u5185\u5bb9\n'
await fs.writeFile(targetFile, nextContent, 'utf8')
const saved = await fs.readFile(targetFile, 'utf8')

console.log(JSON.stringify({ libraryPath, bookPath, chapters, savedOk: saved === nextContent }, null, 2))

if (chapters.length !== 2 || saved !== nextContent) {
  throw new Error('Chapter IO smoke failed')
}
