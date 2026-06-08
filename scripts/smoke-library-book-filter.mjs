import fs from 'node:fs'

const source = fs.readFileSync('electron/main.mjs', 'utf8')

const requiredSnippets = [
  'ignoredLibraryFolderNames',
  'isRecognizedBookProject',
  'inferBookSummaryGenre',
  'return null',
  '.filter(Boolean)',
  'standardFolderCount',
]

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    throw new Error(`Library scan must filter non-book folders; missing ${snippet}`)
  }
}

if (!/Boolean\(bookConfig\)[\s\S]+standardFolderCount\s*>?=\s*3/.test(source)) {
  throw new Error('Book recognition should require book.json or enough book markers, not any one folder')
}

console.log('smoke-library-book-filter ok')
