import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const callStart = main.indexOf('async function callOpenAiText')
const callEnd = main.indexOf('async function callOpenAiChatText')
const callBody = callStart >= 0 && callEnd > callStart ? main.slice(callStart, callEnd) : ''

const checks = [
  {
    name: 'callOpenAiText exists',
    ok: callBody.length > 0,
  },
  {
    name: 'empty Responses text falls back to Chat Completions',
    ok:
      callBody.includes('emptyFallbackStartedAt') &&
      callBody.includes('Responses empty text fallback') &&
      callBody.includes('callOpenAiChatCompletions({ apiKey: apiKey.trim(), baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl })'),
  },
  {
    name: 'fallback failure preserves the Responses empty-text diagnosis',
    ok:
      callBody.includes('buildEmptyResponsesTextMessage') &&
      callBody.includes('Chat Completions 兜底也失败'),
  },
  {
    name: 'outline generation uses the protected text caller',
    ok:
      main.includes("ipcMain.handle('book:generate-outline-candidate'") &&
      main.includes('async function generateOutlineCandidate') &&
      main.includes('const content = await callOpenAiText'),
  },
]

const failed = checks.filter((check) => !check.ok)

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
