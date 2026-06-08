import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['output limit exists', main.includes('naturalProseCalibration')],
  ['prompt builder exists', main.includes('function buildNaturalProseCalibrationPrompt')],
  ['calibration runner exists', main.includes('async function calibrateNaturalProse')],
  ['pipeline records natural prose step', main.includes("'natural-prose'")],
  ['director detail shows calibration', main.includes('naturalProseDetail') && main.includes('自然文风校准')],
  ['draft prompt asks for authored scene prose', main.includes('作者在写现场') && main.includes('模板化总结腔')],
  ['calibration preserves story state', main.includes('不改变剧情事实') && main.includes('状态变量') && main.includes('只输出修订后的正文全文')],
  ['final sync follows calibration', main.indexOf('calibrateNaturalProse') < main.lastIndexOf('syncFinalDraftState({')],
  ['package exposes smoke script', pkg.scripts?.['smoke:natural-prose'] === 'node scripts/smoke-natural-prose-calibration.mjs'],
  ['core smoke includes natural prose', pkg.scripts?.['smoke:core']?.includes('smoke:natural-prose')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Natural prose calibration smoke passed')
