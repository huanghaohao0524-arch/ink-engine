import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

function sliceFunction(name, nextName) {
  const start = main.indexOf(`function ${name}`) >= 0
    ? main.indexOf(`function ${name}`)
    : main.indexOf(`async function ${name}`)
  const end = nextName
    ? Math.max(main.indexOf(`function ${nextName}`, start), main.indexOf(`async function ${nextName}`, start))
    : -1
  return start >= 0 && end > start ? main.slice(start, end) : ''
}

const networkErrorFn = sliceFunction('createAiNetworkError', 'normalizeProxyUrl')
const textFn = sliceFunction('callOpenAiText', 'callOpenAiChatText')
const chatFn = sliceFunction('callOpenAiChatCompletions', 'callOpenAiChatCompletionsStream')
const streamFn = sliceFunction('callOpenAiChatCompletionsStream', 'callOpenAiTextPreferStream')
const preferStreamFn = sliceFunction('callOpenAiTextPreferStream', 'chatChoiceSummary')

const failures = []

if (!main.includes('function isAiAbortError')) {
  failures.push('missing abort error classifier')
}

if (!networkErrorFn.includes('isAiAbortError(error)') || !networkErrorFn.includes('createAiAbortError()')) {
  failures.push('createAiNetworkError should not wrap user cancellation as network failure')
}

for (const [label, fn] of [
  ['responses text call', textFn],
  ['chat completions call', chatFn],
  ['streaming chat call', streamFn],
  ['prefer stream wrapper', preferStreamFn],
]) {
  if (!fn.includes('isAiAbortError(error)') || !fn.includes('throw createAiAbortError()')) {
    failures.push(`${label} should rethrow abort before network/fallback handling`)
  }
}

if (pkg.scripts?.['smoke:ai-abort-error-routing'] !== 'node scripts/smoke-ai-abort-error-routing.mjs') {
  failures.push('package exposes smoke:ai-abort-error-routing')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:ai-abort-error-routing')) {
  failures.push('core smoke includes abort error routing')
}

if (failures.length) {
  console.error(`AI abort error routing smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('AI abort error routing smoke passed')
