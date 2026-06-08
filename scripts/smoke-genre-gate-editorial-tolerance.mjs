import fs from 'node:fs'
import vm from 'node:vm'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const gateStart = main.indexOf('function stripNegatedGenreLines')
const gateEnd = main.indexOf('function buildCompanion90FlowSummary', gateStart)
if (gateStart < 0 || gateEnd < gateStart) {
  throw new Error('Could not extract gate helper block')
}

const sandbox = {}
vm.createContext(sandbox)
const stallingStart = main.indexOf('function hasConfirmedStallingRisk')
const webGameStart = main.indexOf('function isWebGameContext')
const webGameEnd = main.indexOf('function evaluateChapterStateGate', webGameStart)
vm.runInContext([
  main.slice(gateStart, gateEnd),
  stallingStart >= 0 && webGameStart > stallingStart ? main.slice(stallingStart, webGameStart) : '',
  webGameStart >= 0 && webGameEnd > webGameStart ? main.slice(webGameStart, webGameEnd) : '',
  'this.evaluateChapterExecutionGate = evaluateChapterExecutionGate;',
].join('\n'), sandbox)

const context = {
  genreRules: '当前题材：都市生活文。',
  coreSetting: '主角在城市里处理现实生活压力。',
}

const content = [
  '# 第002章',
  '清晨的地铁口挤满上班族，林澈攥着手机，银行卡扣款短信弹出来，房租只差最后一天。',
  '物业经理在小区门口拦住他，邻居也把昨晚的争执发进业主群。',
  '他没有躲，直接拨通老板电话，请求把拖欠工资结清，同时去派出所补了一份报警记录。',
  '这个选择让他的处境变得更紧，母亲的医院缴费单也在这时跳了出来。',
].join('\n')

const statePatch = '## 章节后状态更新\n- 现实压力升级：房租、工资、医院缴费和物业纠纷同时压到主角身上。\n- 关系变化：老板、邻居、物业和派出所成为下一章必须承接的现实关系。'
const progressPatch = '## 本章实际推进\n- 主角做出选择，主动追讨工资并报警，下一章必须承接物业纠纷和医院缴费压力。'
const structuredPatch = JSON.stringify({
  currentChapter: '第002章',
  protagonist: { name: '林澈' },
  plot: { currentObstacle: '房租和医院缴费压力' },
  genreSignals: ['地铁', '手机', '房租', '工资', '物业', '医院', '报警'],
  openLoops: ['物业纠纷', '医院缴费'],
  recentChapterFunctions: ['现实压力升级'],
  nextRequiredMove: '下一章必须承接物业纠纷和医院缴费压力',
}, null, 2)
const futurePlanPatch = '## 未来章节规划\n- 下一章必须承接物业纠纷、医院缴费和老板拖欠工资。'

const result = sandbox.evaluateChapterExecutionGate({
  executionContract: '',
  context,
  content,
  statePatch,
  progressPatch,
  memoryPatch: '',
  structuredPatch,
  futurePlanPatch,
})

const failures = []

if (result.signalHits.length < 2) {
  failures.push(`urban life scene should hit at least two genre signals, got ${result.signalHits.length}: ${result.warnings.join(' | ')}`)
}

if (result.warnings.some((warning) => warning.includes('题材信号不足'))) {
  failures.push(`urban life scene should not be blocked by narrow topic-signal wording: ${result.warnings.join(' | ')}`)
}

if (!main.includes('function uniqueWarnings')) {
  failures.push('missing warning dedupe helper')
}

if (!main.includes('dedupeDraftGateWarnings')) {
  failures.push('draft gate warnings should be deduped before returning candidate')
}

if (pkg.scripts?.['smoke:genre-gate-editorial-tolerance'] !== 'node scripts/smoke-genre-gate-editorial-tolerance.mjs') {
  failures.push('package exposes smoke:genre-gate-editorial-tolerance')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:genre-gate-editorial-tolerance')) {
  failures.push('core smoke includes genre gate editorial tolerance')
}

if (failures.length) {
  console.error(`Genre gate editorial tolerance smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Genre gate editorial tolerance smoke passed')
