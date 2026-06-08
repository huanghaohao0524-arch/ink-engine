import fs from 'node:fs'

const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const start = enhancer.indexOf('function ensureAiProgressPanel')
const end = enhancer.indexOf('function renderAiProgress', start)
const fn = start >= 0 && end > start ? enhancer.slice(start, end) : ''

const failures = []

if (!fn) {
  failures.push('ensureAiProgressPanel not found')
}

if (fn.includes('await window.writingWorkbench.cancelAiRequest')) {
  failures.push('progress stop button should not await backend cancel before releasing panel')
}

if (!fn.includes('void window.writingWorkbench.cancelAiRequest(requestId).catch')) {
  failures.push('progress stop button should fire backend cancel asynchronously with catch')
}

if (!fn.includes('panel.hidden = true')) {
  failures.push('progress panel should hide immediately after stop click')
}

if (!fn.includes("panel.dataset.status = 'done'") || !fn.includes("panel.dataset.requestId = ''")) {
  failures.push('progress panel should mark itself done and clear request id immediately')
}

if (!fn.includes("panel.querySelector('button').hidden = true")) {
  failures.push('progress stop button should hide immediately to avoid repeated clicks')
}

if (pkg.scripts?.['smoke:progress-panel-stop-immediate'] !== 'node scripts/smoke-progress-panel-stop-immediate.mjs') {
  failures.push('package exposes smoke:progress-panel-stop-immediate')
}

if (!pkg.scripts?.['smoke:core']?.includes('smoke:progress-panel-stop-immediate')) {
  failures.push('core smoke includes progress-panel-stop-immediate')
}

if (failures.length) {
  console.error(`Progress panel stop immediate smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Progress panel stop immediate smoke passed')
