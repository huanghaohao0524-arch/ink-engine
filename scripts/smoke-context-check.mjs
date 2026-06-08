import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  manuscript: '\u6b63\u6587',
  settings: '\u8bbe\u5b9a',
  characters: '\u89d2\u8272',
  outline: '\u5927\u7eb2',
  tracking: '\u8ffd\u8e2a',
}

async function hasFile(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const bookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-context-'))
await Promise.all([names.manuscript, names.settings, names.characters, names.outline, names.tracking].map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))
await fs.writeFile(path.join(bookPath, 'book.json'), JSON.stringify({ title: '\u4f53\u68c0\u4e66', platform: '\u8d77\u70b9', chapters: [{ id: 'chapter-001', title: '\u7b2c001\u7ae0', file: `${names.manuscript}/chapter-001.md` }] }, null, 2), 'utf8')
await fs.writeFile(path.join(bookPath, names.manuscript, 'chapter-001.md'), '# chapter\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.settings, 'platform-fit.md'), '# platform\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.settings, 'core-setting.md'), '# setting\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.characters, 'main-character.md'), '# character\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.characters, 'supporting-characters.md'), '# supporting\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.outline, 'overall-outline.md'), '# outline\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.tracking, 'tracking.md'), '# tracking\n', 'utf8')

const beforeVolume = await hasFile(path.join(bookPath, names.outline, 'volume-001.md'))
await fs.writeFile(path.join(bookPath, names.outline, 'volume-001.md'), '# volume\n', 'utf8')
await fs.writeFile(path.join(bookPath, names.outline, 'chapter-001-outline.md'), '# chapter outline\n', 'utf8')
const afterVolume = await hasFile(path.join(bookPath, names.outline, 'volume-001.md'))
const afterChapterOutline = await hasFile(path.join(bookPath, names.outline, 'chapter-001-outline.md'))

console.log(JSON.stringify({ bookPath, beforeVolume, afterVolume, afterChapterOutline }, null, 2))

if (beforeVolume || !afterVolume || !afterChapterOutline) {
  throw new Error('Context check smoke failed')
}
