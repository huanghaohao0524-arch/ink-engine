import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const callStart = main.indexOf('async function callOpenAiText')
const callEnd = main.indexOf('async function callOpenAiChatText', callStart)
const callBody = callStart >= 0 && callEnd > callStart ? main.slice(callStart, callEnd) : ''

const outlineStart = main.indexOf('async function generateOutlineCandidate')
const outlineEnd = main.indexOf('async function startNextChapterFlow', outlineStart)
const outlineBody = outlineStart >= 0 && outlineEnd > outlineStart ? main.slice(outlineStart, outlineEnd) : ''

const failures = []

if (!main.includes('function isTransientAiHttpStatus')) {
  failures.push('missing transient AI HTTP status helper')
}

for (const status of ['504', '524', '522', '429']) {
  if (!main.includes(status)) {
    failures.push(`transient status ${status} should be recognized`)
  }
}

if (!callBody.includes('Responses transient') || !callBody.includes('callOpenAiChatCompletions')) {
  failures.push('Responses transient failures should fall back to Chat Completions before failing the user task')
}

if (!outlineBody.includes('callOpenAiTextPreferStream')) {
  failures.push('outline candidate generation should prefer streaming text calls')
}

if (!outlineBody.includes('maxOutputTokens: estimateOutlineMaxOutputTokens')) {
  failures.push('outline candidate generation should cap output tokens by outline mode')
}

if (!outlineBody.includes("reasoningEffort: 'low'")) {
  failures.push('outline candidate generation should use low reasoning effort for speed')
}

if (pkg.scripts?.['smoke:outline-transient-recovery'] !== 'node scripts/smoke-outline-transient-recovery.mjs') {
  failures.push('package exposes smoke:outline-transient-recovery')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:outline-transient-recovery')) {
  failures.push('core smoke includes outline transient recovery')
}

if (failures.length) {
  console.error(`Outline transient recovery smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Outline transient recovery smoke passed')
