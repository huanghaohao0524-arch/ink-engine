import fs from 'node:fs/promises'
import path from 'node:path'

const defaultInputPath = path.resolve('build/writing-fingerprints/discovered-book-candidates.json')
const defaultOutputPath = path.resolve('build/writing-fingerprints/curated-book-candidates.json')
const defaultBooklistDir = path.resolve('build/writing-fingerprints/booklists/curated')

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  return {
    inputPath: args.has('input') ? path.resolve(String(args.get('input'))) : defaultInputPath,
    outputPath: args.has('output') ? path.resolve(String(args.get('output'))) : defaultOutputPath,
    booklistDir: args.has('booklist-dir') ? path.resolve(String(args.get('booklist-dir'))) : defaultBooklistDir,
  }
}

function normalize(value) {
  return String(value ?? '').trim()
}

function safeFileSegment(value) {
  return normalize(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-')
}

function scoreByRegex(text, regexes) {
  return regexes.reduce((score, regex) => score + (regex.test(text) ? 1 : 0), 0)
}

function buildGenreRules() {
  return {
    网游: {
      include: [/网游/, /电竞/, /联盟/, /虚拟/, /公会/, /副本/, /游戏/],
      titleBoost: [/网游之/, /全职高手/, /联盟之/, /电竞/, /高手/],
      exclude: [/言情/, /耽美/, /古言/, /都市言情/, /侦探/, /悬疑/, /校园/, /总裁/],
      titleExclude: [/别玩网游/, /网游校园/],
      minScore: 2,
    },
    都市: {
      include: [/都市/, /官场/, /神豪/, /兵王/, /神医/, /相师/, /鉴宝/, /明星/, /校园/, /商途/],
      titleBoost: [/都市之/, /官场/, /神豪/, /兵王/, /黄金瞳/, /校花/, /相师/, /首席/, /重生完美时代/],
      exclude: [/古言/, /网游/, /玄幻/, /仙侠/, /侦探/, /灵异/, /耽美/],
      titleExclude: [/重生之贼行天下/, /深渊主宰/, /网游/],
      minScore: 2,
    },
    玄幻: {
      include: [/玄幻/, /奇幻/, /修真/, /修仙/, /仙侠/, /武侠修真/, /东方玄幻/, /异界/],
      titleBoost: [/凡人修仙传/, /一念永恒/, /仙逆/, /大梦主/, /三寸人间/, /玄幻模拟器/],
      exclude: [/都市/, /言情/, /耽美/, /侦探推理/],
      titleExclude: [/网游/, /校园/],
      minScore: 2,
      minTitleLength: 3,
      requireStrongTitleToken: true,
      strongTitleTokens: [/仙/, /神/, /魔/, /帝/, /皇/, /尊/, /圣/, /荒/, /穹/, /宙/, /天/, /道/, /剑/, /龙/, /凰/, /墓/, /墟/, /宰/, /变/, /纪/, /界/, /宗/, /门/],
    },
    悬疑: {
      include: [/悬疑/, /侦探推理/, /灵异/, /推理/, /刑侦/, /法医/, /惊悚/],
      titleBoost: [/法医秦明/, /心理罪/, /尸语者/, /无声的证词/, /第十一根手指/, /守夜者/, /第四种推理/, /刑侦/, /悬疑/, /推理/],
      exclude: [/古言/, /耽美/, /都市言情/, /玄幻魔法/, /游戏动漫/],
      titleExclude: [/网游/, /校园/, /联盟/],
      minScore: 2,
    },
    古言: {
      include: [/古言/, /女生/, /历史穿越/, /宫廷/, /宅斗/, /侯门/, /权谋/],
      titleBoost: [/嫡/, /庶/, /妃/, /郡主/, /簪/, /锦/, /春/, /闺/, /侯门/, /将门/, /王妃/, /掌家/, /长公主/],
      exclude: [/都市/, /网游/, /玄幻/, /仙侠/, /侦探/, /耽美/],
      titleExclude: [/重生之神级败家/, /重生之投资/, /重生之医行天下/, /重生之贼行天下/],
      minScore: 2,
    },
  }
}

function curateCandidate(genre, item, rules) {
  const title = normalize(item.bookName)
  const author = normalize(item.author)
  const category = normalize(item.category)
  const sourceName = normalize(item.sourceName)
  const text = `${title} ${author} ${category} ${sourceName}`
  const genreRule = rules[genre]

  if (!genreRule) {
    return { accepted: false, reason: 'missing-rule', score: 0 }
  }

  if (genreRule.titleExclude.some((regex) => regex.test(title))) {
    return { accepted: false, reason: 'title-excluded', score: 0 }
  }

  if (genreRule.exclude.some((regex) => regex.test(text)) && !genreRule.titleBoost.some((regex) => regex.test(title))) {
    return { accepted: false, reason: 'category-excluded', score: 0 }
  }

  if (genreRule.minTitleLength && title.length < genreRule.minTitleLength) {
    return { accepted: false, reason: 'title-too-short', score: 0 }
  }

  if (genreRule.requireStrongTitleToken && Array.isArray(genreRule.strongTitleTokens)) {
    const hasStrongToken = genreRule.strongTitleTokens.some((regex) => regex.test(title))
    const hasStrongCategory = genreRule.include.some((regex) => regex.test(category))
    if (!hasStrongToken && !hasStrongCategory) {
      return { accepted: false, reason: 'missing-strong-title-token', score: 0 }
    }
  }

  const score = scoreByRegex(text, genreRule.include) + scoreByRegex(title, genreRule.titleBoost)
  if (score < genreRule.minScore) {
    return { accepted: false, reason: 'low-score', score }
  }

  return {
    accepted: true,
    reason: 'accepted',
    score,
    candidate: {
      bookName: title,
      author,
      category,
      sourceName,
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const input = JSON.parse(await fs.readFile(options.inputPath, 'utf8'))
  const rules = buildGenreRules()
  const output = {
    generatedAt: new Date().toISOString(),
    sourcePath: options.inputPath,
    genres: [],
  }

  await fs.mkdir(options.booklistDir, { recursive: true })

  for (const genre of input.genres ?? []) {
    const accepted = []
    const rejected = []
    const seen = new Set()

    for (const item of genre.discovered ?? []) {
      const result = curateCandidate(genre.genre, item, rules)
      if (!result.accepted) {
        rejected.push({
          ...item,
          reason: result.reason,
          score: result.score,
        })
        continue
      }

      const key = `${result.candidate.bookName}|${result.candidate.author}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      accepted.push({
        ...result.candidate,
        score: result.score,
      })
    }

    accepted.sort((a, b) => b.score - a.score || a.bookName.localeCompare(b.bookName, 'zh-CN'))
    const lines = accepted.map((item) => item.author ? `${item.bookName}|${item.author}` : item.bookName)
    const fileName = `${safeFileSegment(genre.genre)}-candidates.txt`
    const booklistPath = path.join(options.booklistDir, fileName)
    await fs.writeFile(booklistPath, `${lines.join('\n')}\n`, 'utf8')

    output.genres.push({
      genre: genre.genre,
      existingSampleCount: genre.existingSampleCount,
      targetSampleCount: genre.targetSampleCount,
      remainingToTarget: genre.remainingToTarget,
      discoveryKeywords: genre.discoveryKeywords ?? [],
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      booklistPath,
      accepted,
      rejected: rejected.slice(0, 80),
    })
  }

  await fs.writeFile(options.outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(output, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
