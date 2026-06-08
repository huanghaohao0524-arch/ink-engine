import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const defaultSonovelDir = path.resolve('artifacts/sonovel-v1.10.1/SoNovel')
const defaultLibrary = path.resolve('D:/ai/写作/写作样本库')
const defaultBundle = path.resolve('build/writing-fingerprints')
const port = 7765

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  if (args.has('help') || !args.has('genre') || (!args.has('books') && !args.has('book-file'))) {
    console.log('Usage: node scripts/collect-sample-books-cli.mjs --genre <题材> --books <书名1,书名2> [--genre-file <path>] [--book-file <path>] [--library <path>] [--bundle <path>] [--sonovel <path>] [--dry-run]')
    process.exit(args.has('help') ? 0 : 1)
  }

  const inlineBooks = args.has('books') ? parseBookSpecs(String(args.get('books'))) : []
  const bookFilePath = args.has('book-file') ? path.resolve(String(args.get('book-file'))) : ''
  const genreFilePath = args.has('genre-file') ? path.resolve(String(args.get('genre-file'))) : ''

  return {
    genre: String(args.get('genre')).trim(),
    genreFilePath,
    books: inlineBooks,
    bookFilePath,
    libraryPath: args.has('library') ? path.resolve(String(args.get('library'))) : defaultLibrary,
    bundlePath: args.has('bundle') ? path.resolve(String(args.get('bundle'))) : defaultBundle,
    sonovelDir: args.has('sonovel') ? path.resolve(String(args.get('sonovel'))) : defaultSonovelDir,
    dryRun: args.has('dry-run'),
    skipRefresh: args.has('skip-refresh'),
    limit: args.has('limit') ? Number(args.get('limit')) : 0,
    searchTimeoutMs: args.has('search-timeout-ms') ? Number(args.get('search-timeout-ms')) : 90000,
    fetchTimeoutMs: args.has('fetch-timeout-ms') ? Number(args.get('fetch-timeout-ms')) : 240000,
  }
}

function parseBookSpecs(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, author = ''] = item.split('|').map((part) => part.trim())
      return { title, author }
    })
    .filter((item) => item.title)
}

async function loadBookSpecsFromFile(bookFilePath) {
  if (!bookFilePath) {
    return []
  }

  const content = await fs.readFile(bookFilePath, 'utf8')
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [title, author = ''] = line.split('|').map((part) => part.trim())
      return { title, author }
    })
    .filter((item) => item.title)
}

async function loadGenreFromFile(genreFilePath) {
  if (!genreFilePath) {
    return ''
  }

  return (await fs.readFile(genreFilePath, 'utf8')).trim()
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestJson(url, timeoutMs = 120000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const text = await response.text()
    try {
      return text ? JSON.parse(text) : null
    } catch {
      return text
    }
  } finally {
    clearTimeout(timer)
  }
}

async function withRetries(task, { retries = 3, delayMs = 1500 } = {}) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await task(attempt)
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await sleep(delayMs * attempt)
      }
    }
  }

  throw lastError
}

async function ensureSonovelWeb(sonovelDir) {
  const exe = path.join(sonovelDir, 'sonovel.exe')
  if (!(await pathExists(exe))) {
    throw new Error(`未找到 so-novel 可执行文件：${exe}`)
  }

  try {
    await requestJson(`http://127.0.0.1:${port}/config`, 3000)
    return
  } catch {
    // Start a local web server below.
  }

  spawn(exe, {
    cwd: sonovelDir,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  }).unref()

  for (let i = 0; i < 20; i += 1) {
    await sleep(500)
    try {
      await requestJson(`http://127.0.0.1:${port}/config`, 3000)
      return
    } catch {
      // Keep waiting.
    }
  }

  throw new Error('so-novel Web 服务启动失败')
}

async function searchBook(title, searchTimeoutMs) {
  const url = `http://127.0.0.1:${port}/search/aggregated?kw=${encodeURIComponent(title)}&searchLimit=8`
  const result = await withRetries(() => requestJson(url, searchTimeoutMs), { retries: 3, delayMs: 1200 })
  return Array.isArray(result?.data) ? result.data : []
}

function chooseBestResult(bookSpec, results) {
  const exactWithAuthor = bookSpec.author
    ? results.find((item) => item.bookName === bookSpec.title && item.author === bookSpec.author)
    : null
  if (exactWithAuthor) {
    return exactWithAuthor
  }

  const authorMatch = bookSpec.author
    ? results.find((item) => item.author === bookSpec.author && item.bookName?.includes(bookSpec.title))
    : null
  if (authorMatch) {
    return authorMatch
  }

  if (bookSpec.author) {
    return null
  }

  const exact = results.find((item) => item.bookName === bookSpec.title)
  return exact ?? results[0] ?? null
}

