import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')

const contracts = [
  'type PrimaryWorkflowAction',
  'interface PrimaryWorkflowDecision',
  'function buildPrimaryWorkflowDecision',
  "action: 'review-candidate'",
  "action: 'configure-ai'",
  "action: 'create-chapter'",
  "action: 'generate-volume-outline'",
  "action: 'generate-chapter-outline'",
  "action: 'write-chapter'",
  "action: 'complete-setup'",
  'const primaryWorkflowDecision = buildPrimaryWorkflowDecision',
  'async function runPrimaryWorkflowAction',
  "case 'review-candidate'",
  "case 'create-chapter'",
  "case 'write-chapter'",
  "flowMode: 'chapter-foundation'",
]

const missing = contracts.filter((contract) => !app.includes(contract))

if (missing.length > 0) {
  throw new Error(`Missing primary workflow decision contracts: ${missing.join(', ')}`)
}

console.log('smoke-primary-workflow-decision passed')
