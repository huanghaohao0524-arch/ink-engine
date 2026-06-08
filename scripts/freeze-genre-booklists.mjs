import fs from 'node:fs/promises'
import path from 'node:path'

const defaultCuratedPath = path.resolve('build/writing-fingerprints/curated-book-candidates.json')
const defaultOutputDir = path.resolve('build/writing-fingerprints/booklists/frozen')
const defaultManifestPath = path.resolve('build/writing-fingerprints/frozen-booklists-manifest.json')

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
    outputDir: args.has('output-dir') ? path.resolve(String(args.get('output-dir'))) : defaultOutputDir,
    manifestPath: args.has('manifest') ? path.resolve(String(args.get('manifest'))) : defaultManifestPath,
    genres: args.has('genres')
      ? String(args.get('genres')).split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    limit: args.has('limit') ? Number(args.get('limit')) : 0,
  }
}

function normalizeKey(value) {
  return String(value ?? '').replace(/\s+/g, '').trim()
}

function safeFileSegment(value) {
  return String(value ?? '').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const curated = JSON.parse(await fs.readFile(options.curatedPath, 'utf8'))
  const genreSet = new Set(options.genres.map(normalizeKey))
  const genres = Array.isArray(curated.genres) ? curated.genres.filter((item) => !genreSet.size || genreSet.has(normalizeKey(item.genre))) : []

  if (!genres.length) {
    throw new Error('没有可冻结的题材书单')
  }

  await fs.mkdir(options.outputDir, { recursive: true })
  const manifest = {
    generatedAt: new Date().toISOString(),
    curatedPath: options.curatedPath,
    outputDir: options.outputDir,
    genres: [],
  }

  for (const genre of genres) {
    const accepted = Array.isArray(genre.accepted) ? genre.accepted : []
    const selected = options.limit > 0 ? accepted.slice(0, options.limit) : accepted
    const fileName = `${safeFileSegment(genre.genre)}-frozen.txt`
    const filePath = path.join(options.outputDir, fileName)
    const lines = selected.map((item) => item.author ? `${item.bookName}|${item.author}` : item.bookName)
    await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8')

    manifest.genres.push({
      genre: genre.genre,
      acceptedCount: accepted.length,
      frozenCount: selected.length,
      filePath,
    })
  }

  await fs.writeFile(options.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(manifest, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
