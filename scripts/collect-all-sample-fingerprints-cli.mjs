import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const defaultLibrary = path.resolve('D:/ai/写作/写作样本库')
const defaultBundle = path.resolve('build/writing-fingerprints')
const defaultSonovelDir = path.resolve('artifacts/sonovel-v1.10.1/SoNovel')
const defaultManifest = path.resolve('build/writing-fingerprints/genre-collection-manifest.json')
const defaultReportPath = path.resolve('build/writing-fingerprints/latest-collection-report.json')
const defaultTempDir = path.resolve('build/writing-fingerprints/tmp')

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  if (args.has('help')) {
    console.log('Usage: node scripts/collect-all-sample-fingerprints-cli.mjs [--manifest <path>] [--library <path>] [--bundle <path>] [--sonovel <path>] [--genres <题材1,题材2>] [--dry-run]')
    process.exit(0)
  }

  return {
    manifestPath: args.has('manifest') ? path.resolve(String(args.get('manifest'))) : defaultManifest,
    libraryPath: args.has('library') ? path.resolve(String(args.get('library'))) : defaultLibrary,
    bundlePath: args.has('bundle') ? path.resolve(String(args.get('bundle'))) : defaultBundle,
    sonovelDir: args.has('sonovel') ? path.resolve(String(args.get('sonovel'))) : defaultSonovelDir,
    reportPath: args.has('report') ? path.resolve(String(args.get('report'))) : defaultReportPath,
    tempDir: args.has('temp-dir') ? path.resolve(String(args.get('temp-dir'))) : defaultTempDir,
    selectedGenres: args.has('genres')
      ? String(args.get('genres')).split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    dryRun: args.has('dry-run'),
  }
}

async function readManifest(manifestPath) {
  const content = await fs.readFile(manifestPath, 'utf8')
  const parsed = JSON.parse(content)
  const genres = Array.isArray(parsed?.genres) ? parsed.genres : []

  return genres
    .map((item) => ({
      genre: String(item.genre ?? '').trim(),
      bookFile: String(item.bookFile ?? '').trim(),
      enabled: item.enabled !== false,
      limit: Number(item.limit ?? 0),
      searchTimeoutMs: Number(item.searchTimeoutMs ?? 90000),
      fetchTimeoutMs: Number(item.fetchTimeoutMs ?? 240000),
    }))
    .filter((item) => item.genre && item.bookFile && item.enabled)
}

function normalizeGenreKey(value) {
  return String(value ?? '').replace(/\s+/g, '').trim()
}

async function readGenreIndex(libraryPath) {
  const indexPath = path.join(libraryPath, '题材指纹', 'genre-index.json')
  const content = await fs.readFile(indexPath, 'utf8')
  return JSON.parse(content)
}

async function writeGenreTempFile(tempDir, genre) {
  await fs.mkdir(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${normalizeGenreKey(genre) || 'genre'}.txt`)
  await fs.writeFile(filePath, `${genre}\n`, 'utf8')
  return filePath
}

function runCollect({ genre, genreFile, bookFile, libraryPath, bundlePath, sonovelDir, limit, searchTimeoutMs, fetchTimeoutMs }) {
  const args = [
    path.resolve('scripts/collect-sample-books-cli.mjs'),
    '--genre',
    '__FROM_FILE__',
    '--genre-file',
    genreFile,
    '--book-file',
    bookFile,
    '--library',
    libraryPath,
    '--bundle',
    bundlePath,
    '--sonovel',
    sonovelDir,
    '--search-timeout-ms',
    String(searchTimeoutMs),
    '--fetch-timeout-ms',
    String(fetchTimeoutMs),
  ]

  if (limit > 0) {
    args.push('--limit', String(limit))
  }

  const output = execFileSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  })

  const jsonText = extractLastJsonObject(output)
  return JSON.parse(jsonText)
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

  throw new Error('未能从子任务输出中提取 JSON 结果')
}

function summarizeCollected(result) {
  const summary = {
    genre: result.genre,
    total: 0,
    collected: 0,
    skippedExisting: 0,
    notFound: 0,
    downloadMissing: 0,
    errors: 0,
  }

  for (const item of Array.isArray(result.collected) ? result.collected : []) {
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
  const manifestItems = await readManifest(options.manifestPath)
  const selectedGenreSet = new Set(options.selectedGenres.map(normalizeGenreKey))
  const selected = selectedGenreSet.size
    ? manifestItems.filter((item) => selectedGenreSet.has(normalizeGenreKey(item.genre)))
    : manifestItems

  if (!selected.length) {
    throw new Error('没有可执行的题材任务')
  }

  if (options.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      manifestPath: options.manifestPath,
      libraryPath: options.libraryPath,
      bundlePath: options.bundlePath,
      sonovelDir: options.sonovelDir,
      reportPath: options.reportPath,
      genres: selected,
    }, null, 2))
    return
  }

  const startedAt = new Date().toISOString()
  const collectedRuns = []
  const errors = []

  for (const item of selected) {
    try {
      const genreFile = await writeGenreTempFile(options.tempDir, item.genre)
      const result = runCollect({
        genre: item.genre,
        genreFile,
        bookFile: path.resolve(item.bookFile),
        libraryPath: options.libraryPath,
        bundlePath: options.bundlePath,
        sonovelDir: options.sonovelDir,
        limit: item.limit,
        searchTimeoutMs: item.searchTimeoutMs,
        fetchTimeoutMs: item.fetchTimeoutMs,
      })
      collectedRuns.push(summarizeCollected(result))
    } catch (error) {
      errors.push({
        genre: item.genre,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const index = await readGenreIndex(options.libraryPath)
  const fingerprintOverview = Array.isArray(index?.genres)
    ? index.genres.map((item) => ({
      genre: item.genre,
      sampleCount: item.sampleCount,
      chapterCount: item.chapterCount,
      totalChars: item.totalChars,
      avgChapterChars: item.avgChapterChars,
      signalLabel: item.signalLabel,
      signalPer10k: item.signalPer10k ?? item.gameSignalPer10k,
      progressionPer10k: item.progressionPer10k,
    }))
    : []

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    manifestPath: options.manifestPath,
    libraryPath: options.libraryPath,
    bundlePath: options.bundlePath,
    reportPath: options.reportPath,
    collectedRuns,
    errors,
    fingerprintOverview,
  }

  await fs.mkdir(path.dirname(options.reportPath), { recursive: true })
  await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
