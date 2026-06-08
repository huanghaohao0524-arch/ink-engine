import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const draftStart = main.indexOf('function buildChapterDraftPrompt')
const draftEnd = main.indexOf('function buildChapterSelfCheckPrompt', draftStart)
const draftBody = draftStart >= 0 && draftEnd > draftStart ? main.slice(draftStart, draftEnd) : ''

const strategyStart = main.indexOf('function buildChapterStrategyPrompt')
const strategyEnd = main.indexOf('function buildChapterTaskCardPrompt', strategyStart)
const strategyBody = strategyStart >= 0 && strategyEnd > strategyStart ? main.slice(strategyStart, strategyEnd) : ''

const taskCardStart = main.indexOf('function buildChapterTaskCardPrompt')
const taskCardEnd = main.indexOf('function buildLocalChapterPlanBundle', taskCardStart)
const taskCardBody = taskCardStart >= 0 && taskCardEnd > taskCardStart ? main.slice(taskCardStart, taskCardEnd) : ''

const selfCheckStart = main.indexOf('function buildChapterSelfCheckPrompt')
const selfCheckEnd = main.indexOf('function buildChapterSelfCheckRevisionPrompt', selfCheckStart)
const selfCheckBody = selfCheckStart >= 0 && selfCheckEnd > selfCheckStart ? main.slice(selfCheckStart, selfCheckEnd) : ''

const finalSyncStart = main.indexOf('function buildFinalDraftSyncPrompt')
const finalSyncEnd = main.indexOf('async function syncFinalDraftState', finalSyncStart)
const finalSyncBody = finalSyncStart >= 0 && finalSyncEnd > finalSyncStart ? main.slice(finalSyncStart, finalSyncEnd) : ''

const repairStart = main.indexOf('function buildProjectRepairPatchPrompt')
const repairEnd = main.indexOf('async function generateProjectRepairPackage', repairStart)
const repairBody = repairStart >= 0 && repairEnd > repairStart ? main.slice(repairStart, repairEnd) : ''

const executionStart = main.indexOf('function buildChapterExecutionContract')
const executionEnd = main.indexOf('function evaluateChapterExecutionGate', executionStart)
const executionBody = executionStart >= 0 && executionEnd > executionStart ? main.slice(executionStart, executionEnd) : ''

const detectStart = main.indexOf('function detectGenreRequiredSignals')
const detectEnd = main.indexOf('function buildWritingCompanion90Contract', detectStart)
const detectBody = detectStart >= 0 && detectEnd > detectStart ? main.slice(detectStart, detectEnd) : ''

const gateStart = main.indexOf('function evaluateChapterExecutionGate')
const gateEnd = main.indexOf('const structuredStateRequiredKeys', gateStart)
const gateBody = gateStart >= 0 && gateEnd > gateStart ? main.slice(gateStart, gateEnd) : ''

const failures = []

if (!main.includes('function buildGenreContinuityContract')) {
  failures.push('missing genre continuity contract builder')
}

if (!draftBody.includes('buildGenreContinuityContract({ genreRequirement')) {
  failures.push('draft prompt should use genre-specific continuity contract')
}

for (const webgameOnly of [
  '网游必须承接等级',
  '如果上一章已经获得经验',
  '经验/奖励',
]) {
  if (draftBody.includes(webgameOnly)) {
    failures.push(`draft prompt still contains generic webgame-only text: ${webgameOnly}`)
  }
}

const promptBodies = [
  ['strategy prompt', strategyBody],
  ['task card prompt', taskCardBody],
  ['self check prompt', selfCheckBody],
  ['final sync prompt', finalSyncBody],
  ['project repair prompt', repairBody],
]

for (const [label, body] of promptBodies) {
  if (!body.includes('buildGenreContinuityContract({ genreRequirement')) {
    failures.push(`${label} should consume genre-specific continuity contract`)
  }

  for (const webgameOnly of [
    '如果是网游，必须出现',
    '网游必须写清',
    '网游写等级',
    '网游需检查',
    '网游示例',
    '如果涉及网游',
  ]) {
    if (body.includes(webgameOnly)) {
      failures.push(`${label} still contains generic webgame-only text: ${webgameOnly}`)
    }
  }
}

if (!detectBody.includes("return buildGenreRequirement('都市'") && !detectBody.includes("genre: '都市'")) {
  failures.push('genre detector should return urban genre signals')
}

if (!main.includes('split(/[\\r\\n，,。；;]+/u)') && !main.includes('split(/[\\\\r\\\\n，,。；;]+/u)')) {
  failures.push('genre detector should split mixed positive/negative genre statements')
}

for (const urbanSignal of ['身份/事业状态', '资产/资源变化', '关系网络反馈', '现实风险压力']) {
  if (!detectBody.includes(urbanSignal)) {
    failures.push(`urban detector missing signal: ${urbanSignal}`)
  }
}

if (!executionBody.includes('buildGenreContinuityContract({ genreRequirement')) {
  failures.push('execution contract should use genre-specific continuity contract')
}

if (!gateBody.includes("genreRequirement.genre === '网游'")) {
  failures.push('execution gate should only use webgame signal regex when active genre is webgame')
}

if (!gateBody.includes("genreRequirement.genre === '都市'")) {
  failures.push('execution gate should have urban-specific signal checks')
}

if (pkg.scripts?.['smoke:urban-genre-isolation'] !== 'node scripts/smoke-urban-genre-isolation.mjs') {
  failures.push('package exposes smoke:urban-genre-isolation')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:urban-genre-isolation')) {
  failures.push('core smoke includes urban genre isolation')
}

if (failures.length) {
  console.error(`Urban genre isolation smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Urban genre isolation smoke passed')
