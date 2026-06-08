import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const busyBannerCount = (app.match(/className="ai-busy-banner"/g) || []).length

const checks = [
  ['topbar tools are grouped', app.includes('project-tool-menu') && app.includes('projectToolMenu')],
  ['ai assistant panel exists', app.includes('ai-assistant-panel') && app.includes('assistant-primary-card')],
  ['assistant result and feedback are first-class', app.includes('assistant-result-card') && app.includes('assistant-feedback-card')],
  ['secondary ai tools are collapsed', app.includes('assistant-secondary-tools') && app.includes('assistant-debug-tools')],
  ['only one ai busy banner remains in assistant panel', busyBannerCount === 1],
  ['topbar tool menu styled', styles.includes('.project-tool-menu') && styles.includes('.project-tool-popover')],
  ['assistant cards styled', styles.includes('.ai-assistant-panel') && styles.includes('.assistant-primary-card') && styles.includes('.companion-copilot-status')],
  ['secondary tools styled', styles.includes('.assistant-secondary-tools') && styles.includes('.assistant-debug-tools') && styles.includes('.chapter-volume-tree')],
  ['readback modal styled', styles.includes('.apply-readback-compact') && styles.includes('.readback-modal')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editor-ui-simplification'] === 'node scripts/smoke-editor-ui-simplification.mjs'],
  ['core smoke includes editor ui smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editor-ui-simplification')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Editor UI simplification smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editor UI simplification smoke passed')
