import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { TextDecoder } from 'node:util'

const names = {
  rawSamples: '原文样本',
  genreFingerprints: '题材指纹',
}

const minSampleChapters = 20
const maxSamplesPerGenre = 120
const maxChaptersPerSample = 260

const genreProfiles = {
  网游: {
    label: '网游信号',
    mustKeepTitle: '必保留信号',
    signalTerms: [
      '系统', '任务', '等级', '经验', '技能', '装备', '玩家', 'NPC', '副本', '公会',
      '排行榜', '属性', '血量', '蓝量', 'boss', 'BOSS', '隐藏职业', '转职', '掉落',
      '金币', '服务器', '公告', 'PK', '竞技', '坐标', '地图', '怪物', '仇恨',
      '冷却', 'CD', '面板', '背包', '主城', '新手村', '队伍', '好友', '论坛',
    ],
    progressionTerms: [
      '升级', '获得', '触发', '完成', '奖励', '扣除', '解锁', '激活', '刷新',
      '掉落', '转职', '加点', '强化', '进阶', '击杀', '首杀', '通关',
    ],
    mustKeepSignals: '系统、任务、经验、等级、技能、装备、玩家、NPC、副本、公会、公告、世界频道。',
    signalAdvice: '每章至少出现一次可感知的游戏状态变化，不能只写武侠动作或现实闲聊。',
    antiAiAdvice: [
      '不要只有“获得能力”而没有代价、反馈、旁观者反应。',
      '不要只复述设定，题材信号必须落成任务、战斗、交易、公告、面板变化或玩家互动。',
    ],
  },
  都市: {
    label: '都市信号',
    mustKeepTitle: '必保留信号',
    signalTerms: [
      '公司', '集团', '总裁', '项目', '合同', '秘书', '董事会', '办公室', '资本', '融资',
      '别墅', '豪车', '宴会', '酒会', '校花', '保镖', '神医', '赌石', '古玩', '豪门',
      '医院', '警局', '家族', '同学会', '直播', '热搜', '打脸', '逆袭', '圈子', '资源',
    ],
    progressionTerms: [
      '签约', '拿下', '收购', '投资', '升职', '翻盘', '逆转', '曝光', '打脸', '破局',
      '救下', '确诊', '治好', '拜师', '入局', '布局', '联手', '碾压',
    ],
    mustKeepSignals: '身份差、资源落差、现实场景、圈层压力、利益交换、打脸反馈。',
    signalAdvice: '每章都要让主角在现实秩序里推进一步，不能只有空泛装逼和自夸。',
    antiAiAdvice: [
      '不要把都市文写成大段宣言，现实冲突要落到人和场景。',
      '不要只有主角内心独白，必须有人际反馈、身份落差和现实后果。',
    ],
  },
  玄幻: {
    label: '玄幻信号',
    mustKeepTitle: '必保留信号',
    signalTerms: [
      '灵力', '灵气', '斗气', '真气', '元力', '魂力', '境界', '功法', '武技', '神通',
      '丹药', '法宝', '异火', '血脉', '宗门', '长老', '圣地', '秘境', '妖兽', '天劫',
      '传承', '本源', '仙府', '魔气', '炼体', '阵法', '禁地', '道心', '悟性', '机缘',
    ],
    progressionTerms: [
      '突破', '晋级', '领悟', '炼化', '吞噬', '觉醒', '淬炼', '渡劫', '收服', '斩杀',
      '镇压', '传承', '出关', '开窍', '筑基', '凝丹', '封王', '封皇',
    ],
    mustKeepSignals: '境界差、修炼资源、传承机缘、宗门秩序、秘境风险、战力反馈。',
    signalAdvice: '每章都要体现修炼体系的具体变化，不能只剩嘴炮和世界观说明。',
    antiAiAdvice: [
      '不要把玄幻文写成设定说明书，修炼体系要落在动作、资源、压制与反制中。',
      '不要空喊“气势惊人”“天地变色”，要给出可感知的代价、异象和对手反应。',
    ],
  },
  悬疑: {
    label: '悬疑信号',
    mustKeepTitle: '必保留信号',
    signalTerms: [
      '命案', '尸体', '凶手', '作案', '现场', '法医', '刑警', '线索', '嫌疑人', '证据',
      '监控', '口供', '审讯', '推理', '不在场证明', '指纹', '血迹', '卷宗', '专案组', '死者',
      '目击者', '失踪', '报警', '谜团', '动机', '警局', '尸检', '排查', '真相', '破案',
    ],
    progressionTerms: [
      '发现', '锁定', '排除', '比对', '还原', '追查', '审出', '证实', '推翻', '突破',
      '指向', '确认', '复盘', '结案', '逮捕', '抓获', '坦白', '揭开',
    ],
    mustKeepSignals: '案发现场、线索链、嫌疑排查、证据推进、认知反转、真相逼近。',
    signalAdvice: '每章都要推动案情，不要只有气氛和故弄玄虚，必须落一条新线索、一个新矛盾或一次旧判断翻案。',
    antiAiAdvice: [
      '不要只用抽象心理描写制造悬疑，必须让证据和现场说话。',
      '不要让角色突然知道答案，推理链必须可回溯、有证据支撑。',
    ],
  },
  古言: {
    label: '古言信号',
    mustKeepTitle: '必保留信号',
    signalTerms: [
      '侯府', '王爷', '嫡女', '庶女', '老夫人', '姨娘', '嬷嬷', '院子', '闺阁', '婚约',
      '赐婚', '退婚', '圣旨', '宫宴', '太后', '皇后', '后宅', '掌家', '嫁妆', '中馈',
      '宅斗', '权谋', '入宫', '外祖家', '世子', '侧妃', '正妃', '抄家', '流放', '府里',
    ],
    progressionTerms: [
      '赐下', '入府', '掌家', '退婚', '翻案', '抬举', '罚跪', '请安', '入宫', '定亲',
      '封赏', '处置', '发落', '赐死', '洗清', '出阁', '回门', '算计',
    ],
    mustKeepSignals: '身份礼制、后宅权力、婚嫁绑定、家族利益、明争暗斗、名分反馈。',
    signalAdvice: '每章都要让人物在礼法和权力结构里推进一步，不能只剩古风对白和空泛虐恋。',
    antiAiAdvice: [
      '不要把古言写成现代对白换古称，礼法、称谓、处置逻辑要落地。',
      '不要只写情绪拉扯，必须让后宅、家族、婚嫁、权力结构产生后果。',
    ],
  },
}

