import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const defaultCuratedPath = path.resolve('build/writing-fingerprints/curated-book-candidates.json')
const defaultLibrary = path.resolve('D:/ai/写作/写作样本库')
const defaultBundle = path.resolve('build/writing-fingerprints')
const defaultSonovelDir = path.resolve('artifacts/sonovel-v1.10.1/SoNovel')
const defaultTempDir = path.resolve('build/writing-fingerprints/tmp')
const defaultReportPath = path.resolve('build/writing-fingerprints/latest-bulk-collection-report.json')

function parseArgs(argv) {
  const args = new Map()

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true)
    }
  }

  return {
    curatedPath: args.has('curated') ? path.resolve(String(args.get('curated'))) : defaultCuratedPath,
    libraryPath: args.has('library') ? path.resolve(String(args.get('library'))) : defaultLibrary,
    bundlePath: args.has('bundle') ? path.resolve(String(args.get('bundle'))) : defaultBundle,
    sonovelDir: args.has('sonovel') ? path.resolve(String(args.get('sonovel'))) : defaultSonovelDir,
    tempDir: args.has('temp-dir') ? path.resolve(String(args.get('temp-dir'))) : defaultTempDir,
    reportPath: args.has('report') ? path.resolve(String(args.get('report'))) : defaultReportPath,
    genres: args.has('genres')
      ? String(args.get('genres')).split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    perGenreLimit: args.has('per-genre-limit') ? Number(args.get('per-genre-limit')) : 20,
    searchTimeoutMs: args.has('search-timeout-ms') ? Number(args.get('search-timeout-ms')) : 22000,
    fetchTimeoutMs: args.has('fetch-timeout-ms') ? Number(args.get('fetch-timeout-ms')) : 55000,
    dryRun: args.has('dry-run'),
  }
}

function normalizeKey(value) {
  return String(value ?? '').replace(/\s+/g, '').trim()
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function listExistingSamples(libraryPath, genre) {
  const dir = path.join(libraryPath, '原文样本', genre)
  if (!(await pathExists(dir))) {
    return []
  }

  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt')).map((entry) => entry.name)
}

function candidateAlreadyCollected(candidate, existingFiles) {
  const title = normalizeKey(candidate.bookName)
  const author = normalizeKey(candidate.author)

  return existingFiles.some((fileName) => {
    const normalized = normalizeKey(fileName)
    if (title && normalized.includes(title)) {
      if (!author) {
        return true
      }
      return normalized.includes(author)
    }
    return false
  })
}

async function writeGenreTempFile(tempDir, genre) {
  await fs.mkdir(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${normalizeKey(genre) || 'genre'}.txt`)
  await fs.writeFile(filePath, `${genre}\n`, 'utf8')
  return filePath
}

function extractLastJsonObject(output) {
  const trimmed = output.trim()
  let depth = 0
  let end = -1

  for (let index = trimmed.length - 1; index >= 0; index -= 1) {
    const char = trimmed[index]
    if (char === '}') {
      if (end === -1) {
        end = index + 1
      }
      depth += 1
    } else if (char === '{') {
      depth -= 1
      if (depth === 0 && end !== -1) {
        return trimmed.slice(index, end)
      }
    }
  }

  throw new Error('未能从采集输出中提取 JSON')
}

async function writeBooklist(tempDir, genre, items) {
  await fs.mkdir(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${normalizeKey(genre)}-bulk-booklist.txt`)
  const lines = items.map((item) => item.author ? `${item.bookName}|${item.author}` : item.bookName)
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8')
  return filePath
}

function summarize(result) {
  const summary = {
    genre: result.genre,
    total: 0,
    collected: 0,
    skippedExisting: 0,
    notFound: 0,
    downloadMissing: 0,
    errors: 0,
  }

  for (const item of result.collected ?? []) {
    summary.total += 1
    if (item.status === 'collected') summary.collected += 1
    if (item.status === 'skipped-existing') summary.skippedExisting += 1
    if (item.status === 'not-found') summary.notFound += 1
    if (item.status === 'download-missing') summary.downloadMissing += 1
    if (item.status === 'error') summary.errors += 1
  }

  return summary
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const curated = JSON.parse(await fs.readFile(options.curatedPath, 'utf8'))
  const genreSet = new Set(options.genres.map(normalizeKey))
  const genres = Array.isArray(curated.genres) ? curated.genres.filter((item) => !genreSet.size || genreSet.has(normalizeKey(item.genre))) : []

  if (!genres.length) {
    throw new Error('没有可执行的题材批量采集任务')
  }

  const report = {
    generatedAt: new Date().toISOString(),
    curatedPath: options.curatedPath,
    perGenreLimit: options.perGenreLimit,
    searchTimeoutMs: options.searchTimeoutMs,
    fetchTimeoutMs: options.fetchTimeoutMs,
    runs: [],
  }

  for (const genre of genres) {
    const existingFiles = await listExistingSamples(options.libraryPath, genre.genre)
    const accepted = Array.isArray(genre.accepted) ? genre.accepted : []
    const pendingCandidates = accepted.filter((candidate) => !candidateAlreadyCollected(candidate, existingFiles))
    const candidates = pendingCandidates.slice(0, options.perGenreLimit)
    const genreFile = await writeGenreTempFile(options.tempDir, genre.genre)
    const bookFile = await writeBooklist(options.tempDir, genre.genre, candidates)

    if (options.dryRun) {
      report.runs.push({
        genre: genre.genre,
        acceptedCount: accepted.length,
        existingSampleCount: existingFiles.length,
        pendingCandidateCount: pendingCandidates.length,
        candidateCount: candidates.length,
        preview: candidates.slice(0, 8),
        genreFile,
        bookFile,
        dryRun: true,
      })
      continue
    }

    const output = execFileSync(process.execPath, [
      path.resolve('scripts/collect-sample-books-cli.mjs'),
      '--genre',
      '__FROM_FILE__',
      '--genre-file',
      genreFile,
      '--book-file',
      bookFile,
      '--library',
      options.libraryPath,
      '--bundle',
      options.bundlePath,
      '--sonovel',
      options.sonovelDir,
      '--search-timeout-ms',
      String(options.searchTimeoutMs),
      '--fetch-timeout-ms',
      String(options.fetchTimeoutMs),
      '--skip-refresh',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 32,
    })

    const parsed = JSON.parse(extractLastJsonObject(output))
    report.runs.push({
      genre: genre.genre,
      acceptedCount: accepted.length,
      existingSampleCount: existingFiles.length,
      pendingCandidateCount: pendingCandidates.length,
      candidateCount: candidates.length,
      summary: summarize(parsed),
    })
  }

  if (!options.dryRun) {
    execFileSync(process.execPath, [
      path.resolve('scripts/analyze-sample-fingerprints-cli.mjs'),
      '--library',
      options.libraryPath,
      '--bundle',
      options.bundlePath,
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    execFileSync(process.execPath, [
      path.resolve('scripts/build-fingerprint-growth-report.mjs'),
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })
  }

  await fs.mkdir(path.dirname(options.reportPath), { recursive: true })
  await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
