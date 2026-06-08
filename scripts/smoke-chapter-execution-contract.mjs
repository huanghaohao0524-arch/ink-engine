import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')

const contracts = [
  'function buildChapterExecutionContract',
  'function detectGenreRequiredSignals',
  'function evaluateChapterExecutionGate',
  'executionContract',
  '本章执行合同',
  '题材信号底线',
  '状态同步底线',
  'execution-gate',
  'execution-gate-repair',
  'qualityGateWarnings',
]

const missing = contracts.filter((contract) => !main.includes(contract))

if (missing.length > 0) {
  throw new Error(`Missing chapter execution contract: ${missing.join(', ')}`)
}

console.log('smoke-chapter-execution-contract passed')