const defaultProfile = {
  label: '题材信号',
  mustKeepTitle: '必保留信号',
  signalTerms: ['冲突', '目标', '身份', '危险', '计划', '代价', '选择', '资源'],
  progressionTerms: ['获得', '失去', '完成', '触发', '推进', '升级', '突破', '揭开'],
  mustKeepSignals: '题材核心设定、冲突推进、人物反应、状态变化。',
  signalAdvice: '每章都要体现题材专属状态变化，不能只靠空泛叙述撑字数。',
  antiAiAdvice: [
    '不要把题材写成概述，必须让设定落成情节结果。',
    '不要只写主角心里想了什么，要给出外部反馈和局面变化。',
  ],
}

function parseArgs(argv) {
  const args = new Map()

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
    }
  }

  if (args.has('help') || !args.has('library')) {
    console.log('Usage: node scripts/analyze-sample-fingerprints-cli.mjs --library <libraryPath> [--bundle <softwareFingerprintPath>] [--source <rawSamplePath>]')
    process.exit(args.has('help') ? 0 : 1)
  }

  const libraryPath = path.resolve(String(args.get('library')))

  return {
    libraryPath,
    bundlePath: args.has('bundle') ? path.resolve(String(args.get('bundle'))) : '',
    sourcePath: args.has('source')
      ? path.resolve(String(args.get('source')))
      : path.join(libraryPath, names.rawSamples),
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

async function collectFiles(rootPath) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const child = path.join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(child))
    } else if (entry.isFile() && /\.(txt|md)$/i.test(entry.name)) {
      files.push(child)
    }
  }

  return files
}

function scoreDecodedText(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
  const bad = [...text].filter((char) => char.charCodeAt(0) === 0xfffd).length
  return cjk - bad * 20
}

