import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const streamStart = main.indexOf('async function callOpenAiChatCompletionsStream')
const streamEnd = main.indexOf('async function callOpenAiTextPreferStream', streamStart)
const streamFn = streamStart >= 0 && streamEnd > streamStart ? main.slice(streamStart, streamEnd) : ''

const pipelineStart = main.indexOf('async function runChapterWritingDirectorPipeline')
const pipelineEnd = main.indexOf('async function startNextChapterFlow', pipelineStart)
const pipelineFn = pipelineStart >= 0 && pipelineEnd > pipelineStart ? main.slice(pipelineStart, pipelineEnd) : ''

const nextStart = main.indexOf('async function startNextChapterFlow')
const nextEnd = main.indexOf('async function applyGeneratedWritingDraft', nextStart)
const nextFn = nextStart >= 0 && nextEnd > nextStart ? main.slice(nextStart, nextEnd) : ''

const batchStart = main.indexOf('async function startBatchWritingFlow')
const batchEnd = main.indexOf('const materialRewriteProfiles', batchStart)
const batchFn = batchStart >= 0 && batchEnd > batchStart ? main.slice(batchStart, batchEnd) : ''

const failures = []

for (const needle of [
  'const aiRequestTimeoutMs = 180000',
  'const aiStreamRequestTimeoutMs = 240000',
  'function createTimedRequestSignal',
  'function assertNotAborted',
  'throw createAiAbortError()',
]) {
  if (!main.includes(needle)) {
    failures.push(`missing timeout/cancel primitive: ${needle}`)
  }
}

if (!streamFn.includes('keepSignalAlive: true') || !streamFn.includes('timeoutMs: aiStreamRequestTimeoutMs')) {
  failures.push('streaming chat request should keep timed signal alive until body reader finishes')
}

if (!streamFn.includes('response.__aiSignalCleanup?.()')) {
  failures.push('streaming chat reader should cleanup timed signal in finally')
}

const pipelineCheckpointCount = (pipelineFn.match(/assertNotAborted\(signal\)/g) || []).length
if (pipelineCheckpointCount < 12) {
  failures.push(`chapter director pipeline needs more abort checkpoints, found ${pipelineCheckpointCount}`)
}

const nextCheckpointCount = (nextFn.match(/assertNotAborted\(signal\)/g) || []).length
if (nextCheckpointCount < 6) {
  failures.push(`next chapter flow needs abort checkpoints, found ${nextCheckpointCount}`)
}

const batchCheckpointCount = (batchFn.match(/assertNotAborted\(signal\)/g) || []).length
if (batchCheckpointCount < 3) {
  failures.push(`batch writing flow needs abort checkpoints, found ${batchCheckpointCount}`)
}

if (pkg.scripts?.['smoke:ai-cancel-timeout'] !== 'node scripts/smoke-ai-cancel-timeout.mjs') {
  failures.push('package exposes smoke:ai-cancel-timeout')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('AI cancel timeout smoke passed')
