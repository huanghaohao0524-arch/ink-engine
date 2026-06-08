import fs from 'node:fs'

const source = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const runtime = fs.readFileSync('public/legacy-runtime.js', 'utf8')

const checks = [
  'normalizeGenreId',
  'card.dataset.bookGenre',
  'card.dataset.genre',
  'bookMetaSignature',
  'handleGenreRailClick',
  'ACTIVE_GENRE_STORAGE_KEY',
  'createGenreButton',
  'filterCards(cards, activeGenre)',
  'enhanceAiSettingsProfiles',
  'bindGenreRailDelegation',
  '__inkEngineGenreRailDelegationBound',
]

for (const check of checks) {
  if (!source.includes(check)) {
    throw new Error(`Bookshelf genre filtering contract missing ${check}`)
  }
}

if (!/function handleGenreRailClick\(genreId, onSelect\)[\s\S]+window\.localStorage\.setItem\(ACTIVE_GENRE_STORAGE_KEY,\s*genreId\)[\s\S]+onSelect\(genreId\)/.test(source)) {
  throw new Error('Genre button clicks must persist the selected genre before rerendering')
}

if (!/document\.addEventListener\('click'[\s\S]+closest\?\.\('\.genre-rail-item'\)[\s\S]+booksSection\.bookshelfRender\(genreId\)/.test(source)) {
  throw new Error('Genre rail needs delegated click handling so recreated buttons keep working')
}

if (!/const isVisible = activeGenre === 'all' \|\| card\.dataset\.genre === activeGenre/.test(source)) {
  throw new Error('Genre filtering must hide cards by active genre')
}

if (!/card\.style\.display = isVisible \? '' : 'none'/.test(source)) {
  throw new Error('Genre filtering must force display changes for the legacy card grid')
}

if (/libraryKey && libraryKey === bookMetaLoadedForLibrary/.test(source)) {
  throw new Error('Book metadata refresh must not cache by library path only; new books in the same library need fresh genres')
}

if (!runtime.includes('u.jsx("dt",{children:"\\u9898\\u6750"}),u.jsx("dd",{children:f.genre||"\\u672a\\u8bbe\\u7f6e"})')) {
  throw new Error('The packaged legacy dashboard book card must render the book genre row')
}

console.log('smoke-bookshelf-genre-filter-active ok')