function decodeText(buffer) {
  const utf8 = buffer.toString('utf8')
  let gb18030 = ''

  try {
    gb18030 = new TextDecoder('gb18030').decode(buffer)
  } catch {
    gb18030 = ''
  }

  return scoreDecodedText(gb18030) > scoreDecodedText(utf8) * 1.08 ? gb18030 : utf8
}

function inferGenre(rootPath, filePath) {
  const relative = path.relative(rootPath, filePath)
  const parts = relative.split(path.sep).filter(Boolean)

  return {
    genre: parts.length >= 2 ? parts[0] : '未标注题材',
    fileName: parts.at(-1) || path.basename(filePath),
  }
}

function getGenreProfile(genre) {
  return genreProfiles[genre] ?? defaultProfile
}

function groupFiles(rootPath, files) {
  const groups = new Map()

  for (const file of files) {
    const inferred = inferGenre(rootPath, file)
    const group = groups.get(inferred.genre) ?? { genre: inferred.genre, files: [] }
    group.files.push({ file, fileName: inferred.fileName })
    groups.set(inferred.genre, group)
  }

  return [...groups.values()].sort((a, b) => a.genre.localeCompare(b.genre, 'zh-CN'))
}

function normalizeText(text) {
  return text
    .replace(/^\ufeff/, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+$/gm, '')
}

function splitChapters(text) {
  const chapterNumber = '[一二三四五六七八九十百千万零两0-9]{1,8}'
  const chapterPattern = new RegExp(`(^|\\n)\\s*(?:第${chapterNumber}[卷集部篇][^\\n]{0,40})?\\s*(?:序章|第${chapterNumber}[章节回][^\\n]{0,60})`, 'g')
  const matches = [...text.matchAll(chapterPattern)]

  if (matches.length < 3) {
    return [text]
  }

  return matches.map((match, index) => {
    const start = match.index + (match[1] ? match[1].length : 0)
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length
    return text.slice(start, end).trim()
  }).filter(Boolean)
}

function percentile(values, ratio) {
  if (!values.length) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))
  return sorted[index]
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function countTerms(text, terms) {
  return terms.reduce((sum, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return sum + (text.match(new RegExp(escaped, 'g')) ?? []).length
  }, 0)
}

