import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const bookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-snapshot-'))
const chapterFile = '\u6b63\u6587/chapter-001.md'
const chapterPath = path.join(bookPath, chapterFile)
const snapshotDir = path.join(bookPath, '.backup', 'chapters', 'chapter-001')

await fs.mkdir(path.dirname(chapterPath), { recursive: true })
await fs.mkdir(snapshotDir, { recursive: true })
await fs.writeFile(chapterPath, '# old\n', 'utf8')

const now = new Date()
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('')

const snapshotPath = path.join(snapshotDir, `${stamp}-manual.md`)
await fs.writeFile(snapshotPath, await fs.readFile(chapterPath, 'utf8'), 'utf8')
await fs.writeFile(chapterPath, '# new\n', 'utf8')

const snapshot = await fs.readFile(snapshotPath, 'utf8')
const current = await fs.readFile(chapterPath, 'utf8')

console.log(JSON.stringify({ bookPath, snapshotPath, snapshot, current }, null, 2))

if (snapshot !== '# old\n' || current !== '# new\n') {
  throw new Error('Snapshot smoke failed')
}
