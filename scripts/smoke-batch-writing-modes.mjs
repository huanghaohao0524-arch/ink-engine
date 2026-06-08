import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = fs.readFileSync('electron/preload.cjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['backend batch flow exists', main.includes('async function startBatchWritingFlow')],
  ['backend calls next chapter flow in loop', main.includes('for (let index = 0; index < chapterCount; index += 1)') && main.includes('await startNextChapterFlow({')],
  ['backend applies generated draft during batch', main.includes("mode: 'replace'") && main.includes('applyGeneratedWritingDraft')],
  ['backend has guarded and reckless mode branches', main.includes("mode === 'reckless'") && main.includes("mode === 'guarded'")],
  ['backend batch passes speed mode into next chapter flow', main.includes('speedMode: mode')],
  ['ipc exposed for batch flow', main.includes("ipcMain.handle('book:start-batch-writing-flow'") && preload.includes('startBatchWritingFlow') && preloadCjs.includes('startBatchWritingFlow')],
  ['types expose batch flow', types.includes('startBatchWritingFlow:') && types.includes("mode: 'guarded' | 'reckless'")],
  ['frontend has batch mode controls', app.includes('batchWritingMode') && app.includes('batchChapterCount') && app.includes('startBatchWritingFlow')],
  ['frontend renders guarded and reckless labels', app.includes('连写') && app.includes('无脑')],
  ['frontend batch progress card exists', app.includes('assistant-secondary-tools') && app.includes('batchWritingResult')],
  ['styles exist for batch UI', styles.includes('.assistant-secondary-tools') && styles.includes('.writing-speed-selector')],
  ['package exposes smoke script', pkg.scripts?.['smoke:batch-writing'] === 'node scripts/smoke-batch-writing-modes.mjs'],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Batch writing modes smoke passed')