async function fetchBook(url, fetchTimeoutMs) {
  const fetchUrl = `http://127.0.0.1:${port}/book-fetch?url=${encodeURIComponent(url)}&format=txt&concurrency=8`
  await withRetries(() => requestJson(fetchUrl, fetchTimeoutMs), { retries: 2, delayMs: 3000 })
}

async function findDownloadedTxt(sonovelDir, bookName) {
  const downloads = path.join(sonovelDir, 'downloads')
  const entries = await fs.readdir(downloads, { withFileTypes: true }).catch(() => [])
  const candidates = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.txt')) {
      continue
    }

    if (entry.name.includes(bookName)) {
      const file = path.join(downloads, entry.name)
      const stat = await fs.stat(file)
      candidates.push({ file, mtimeMs: stat.mtimeMs })
    }
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return candidates[0]?.file ?? ''
}

async function copyDownloadedTxtToLibrary({ genre, bookName, downloadedFile, libraryPath }) {
  const targetDir = path.join(libraryPath, '原文样本', genre)
  await fs.mkdir(targetDir, { recursive: true })

  const target = path.join(targetDir, path.basename(downloadedFile).includes(bookName)
    ? path.basename(downloadedFile)
    : `${bookName}.txt`)
  await fs.copyFile(downloadedFile, target)
  return target
}

async function hasExistingSample({ genre, title, author, libraryPath }) {
  const targetDir = path.join(libraryPath, '原文样本', genre)
  if (!(await pathExists(targetDir))) {
    return ''
  }

  const entries = await fs.readdir(targetDir, { withFileTypes: true })
  const preferredName = author ? `${title}(${author}).txt` : ''

  if (preferredName) {
    const exact = entries.find((entry) => entry.isFile() && entry.name === preferredName)
    if (exact) {
      return path.join(targetDir, exact.name)
    }
  }

  const loose = entries.find((entry) => entry.isFile() && entry.name.includes(title))
  return loose ? path.join(targetDir, loose.name) : ''
}

function refreshFingerprints({ libraryPath, bundlePath }) {
  execFileSync(process.execPath, [
    path.resolve('scripts/analyze-sample-fingerprints-cli.mjs'),
    '--library',
    libraryPath,
    '--bundle',
    bundlePath,
  ], {
    cwd: process.cwd(),
    stdio: 'pipe',
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const fileBooks = await loadBookSpecsFromFile(options.bookFilePath)
  const genreFromFile = await loadGenreFromFile(options.genreFilePath)
  const mergedBooks = [...options.books, ...fileBooks]
  const allBooks = options.limit > 0 ? mergedBooks.slice(0, options.limit) : mergedBooks
  const resolvedGenre = genreFromFile || options.genre

  if (!resolvedGenre) {
    throw new Error('题材不能为空')
  }

  if (!allBooks.length) {
    throw new Error('书名列表不能为空')
  }

  if (options.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      skipRefresh: options.skipRefresh,
      genre: resolvedGenre,
      books: allBooks,
      libraryPath: options.libraryPath,
      bundlePath: options.bundlePath,
      sonovelDir: options.sonovelDir,
      bookFilePath: options.bookFilePath,
    }, null, 2))
    return
  }

  await ensureSonovelWeb(options.sonovelDir)
  const collected = []

  for (const bookSpec of allBooks) {
    try {
      const existingSample = await hasExistingSample({
        genre: options.genre,
        genre: resolvedGenre,
        title: bookSpec.title,
        author: bookSpec.author,
        libraryPath: options.libraryPath,
      })

      if (existingSample) {
        collected.push({ book: bookSpec, status: 'skipped-existing', sampleFile: existingSample })
        continue
      }

      const results = await searchBook(bookSpec.title, options.searchTimeoutMs)
      const selected = chooseBestResult(bookSpec, results)

      if (!selected?.url) {
        collected.push({ book: bookSpec, status: 'not-found' })
        continue
      }

      await fetchBook(selected.url, options.fetchTimeoutMs)
      const downloadedFile = await findDownloadedTxt(options.sonovelDir, selected.bookName || bookSpec.title)

      if (!downloadedFile) {
        collected.push({ book: bookSpec, status: 'download-missing', selected })
        continue
      }

      const sampleFile = await copyDownloadedTxtToLibrary({
        genre: resolvedGenre,
        bookName: selected.bookName || bookSpec.title,
        downloadedFile,
        libraryPath: options.libraryPath,
      })
      collected.push({ book: bookSpec, status: 'collected', selected, sampleFile })
    } catch (error) {
      collected.push({
        book: bookSpec,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (!options.skipRefresh) {
    refreshFingerprints({
      libraryPath: options.libraryPath,
      bundlePath: options.bundlePath,
    })
  }

  console.log(JSON.stringify({
    genre: resolvedGenre,
    skipRefresh: options.skipRefresh,
    collected,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
