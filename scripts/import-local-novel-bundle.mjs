import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_SOURCE_ROOT = 'F:/BaiduNetdiskDownload/起点爆款小说汇总+小说超级合集 11.8G'
const DEFAULT_LIBRARY_ROOT = 'D:/ai/写作/写作样本库'
const DEFAULT_MANIFEST_PATH = 'build/writing-fingerprints/local-bundle-import-manifest.json'

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.epub', '.mobi'])

const GENRE_RULES = [
  {
    genre: '网游',
    tests: [
      /^游戏竞技[\\/](虚拟网游|游戏生涯|电子竞技)/,
      /^游戏竞技/,
    ],
  },
  {
    genre: '玄幻',
    tests: [
      /^玄幻奇幻/,
      /^武侠仙侠[\\/](古典仙侠|奇幻修真|现代修真|洪荒封神|传统武侠|国术武技)/,
    ],
  },
  {
    genre: '都市',
    tests: [
      /^现代都市/,
    ],
  },
  {
    genre: '悬疑',
    tests: [
      /^科幻灵异/,
    ],
  },
  {
    genre: '古言',
    tests: [
      /^女频言情[\\/](古代言情|穿越架空|宫闱情仇)/,
    ],
  },
]

function parseArgs(argv) {
  const args = new Map()

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true)
    }
  }

  return {
    sourceRoot: path.resolve(String(args.get('source') ?? DEFAULT_SOURCE_ROOT)),
    libraryRoot: path.resolve(String(args.get('library') ?? DEFAULT_LIBRARY_ROOT)),
    manifestPath: path.resolve(String(args.get('manifest') ?? DEFAULT_MANIFEST_PATH)),
    limit: args.has('limit') ? Number(args.get('limit')) : 0,
    dryRun: args.has('dry-run'),
  }
}

function normalizeSlashes(value) {
  return String(value ?? '').replace(/[\\/]+/g, '/')
}

function inferGenre(relativeDir) {
  const normalized = normalizeSlashes(relativeDir)
  for (const rule of GENRE_RULES) {
    if (rule.tests.some((pattern) => pattern.test(normalized))) {
      return rule.genre
    }
  }
  return ''
}

function parseMetaFromFileName(fileName) {
  const base = fileName.replace(/\.(txt|epub|mobi)$/i, '').trim()
  const bracketAuthor = base.match(/^《(.+?)》作者[:：]\s*(.+)$/)
  if (bracketAuthor) {
    return {
      title: bracketAuthor[1].trim(),
      author: bracketAuthor[2].trim(),
    }
  }

  const dashAuthor = base.match(/^(.+?)[-_—–]\s*([^_—–-]{1,40})$/)
  if (dashAuthor) {
    return {
      title: dashAuthor[1].trim(),
      author: dashAuthor[2].trim(),
    }
  }

  return {
    title: base,
    author: '',
  }
}

async function walkFiles(root) {
  const files = []
  const queue = [root]

  while (queue.length > 0) {
    const current = queue.shift()
    const entries = await fs.readdir(current, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        queue.push(fullPath)
        continue
      }

      if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath)
      }
    }
  }

  return files
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const sourceFiles = await walkFiles(options.sourceRoot)
  const items = []

  for (const fullPath of sourceFiles) {
    const relativePath = path.relative(options.sourceRoot, fullPath)
    const relativeDir = path.dirname(relativePath)
    const genre = inferGenre(relativeDir)
    if (!genre) {
      continue
    }

    const { title, author } = parseMetaFromFileName(path.basename(fullPath))
    items.push({
      sourcePath: fullPath,
      relativePath,
      relativeDir,
      sourceExtension: path.extname(fullPath).toLowerCase(),
      genre,
      title,
      author,
    })
  }

  const selected = options.limit > 0 ? items.slice(0, options.limit) : items
  const grouped = Object.fromEntries(
    ['网游', '玄幻', '都市', '悬疑', '古言'].map((genre) => [
      genre,
      selected.filter((item) => item.genre === genre).length,
    ]),
  )

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: options.sourceRoot,
    libraryRoot: options.libraryRoot,
    totalSourceFiles: sourceFiles.length,
    matchedItems: items.length,
    items: selected,
    countsByGenre: grouped,
  }

  await fs.mkdir(path.dirname(options.manifestPath), { recursive: true })
  await fs.writeFile(options.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    generatedAt: manifest.generatedAt,
    sourceRoot: manifest.sourceRoot,
    totalSourceFiles: manifest.totalSourceFiles,
    matchedItems: manifest.matchedItems,
    selectedItems: manifest.items.length,
    countsByGenre: manifest.countsByGenre,
    manifestPath: options.manifestPath,
    dryRun: options.dryRun,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
