import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['assistant panel label exists', app.includes('ai-assistant-panel') && app.includes('AI 助手')],
  ['primary write button is driven by companion judgement', app.includes('companionCopilot.label') && app.includes('runUserPrimaryWriteAction')],
  ['generation result judgement exists', app.includes('buildUserResultJudgement') && app.includes('text.resultJudgement')],
  ['human feedback input exists', app.includes('text.humanFeedback') && app.includes('chapterFeedbackPlaceholder')],
  ['batch mode hidden behind simple speed selector', app.includes('writingSpeedMode') && app.includes("type WritingSpeedMode = 'polish' | 'guarded' | 'reckless'")],
  ['debug details are folded', app.includes('assistant-debug-tools') && app.includes('调试与高级工具')],
  ['technical cards are not top-level first items', app.indexOf('assistant-primary-card') < app.indexOf('assistant-debug-tools')],
  ['styles for user panel exist', styles.includes('.ai-assistant-panel') && styles.includes('.assistant-result-card') && styles.includes('.assistant-feedback-card') && styles.includes('.companion-copilot-status')],
  ['package exposes smoke script', pkg.scripts?.['smoke:user-writing-panel'] === 'node scripts/smoke-user-writing-panel.mjs'],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('User writing panel smoke passed')
