import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['focus action type exists', app.includes('interface EditorialFocusAction') && app.includes('radarId: string')],
  ['focus action builder exists', app.includes('function buildEditorialFocusActions')],
  ['focus actions are based on radar risk and watch', app.includes("item.status === 'risk' || item.status === 'watch'")],
  ['focus actions can fill feedback', app.includes('useEditorialFocusAction') && app.includes('setChapterFeedback(action.feedback)')],
  ['focus actions can run smart rewrite', app.includes('runEditorialFocusAction') && app.includes('void generateSmartFeedbackPackage(action.feedback)')],
  ['assistant renders focus actions', app.includes('editorialFocusActions') && app.includes('editorial-focus-actions') && app.includes('聚焦修改')],
  ['styles for focus actions exist', styles.includes('.editorial-focus-actions') && styles.includes('.editorial-focus-action')],
  ['package exposes smoke script', pkg.scripts?.['smoke:editorial-focus-actions'] === 'node scripts/smoke-editorial-focus-actions.mjs'],
  ['core smoke includes focus action smoke', pkg.scripts?.['smoke:core']?.includes('smoke:editorial-focus-actions')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(`Editorial focus actions smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Editorial focus actions smoke passed')
