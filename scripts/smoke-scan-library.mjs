import fs from 'node:fs/promises'
import path from 'node:path'

const libraryPath = process.argv[2] || 'D:\\ai\\写作'
const names = {
  manuscript: '\u6b63\u6587',
  settings: '\u8bbe\u5b9a',
  characters: '\u89d2\u8272',
  outline: '\u5927\u7eb2',
  tracking: '\u8ffd\u8e2a',
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

async function detectBook(entry) {
  const bookPath = path.join(libraryPath, entry.name)
  const config = await readJsonFile(path.join(bookPath, 'book.json'))
  const standardFolders = await Promise.all([
    pathExists(path.join(bookPath, names.manuscript)),
    pathExists(path.join(bookPath, names.settings)),
    pathExists(path.join(bookPath, names.characters)),
    pathExists(path.join(bookPath, names.outline)),
    pathExists(path.join(bookPath, names.tracking)),
  ])

  return {
    title: typeof config?.title === 'string' ? config.title : entry.name,
    isStandard: Boolean(config) || standardFolders.some(Boolean),
    hasManuscript: standardFolders[0],
    hasSettings: standardFolders[1],
    hasCharacters: standardFolders[2],
    hasOutline: standardFolders[3],
    hasTracking: standardFolders[4],
  }
}

const entries = await fs.readdir(libraryPath, { withFileTypes: true })
const books = await Promise.all(entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map(detectBook))

console.log(JSON.stringify({ libraryPath, count: books.length, books }, null, 2))

if (books.length === 0) {
  throw new Error('No book folders detected')
}
