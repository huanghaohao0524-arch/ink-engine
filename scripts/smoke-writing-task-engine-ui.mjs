import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')
const main = fs.readFileSync('electron/main.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')

const checks = [
  ['frontend stores latest writing task run', app.includes('latestWritingTaskRun') && app.includes('refreshLatestWritingTaskRun')],
  ['frontend renders writing task control card', app.includes('writing-task-engine-card') && app.includes('text.writingTaskEngine')],
  ['frontend exposes single-step retries', app.includes("retryLatestWritingTaskStep('draft')") && app.includes("retryLatestWritingTaskStep('final-sync')")],
  ['frontend renders preflight contract before generation', app.includes('chapterPreflightContract') && app.includes('text.preflightContract')],
  ['frontend renders cost summary', app.includes('aiCostSummary') && app.includes('text.costSummary')],
  ['feedback area offers automatic routing', app.includes('assistant-feedback-card') && app.includes('generateSmartFeedbackPackage') && app.includes('generateProjectRepairPackage')],
  ['styles for task engine exist', styles.includes('.writing-task-engine-card') && styles.includes('.task-step-list') && styles.includes('.cost-summary-grid')],
  ['backend task run summary carries duration fields', main.includes('durationMs:') && main.includes('totalDurationMs')],
  ['types expose task run duration fields', types.includes('durationMs?: number') && types.includes('totalDurationMs?: number')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Writing task engine UI smoke passed')