function analyzeChapter(chapter, profile) {
  const cleaned = chapter.replace(/\s+/g, '')
  const paragraphs = chapter.split(/\n{1,}/).map((item) => item.trim()).filter(Boolean)
  const sentences = chapter.split(/[。！？…]+/).map((item) => item.trim()).filter((item) => item.length >= 2)
  const dialogueLines = paragraphs.filter((item) => /^["“‘「『]?[^\n，。！？]{0,18}[：:，,]/.test(item) || /[“”‘’]/.test(item))
  const tail = chapter.slice(-700)
  const termCount = countTerms(chapter, profile.signalTerms)
  const progressionCount = countTerms(chapter, profile.progressionTerms)

  return {
    chars: cleaned.length,
    paragraphCount: paragraphs.length,
    avgParagraphChars: average(paragraphs.map((item) => item.replace(/\s+/g, '').length)),
    dialogueRatio: paragraphs.length ? dialogueLines.length / paragraphs.length : 0,
    sentenceLengths: sentences.map((item) => item.replace(/\s+/g, '').length),
    signalTermCount: termCount,
    progressionCount,
    hookSignals: {
      signalFeedback: countTerms(tail, profile.signalTerms) > 0,
      progression: countTerms(tail, profile.progressionTerms) > 0,
      cliffhanger: /(忽然|下一秒|就在这时|与此同时|却见|只见|提示|公告|警告|危险|变故|震动|沉默)/.test(tail),
    },
  }
}

function summarizeGroup({ genre, sampleAnalyses, profile, rawFileCount, uniqueHashCount, duplicateFileCount }) {
  const chapterAnalyses = sampleAnalyses.flatMap((sample) => sample.chapters)
  const chapterChars = chapterAnalyses.map((item) => item.chars).filter(Boolean)
  const paragraphChars = chapterAnalyses.map((item) => item.avgParagraphChars).filter(Boolean)
  const sentenceLengths = chapterAnalyses.flatMap((item) => item.sentenceLengths)
  const totalChars = chapterChars.reduce((sum, value) => sum + value, 0)
  const signalTermCount = chapterAnalyses.reduce((sum, item) => sum + item.signalTermCount, 0)
  const progressionCount = chapterAnalyses.reduce((sum, item) => sum + item.progressionCount, 0)
  const hookCounts = chapterAnalyses.reduce((acc, item) => {
    for (const [key, enabled] of Object.entries(item.hookSignals)) {
      acc[key] = (acc[key] ?? 0) + (enabled ? 1 : 0)
    }
    return acc
  }, {})

  return {
    genre,
    rawFileCount,
    uniqueHashCount,
    duplicateFileCount,
    validSampleCount: sampleAnalyses.length,
    totalChars,
    chapterCount: chapterAnalyses.length,
    avgChapterChars: Math.round(average(chapterChars)),
    medianChapterChars: Math.round(percentile(chapterChars, 0.5)),
    p80ChapterChars: Math.round(percentile(chapterChars, 0.8)),
    avgParagraphChars: Math.round(average(paragraphChars)),
    medianSentenceChars: Math.round(percentile(sentenceLengths, 0.5)),
    p80SentenceChars: Math.round(percentile(sentenceLengths, 0.8)),
    dialogueRatio: average(chapterAnalyses.map((item) => item.dialogueRatio)),
    signalLabel: profile.label,
    signalPer10k: totalChars ? signalTermCount / totalChars * 10000 : 0,
    progressionPer10k: totalChars ? progressionCount / totalChars * 10000 : 0,
    hookRates: Object.fromEntries(Object.entries(hookCounts).map(([key, value]) => [key, value / Math.max(1, chapterAnalyses.length)])),
    sourceFiles: sampleAnalyses.map((item) => ({
      name: item.name,
      sha256: item.sha256,
      chars: item.chars,
      chapters: item.chapterCount,
    })),
  }
}

function pct(value) {
  return `${Math.round(value * 100)}%`
}

function fixed(value) {
  return Number(value).toFixed(1)
}

function buildMarkdown(summary) {
  const profile = getGenreProfile(summary.genre)

  return [
    `# ${summary.genre} 题材写作指纹`,
    '',
    '> 本文件只保存统计和抽象规律，不保存原文章节，不把样本原文带入生成上下文。',
    '',
    '## 样本概况',
    `- 原始样本数：${summary.rawFileCount}`,
    `- 去重后样本数：${summary.uniqueHashCount}`,
    `- 重复样本数：${summary.duplicateFileCount}`,
    `- 有效指纹样本数：${summary.validSampleCount}`,
    `- 统计章节数：${summary.chapterCount}`,
    `- 统计字符数：${summary.totalChars}`,
    `- 平均章节长度：${summary.avgChapterChars} 字`,
    `- 章节长度中位数：${summary.medianChapterChars} 字`,
    `- 章节长度 P80：${summary.p80ChapterChars} 字`,
    '',
    '## 文体节奏',
    `- 平均段落长度：${summary.avgParagraphChars} 字`,
    `- 句长中位数：${summary.medianSentenceChars} 字`,
    `- 句长 P80：${summary.p80SentenceChars} 字`,
    `- 对白段落占比：${pct(summary.dialogueRatio)}`,
    '',
    '## 题材信号',
    `- ${summary.signalLabel}密度：每万字 ${fixed(summary.signalPer10k)} 次`,
    `- 推进反馈密度：每万字 ${fixed(summary.progressionPer10k)} 次`,
    `- ${profile.mustKeepTitle}：${profile.mustKeepSignals}`,
    `- 生成建议：${profile.signalAdvice}`,
    '',
    '## 章末钩子',
    `- 章末含题材反馈：${pct(summary.hookRates.signalFeedback ?? 0)}`,
    `- 章末含推进反馈：${pct(summary.hookRates.progression ?? 0)}`,
    `- 章末含突发悬念：${pct(summary.hookRates.cliffhanger ?? 0)}`,
    '',
    '## 去 AI 味约束',
    ...profile.antiAiAdvice.map((item) => `- ${item}`),
    '',
    '## 有效样本登记',
    ...summary.sourceFiles.map((file) => `- ${file.name}：${file.chapters} 章，${file.chars} 字，sha256=${file.sha256.slice(0, 16)}`),
  ].join('\n')
}

function sanitizeFileName(value) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim() || '未命名'
}

async function analyzeFile(filePath, fileName) {
  const buffer = await fs.readFile(filePath)
  const text = normalizeText(decodeText(buffer))
  const chapters = splitChapters(text)
    .filter((chapter) => chapter.replace(/\s+/g, '').length >= 120)
    .slice(0, maxChaptersPerSample)

  return {
    name: fileName,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    chars: text.replace(/\s+/g, '').length,
    chapterTexts: chapters,
  }
}

async function mirrorFingerprintsToBundle(bundlePath, centralResults, index) {
  if (!bundlePath) {
    return
  }

  const targetDir = path.join(bundlePath, names.genreFingerprints)
  await fs.mkdir(targetDir, { recursive: true })

  for (const result of centralResults) {
    const content = await fs.readFile(result.absoluteFile, 'utf8')
    const target = path.join(targetDir, path.basename(result.absoluteFile))
    await fs.writeFile(target, content, 'utf8')
  }

  await fs.writeFile(path.join(bundlePath, 'genre-index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
}

async function main() {
  const { libraryPath, bundlePath, sourcePath } = parseArgs(process.argv.slice(2))

  if (!(await pathExists(sourcePath))) {
    throw new Error(`未找到中央样本目录：${sourcePath}`)
  }

  const files = await collectFiles(sourcePath)
  if (!files.length) {
    throw new Error(`未找到样本文本：${sourcePath}`)
  }

  const fingerprintDir = path.join(libraryPath, names.genreFingerprints)
  await fs.mkdir(fingerprintDir, { recursive: true })

  const groups = groupFiles(sourcePath, files)
  const results = []

  for (const group of groups) {
    const profile = getGenreProfile(group.genre)
    const dedupedSamples = []
    const seenHashes = new Set()
    let duplicateFileCount = 0

    for (const item of group.files) {
      const analysis = await analyzeFile(item.file, item.fileName)
      if (seenHashes.has(analysis.sha256)) {
        duplicateFileCount += 1
        continue
      }
      seenHashes.add(analysis.sha256)
      dedupedSamples.push(analysis)
    }

    const effectiveSamples = []
    for (const sample of dedupedSamples) {
      const chapterAnalyses = sample.chapterTexts.map((chapter) => analyzeChapter(chapter, profile))
      if (chapterAnalyses.length >= minSampleChapters) {
        effectiveSamples.push({
          name: sample.name,
          sha256: sample.sha256,
          chars: sample.chars,
          chapterCount: chapterAnalyses.length,
          chapters: chapterAnalyses,
        })
      }
      if (effectiveSamples.length >= maxSamplesPerGenre) {
        break
      }
    }

    const summary = summarizeGroup({
      genre: group.genre,
      sampleAnalyses: effectiveSamples,
      profile,
      rawFileCount: group.files.length,
      uniqueHashCount: dedupedSamples.length,
      duplicateFileCount,
    })
    const fileName = `${sanitizeFileName(group.genre)}.md`
    const target = path.join(fingerprintDir, fileName)

    await fs.writeFile(target, `${buildMarkdown(summary)}\n`, 'utf8')
    results.push({
      genre: group.genre,
      file: path.relative(libraryPath, target),
      absoluteFile: target,
      rawFileCount: summary.rawFileCount,
      uniqueHashCount: summary.uniqueHashCount,
      duplicateFileCount: summary.duplicateFileCount,
      sampleCount: summary.validSampleCount,
      chapterCount: summary.chapterCount,
      totalChars: summary.totalChars,
      avgChapterChars: summary.avgChapterChars,
      signalLabel: summary.signalLabel,
      signalPer10k: Number(fixed(summary.signalPer10k)),
      progressionPer10k: Number(fixed(summary.progressionPer10k)),
      sourceFiles: summary.sourceFiles,
    })
  }

  const index = {
    generatedAt: new Date().toISOString(),
    libraryPath,
    sourcePath,
    boundary: '只保存题材统计指纹，不保存原文章节，不把样本原文带入生成上下文。',
    genres: results.map(({ absoluteFile, ...rest }) => rest),
  }

  await fs.writeFile(path.join(fingerprintDir, 'genre-index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  await mirrorFingerprintsToBundle(bundlePath, results, index)
  console.log(JSON.stringify(index, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
