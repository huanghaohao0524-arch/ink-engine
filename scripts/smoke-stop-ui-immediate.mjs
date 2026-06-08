import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const start = app.indexOf('async function stopAiGeneration()')
const end = app.indexOf('\n  async function chooseLibrary()', start)
const fn = start >= 0 && end > start ? app.slice(start, end) : ''

const failures = []

if (!fn) {
  failures.push('stopAiGeneration function not found')
}

const cancelIndex = fn.indexOf('api.cancelAiRequest')
const clearRequestIndex = fn.indexOf('setActiveAiRequestId(null)')
const clearBusyIndex = fn.indexOf('setIsAiBusy(false)')
const clearLoadingIndex = fn.indexOf('setIsLoading(false)')
const clearTaskIndex = fn.indexOf('setActiveAiTaskLabel(null)')

if (fn.includes('await api.cancelAiRequest')) {
  failures.push('stopAiGeneration awaits backend cancel before releasing UI')
}

if (!fn.includes('const requestId = activeAiRequestId')) {
  failures.push('stopAiGeneration should capture active request id before clearing state')
}

if (!fn.includes('void api.cancelAiRequest(requestId).catch')) {
  failures.push('stopAiGeneration should fire backend cancel asynchronously with catch handler')
}

for (const [name, index] of [
  ['clear request id', clearRequestIndex],
  ['clear busy', clearBusyIndex],
  ['clear loading', clearLoadingIndex],
  ['clear task label', clearTaskIndex],
]) {
  if (index === -1) {
    failures.push(`stopAiGeneration missing ${name}`)
  } else if (cancelIndex !== -1 && index > cancelIndex) {
    failures.push(`stopAiGeneration performs ${name} after cancel call`)
  }
}

if (pkg.scripts?.['smoke:stop-ui-immediate'] !== 'node scripts/smoke-stop-ui-immediate.mjs') {
  failures.push('package exposes smoke:stop-ui-immediate')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Stop UI immediate smoke passed')
