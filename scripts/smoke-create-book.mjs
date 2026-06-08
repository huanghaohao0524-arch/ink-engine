import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  manuscript: '\u6b63\u6587',
  settings: '\u8bbe\u5b9a',
  characters: '\u89d2\u8272',
  outline: '\u5927\u7eb2',
  tracking: '\u8ffd\u8e2a',
  exportDir: '\u5bfc\u51fa',
}

const libraryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-workbench-'))
const book = {
  title: '',
  platform: '\u8d77\u70b9',
  idea: '\u4e00\u4e2a\u6d4b\u8bd5\u7528\u7684\u8111\u6d1e',
}
const generatedTitle = '\u672a\u5b9a\u540d\u65b0\u4e66-\u8d77\u70b9-smoke'
const bookPath = path.join(libraryPath, generatedTitle)

await fs.mkdir(bookPath, { recursive: true })
await Promise.all([names.settings, names.characters, names.outline, names.manuscript, names.tracking, names.exportDir, '.backup'].map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))
await fs.writeFile(
  path.join(bookPath, 'book.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      title: generatedTitle,
      titleStatus: 'ai-pending',
      platform: book.platform,
      stage: 'idea',
      todayTask: '\u5b8c\u6210 AI \u7acb\u9879\u95ee\u7b54',
      idea: book.idea,
      chapters: [{ id: 'chapter-001', title: '\u7b2c001\u7ae0', file: `${names.manuscript}/chapter-001.md`, status: 'draft', targetWords: 2200 }],
    },
    null,
    2,
  )}\n`,
  'utf8',
)

const files = [
  path.join(names.settings, 'project-brief.md'),
  path.join(names.settings, 'cover-prompt.md'),
  path.join(names.settings, 'core-setting.md'),
  path.join(names.settings, 'platform-fit.md'),
  path.join(names.settings, 'genre-rules.md'),
  path.join(names.characters, 'main-character.md'),
  path.join(names.characters, 'supporting-characters.md'),
  path.join(names.characters, 'minor-characters.md'),
  path.join(names.outline, 'overall-outline.md'),
  path.join(names.outline, 'golden-first-3-chapters.md'),
  path.join(names.tracking, 'tracking.md'),
  path.join(names.manuscript, 'chapter-001.md'),
]

await Promise.all(files.map((file) => fs.writeFile(path.join(bookPath, file), '# smoke\n', 'utf8')))

const checks = await Promise.all([path.join(bookPath, 'book.json'), ...files.map((file) => path.join(bookPath, file))].map(async (file) => {
  try {
    await fs.access(file)
    return { file, ok: true }
  } catch {
    return { file, ok: false }
  }
}))

const failed = checks.filter((check) => !check.ok)
console.log(JSON.stringify({ libraryPath, bookPath, checked: checks.length, failed }, null, 2))

if (failed.length > 0) {
  throw new Error('Create book smoke failed')
}
