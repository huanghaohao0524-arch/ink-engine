import fs from 'node:fs'
import vm from 'node:vm'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const sandbox = {}
vm.createContext(sandbox)
const genreStart = main.indexOf('function stripNegatedGenreLines')
const genreEnd = main.indexOf('function buildWritingCompanion90Contract', genreStart)
const webGameStart = main.indexOf('function isWebGameContext')
const webGameEnd = main.indexOf('function evaluateChapterStateGate', webGameStart)
if (genreStart < 0 || genreEnd < genreStart || webGameStart < 0 || webGameEnd < webGameStart) {
  throw new Error('Could not extract genre helper block')
}
vm.runInContext([
  main.slice(genreStart, genreEnd),
  main.slice(webGameStart, webGameEnd),
  'this.detectGenreRequiredSignals = detectGenreRequiredSignals;',
  'this.isWebGameContext = isWebGameContext;',
].join('\n'), sandbox)

const urbanOverrideContext = {
  genreRules: '当前题材：都市创业文。已经改为纯都市。禁止网游，不要游戏面板，剔除等级经验任务框架。',
  coreSetting: '主角在公司创业，处理客户、合同、资金、渠道和舆论压力。',
  overallOutline: '都市商战爽文，围绕项目、客户、人脉和现金流推进。',
  storyState: '旧资料残留：玩家在副本获得经验，任务面板提示升级。',
  structuredState: 'nextRequiredMove: 继续处理公司项目与客户关系。',
}

const genericUrbanContext = {
  genreRules: '当前题材：都市职场。',
  coreSetting: '主角需要提升职业技能、积累项目经验、完成客户任务、提高岗位等级。',
}

const repairLogOverrideContext = {
  genreRules: '旧资料残留：网游文，玩家通过副本和游戏系统升级。',
  coreSetting: '旧资料残留：主角曾是玩家。',
  projectRepairLog: '最近修复：当前题材改为都市商战文，彻底剔除网游框架，不再写等级经验任务面板。',
}

const failures = []
const activeGenre = sandbox.detectGenreRequiredSignals(urbanOverrideContext)

if (activeGenre.genre !== '都市') {
  failures.push(`explicit urban override should win over stale webgame state, got ${activeGenre.genre}`)
}

if (sandbox.isWebGameContext(urbanOverrideContext)) {
  failures.push('webgame context helper should obey active genre authority after urban correction')
}

if (sandbox.isWebGameContext(genericUrbanContext)) {
  failures.push('generic words like task/skill/experience/level must not trigger webgame gate in urban context')
}

const repairLogGenre = sandbox.detectGenreRequiredSignals(repairLogOverrideContext)
if (repairLogGenre.genre !== '都市') {
  failures.push(`recent project repair log should override stale genre files, got ${repairLogGenre.genre}`)
}

const isWebGameStart = main.indexOf('function isWebGameContext')
const isWebGameEnd = main.indexOf('function evaluateChapterStateGate', isWebGameStart)
const isWebGameBody = main.slice(isWebGameStart, isWebGameEnd)

if (!isWebGameBody.includes('detectGenreRequiredSignals(context).genre')) {
  failures.push('isWebGameContext should delegate to detectGenreRequiredSignals instead of scanning raw project text')
}

if (pkg.scripts?.['smoke:active-genre-authority'] !== 'node scripts/smoke-active-genre-authority.mjs') {
  failures.push('package exposes smoke:active-genre-authority')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:active-genre-authority')) {
  failures.push('core smoke includes active genre authority')
}

if (failures.length) {
  console.error(`Active genre authority smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Active genre authority smoke passed')
