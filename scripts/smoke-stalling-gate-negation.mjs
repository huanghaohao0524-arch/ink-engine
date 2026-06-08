import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const stateStart = main.indexOf('function evaluateChapterStateGate')
const stateEnd = main.indexOf('function buildChapterStateGateRevisionPrompt')
const stateBody = main.slice(stateStart, stateEnd)

const executionStart = main.indexOf('function evaluateChapterExecutionGate')
const executionEnd = main.indexOf('const structuredStateRequiredKeys')
const executionBody = main.slice(executionStart, executionEnd)

const helperStart = main.indexOf('function hasConfirmedStallingRisk')
const helperEnd = main.indexOf('function isWebGameContext')
const helperBody = main.slice(helperStart, helperEnd)

const checks = [
  ['stalling helper exists', helperStart >= 0 && helperBody.includes('safeLine') && helperBody.includes('confirmedRisk')],
  ['helper ignores explicit safe lines', helperBody.includes('无|暂无|没有|未出现|不存在|已避免') && helperBody.includes('禁止|避免|防止|是否')],
  ['state gate uses confirmed stalling helper', stateBody.includes('hasConfirmedStallingRisk(source)') && !stateBody.includes('/原地踏步|重复上一章|没有推进|空转/u.test(source)')],
  ['execution gate uses confirmed stalling helper', executionBody.includes('hasConfirmedStallingRisk(source)') && !executionBody.includes('/原地踏步|重复上一章|没有推进|空转/u.test(source)')],
  ['package exposes stalling smoke', pkg.scripts?.['smoke:stalling-gate-negation'] === 'node scripts/smoke-stalling-gate-negation.mjs'],
  ['core smoke includes stalling smoke', pkg.scripts?.['smoke:core']?.includes('smoke:stalling-gate-negation')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Stalling gate negation smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Stalling gate negation smoke passed')
