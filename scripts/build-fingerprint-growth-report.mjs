import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_LIBRARY = 'D:/ai/写作/写作样本库'
const DEFAULT_PLAN_PATH = 'build/writing-fingerprints/genre-growth-plan.json'
const DEFAULT_OUTPUT_PATH = 'build/writing-fingerprints/latest-growth-report.json'
const DEFAULT_MARKDOWN_PATH = 'build/writing-fingerprints/latest-growth-report.md'

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  return {
    libraryPath: path.resolve(String(args.get('library') ?? DEFAULT_LIBRARY)),
    planPath: path.resolve(String(args.get('plan') ?? DEFAULT_PLAN_PATH)),
    outputPath: path.resolve(String(args.get('output') ?? DEFAULT_OUTPUT_PATH)),
    markdownPath: path.resolve(String(args.get('markdown') ?? DEFAULT_MARKDOWN_PATH)),
  }
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function listSampleFiles(dirPath) {
  if (!(await pathExists(dirPath))) {
    return []
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
    .map((entry) => entry.name)
}

function titleMatches(fileName, patterns) {
  return patterns.some((pattern) => fileName.includes(pattern))
}

function buildMarkdown(report) {
  const lines = [
    '# 题材样本扩容报告',
    '',
    `- 生成时间：${report.generatedAt}`,
    `- 大题材目标：${report.genreTargetSampleCount} 本`,
    `- 子题材目标：${report.subgenreTargetSampleCount} 本`,
    '',
  ]

  for (const genre of report.genres) {
    lines.push(`## ${genre.genre}`)
    lines.push(`- 样本库文件数：${genre.currentSampleCount}`)
    lines.push(`- 有效指纹样本数：${genre.fingerprint?.sampleCount ?? 0}`)
    lines.push(`- 去重后样本数：${genre.fingerprint?.uniqueHashCount ?? 0}`)
    lines.push(`- 重复样本数：${genre.fingerprint?.duplicateFileCount ?? 0}`)
    lines.push(`- 距离大题材目标还差：${genre.remainingToGenreTarget}`)
    lines.push(`- 当前章节数：${genre.fingerprint?.chapterCount ?? 0}`)
    lines.push(`- 当前信号密度：${genre.fingerprint?.signalPer10k ?? 0}`)
    lines.push('')

    for (const subgenre of genre.subgenres) {
      lines.push(`### ${subgenre.name}`)
      lines.push(`- 当前样本：${subgenre.currentSampleCount}`)
      lines.push(`- 距离子题材目标还差：${subgenre.remainingToTarget}`)
      lines.push(`- 已命中样本：${subgenre.matchedSamples.join('、') || '暂无'}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const plan = JSON.parse(await fs.readFile(options.planPath, 'utf8'))
  const genreIndexPath = path.join(options.libraryPath, '题材指纹', 'genre-index.json')
  const genreIndex = JSON.parse(await fs.readFile(genreIndexPath, 'utf8'))
  const fingerprintByGenre = new Map((genreIndex.genres ?? []).map((item) => [item.genre, item]))

  const genres = []

  for (const genrePlan of plan.genres ?? []) {
    const sampleDir = path.join(options.libraryPath, '原文样本', genrePlan.genre)
    const sampleFiles = await listSampleFiles(sampleDir)
    const fingerprint = fingerprintByGenre.get(genrePlan.genre) ?? null

    const subgenres = (genrePlan.subgenres ?? []).map((subgenre) => {
      const matchedSamples = sampleFiles.filter((file) => titleMatches(file, subgenre.sampleTitlePatterns ?? []))
      const currentSampleCount = matchedSamples.length

      return {
        name: subgenre.name,
        targetSampleCount: plan.subgenreTargetSampleCount,
        currentSampleCount,
        remainingToTarget: Math.max(0, plan.subgenreTargetSampleCount - currentSampleCount),
        matchedSamples,
      }
    })

    genres.push({
      genre: genrePlan.genre,
      targetSampleCount: plan.genreTargetSampleCount,
      currentSampleCount: sampleFiles.length,
      remainingToGenreTarget: Math.max(0, plan.genreTargetSampleCount - sampleFiles.length),
      fingerprint: fingerprint ? {
        sampleCount: fingerprint.sampleCount,
        chapterCount: fingerprint.chapterCount,
        signalLabel: fingerprint.signalLabel,
        signalPer10k: fingerprint.signalPer10k ?? 0,
        progressionPer10k: fingerprint.progressionPer10k,
        uniqueHashCount: fingerprint.uniqueHashCount ?? 0,
        duplicateFileCount: fingerprint.duplicateFileCount ?? 0,
      } : null,
      subgenres,
    })
  }

  const report = {
    generatedAt: new Date().toISOString(),
    genreTargetSampleCount: plan.genreTargetSampleCount,
    subgenreTargetSampleCount: plan.subgenreTargetSampleCount,
    genres,
  }

  await fs.mkdir(path.dirname(options.outputPath), { recursive: true })
  await fs.writeFile(options.outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(options.markdownPath, `${buildMarkdown(report)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
