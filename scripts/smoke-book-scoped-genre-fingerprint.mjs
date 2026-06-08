import fs from 'node:fs'
import vm from 'node:vm'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const genreStart = main.indexOf('function stripNegatedGenreLines')
const genreEnd = main.indexOf('function buildWritingCompanion90Contract', genreStart)
if (genreStart < 0 || genreEnd < genreStart) {
  throw new Error('Could not extract genre helper block')
}

const sandbox = {}
vm.createContext(sandbox)
vm.runInContext([
  main.slice(genreStart, genreEnd),
  'this.detectGenreRequiredSignals = detectGenreRequiredSignals;',
].join('\n'), sandbox)

const urbanBook = {
  genreRules: [
    '当前题材：都市创业文。',
    '本书题材信号：客户压迫、合同条件、现金流变化、渠道反制。',
    '每章必须让现实压力落到人物选择上。',
  ].join('\n'),
  samplePoolFingerprints: [
    '题材信号指纹：客户压迫 / 合同条件 / 现金流变化 / 渠道反制。',
    '节奏指纹：用对话和现场反馈推进，不复制样本原句。',
    '旧样本里偶尔出现玩家、副本、经验，但这里只能作为无关样本噪声。',
  ].join('\n'),
}

const webgameBook = {
  genreRules: [
    '当前题材：网游文。',
    '本书题材信号：玩家选择、任务进度、技能冷却、世界频道反馈。',
  ].join('\n'),
  samplePoolFingerprints: '题材信号指纹：玩家选择 / 任务进度 / 技能冷却 / 世界频道反馈。',
}

const plainUrbanBook = {
  genreRules: '当前题材：都市职场。',
  coreSetting: '主角在公司推进客户项目。',
}

const sampleOnlyUrbanBook = {
  genreRules: '当前题材：都市职场。',
  samplePoolFingerprints: '题材信号指纹：客户压迫 / 合同条件 / 现金流变化 / 渠道反制。',
}

const failures = []
const urbanRequirement = sandbox.detectGenreRequiredSignals(urbanBook)
const webgameRequirement = sandbox.detectGenreRequiredSignals(webgameBook)
const plainUrbanRequirement = sandbox.detectGenreRequiredSignals(plainUrbanBook)
const sampleOnlyUrbanRequirement = sandbox.detectGenreRequiredSignals(sampleOnlyUrbanBook)

if (urbanRequirement.genre !== '都市') {
  failures.push(`urban book should remain urban, got ${urbanRequirement.genre}`)
}

if (webgameRequirement.genre !== '网游') {
  failures.push(`webgame book should remain webgame, got ${webgameRequirement.genre}`)
}

if (!urbanRequirement.signals.some((signal) => /客户压迫/.test(signal)) || !urbanRequirement.signals.some((signal) => /现金流变化/.test(signal))) {
  failures.push(`urban hard signals should come from this book rules, got ${urbanRequirement.signals.join(' | ')}`)
}

if (urbanRequirement.signals.some((signal) => /等级|经验|玩家|副本|任务\/副本/.test(signal))) {
  failures.push(`urban signals should not inherit webgame fallback signals, got ${urbanRequirement.signals.join(' | ')}`)
}

if (!webgameRequirement.signals.some((signal) => /技能冷却/.test(signal)) || !webgameRequirement.signals.some((signal) => /世界频道反馈/.test(signal))) {
  failures.push(`webgame hard signals should come from this book rules, got ${webgameRequirement.signals.join(' | ')}`)
}

if (plainUrbanRequirement.signals.some((signal) => /客户压迫|现金流变化|玩家选择|技能冷却/.test(signal))) {
  failures.push(`plain urban book without fingerprints should not inherit another book's fingerprint signals, got ${plainUrbanRequirement.signals.join(' | ')}`)
}

if (sampleOnlyUrbanRequirement.signals.some((signal) => /客户压迫|合同条件|现金流变化|渠道反制/.test(signal))) {
  failures.push(`sample fingerprints should assist writing but not become hard gate signals, got ${sampleOnlyUrbanRequirement.signals.join(' | ')}`)
}

if (!main.includes('function extractBookScopedGenreSignals')) {
  failures.push('missing book-scoped genre signal extractor')
}

if (pkg.scripts?.['smoke:book-scoped-genre-fingerprint'] !== 'node scripts/smoke-book-scoped-genre-fingerprint.mjs') {
  failures.push('package exposes smoke:book-scoped-genre-fingerprint')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:book-scoped-genre-fingerprint')) {
  failures.push('core smoke includes book-scoped genre fingerprint')
}

if (failures.length) {
  console.error(`Book scoped genre fingerprint smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Book scoped genre fingerprint smoke passed')
