import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const defaultPlanPath = path.resolve('build/writing-fingerprints/genre-growth-plan.json')
const defaultLibrary = path.resolve('D:/ai/写作/写作样本库')
const defaultOutputPath = path.resolve('build/writing-fingerprints/discovered-book-candidates.json')
const defaultSonovelDir = path.resolve('artifacts/sonovel-v1.10.1/SoNovel')
const searchLimit = 30
const port = 7765

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  return {
    planPath: args.has('plan') ? path.resolve(String(args.get('plan'))) : defaultPlanPath,
    libraryPath: args.has('library') ? path.resolve(String(args.get('library'))) : defaultLibrary,
    outputPath: args.has('output') ? path.resolve(String(args.get('output'))) : defaultOutputPath,
    sonovelDir: args.has('sonovel') ? path.resolve(String(args.get('sonovel'))) : defaultSonovelDir,
  }
}

async function requestJson(url, timeoutMs = 90000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    return await response.json()
  } finally {
    clearTimeout(timer)
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

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
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
    // Start below.
  }

  spawn(exe, {
    cwd: sonovelDir,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  }).unref()

  for (let index = 0; index < 20; index += 1) {
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

async function listExistingSampleNames(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt')).map((entry) => entry.name)
  } catch {
    return []
  }
}

function normalizeName(value) {
  return String(value ?? '').replace(/\s+/g, '').trim()
}

function isLikelyRelevant(genre, item) {
  const text = `${item.bookName ?? ''} ${item.author ?? ''} ${item.category ?? ''}`

  if (genre === '网游') {
    return /网游|电竞|游戏|竞技|虚拟|联盟/.test(text)
  }
  if (genre === '都市') {
    return /都市|校园|官场|神豪|相师|兵王|明星|商途|重生/.test(text)
  }
  if (genre === '玄幻') {
    return /玄幻|奇幻|修真|修仙|仙侠|东方玄幻|异界/.test(text)
  }
  if (genre === '悬疑') {
    return /悬疑|推理|刑侦|灵异|惊悚|罪|法医/.test(text)
  }
  if (genre === '古言') {
    return /古代|古言|宫廷|宅斗|侯门|权谋|穿越|重生/.test(text)
  }

  return true
}

function isDuplicateCandidate(candidate, existingSamples, seenKeys) {
  const key = `${candidate.bookName}|${candidate.author}`
  if (seenKeys.has(key)) {
    return true
  }

  const existing = existingSamples.some((name) => name.includes(candidate.bookName) || (candidate.author && name.includes(candidate.author)))
  return existing
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const plan = JSON.parse(await fs.readFile(options.planPath, 'utf8'))
  await ensureSonovelWeb(options.sonovelDir)
  const result = {
    generatedAt: new Date().toISOString(),
    genreTargetSampleCount: plan.genreTargetSampleCount,
    genres: [],
  }

  for (const genrePlan of plan.genres ?? []) {
    const existingSamples = await listExistingSampleNames(path.join(options.libraryPath, '原文样本', genrePlan.genre))
    const seenKeys = new Set()
    const discovered = []
    const discoveryKeywords = Array.isArray(genrePlan.discoveryKeywords) && genrePlan.discoveryKeywords.length
      ? genrePlan.discoveryKeywords
      : [genrePlan.genre]

    for (const keyword of discoveryKeywords) {
      const url = `http://127.0.0.1:${port}/search/aggregated?kw=${encodeURIComponent(keyword)}&searchLimit=${searchLimit}`
      let data = []
      try {
        const json = await requestJson(url)
        data = Array.isArray(json?.data) ? json.data : []
      } catch (error) {
        throw new Error(`关键词搜索失败: ${genrePlan.genre} / ${keyword} / ${error instanceof Error ? error.message : String(error)}`)
      }

      for (const item of data) {
        const candidate = {
          bookName: normalizeName(item.bookName),
          author: normalizeName(item.author),
          category: normalizeName(item.category),
          sourceName: normalizeName(item.sourceName),
        }

        if (!candidate.bookName || !isLikelyRelevant(genrePlan.genre, item)) {
          continue
        }

        if (isDuplicateCandidate(candidate, existingSamples, seenKeys)) {
          continue
        }

        seenKeys.add(`${candidate.bookName}|${candidate.author}`)
        discovered.push(candidate)
      }
    }

    result.genres.push({
      genre: genrePlan.genre,
      existingSampleCount: existingSamples.length,
      targetSampleCount: plan.genreTargetSampleCount,
      remainingToTarget: Math.max(0, plan.genreTargetSampleCount - existingSamples.length),
      discoveredCount: discovered.length,
      discovered: discovered.slice(0, 300),
      discoveryKeywords,
    })
  }

  await fs.mkdir(path.dirname(options.outputPath), { recursive: true })
  await fs.writeFile(options.outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
