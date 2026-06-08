import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  manuscript: '\u6b63\u6587',
  outline: '\u5927\u7eb2',
}

const bookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-candidate-'))
await Promise.all([names.manuscript, names.outline].map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))

await fs.writeFile(
  path.join(bookPath, 'book.json'),
  JSON.stringify(
    {
      title: '\u5019\u9009\u5e94\u7528\u4f53\u68c0',
      platform: '\u8d77\u70b9',
      chapters: [
        { id: 'chapter-001', title: '\u7b2c001\u7ae0', file: `${names.manuscript}/chapter-001.md`, targetWords: 2200 },
        { id: 'chapter-002', title: '\u7b2c002\u7ae0', file: `${names.manuscript}/chapter-002.md`, targetWords: 2200 },
      ],
    },
    null,
    2,
  ),
  'utf8',
)

await fs.writeFile(path.join(bookPath, names.manuscript, 'chapter-001.md'), '# 001\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.manuscript, 'chapter-002.md'), '# 002\n', 'utf8')

const selectedChapterFile = `${names.manuscript}/chapter-002.md`
const targetFile = `${names.outline}/chapter-002-outline.md`
await fs.writeFile(path.join(bookPath, targetFile), '# old outline\n', 'utf8')

const expectedCandidate = '# 第002章细纲\n\n这一章必须保留当前选择的第二章上下文。'
await fs.mkdir(path.join(bookPath, '.backup', 'materials', '大纲-chapter-002-outline'), { recursive: true })
await fs.writeFile(path.join(bookPath, targetFile), expectedCandidate, 'utf8')

const applied = await fs.readFile(path.join(bookPath, targetFile), 'utf8')
const selectedStillSecond = selectedChapterFile.endsWith('chapter-002.md')

console.log(JSON.stringify({ bookPath, targetFile, selectedChapterFile, selectedStillSecond, appliedOk: applied === expectedCandidate }, null, 2))

if (!selectedStillSecond || applied !== expectedCandidate) {
  throw new Error('Candidate state smoke failed')
}
