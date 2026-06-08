import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const preload = readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = readFileSync('electron/preload.cjs', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['smart feedback package type exists', types.includes('interface GeneratedSmartFeedbackPackage')],
  ['backend smart feedback handler exists', main.includes('async function generateSmartFeedbackPackage')],
  ['backend builds routing prompt', main.includes('function buildSmartFeedbackRoutingPrompt')],
  ['routing classifies chapter/project/material scope', main.includes('chapterAction') && main.includes('projectAction') && main.includes('targetMaterialIds')],
  ['smart feedback can call chapter feedback package', main.includes('generateChapterFeedbackPackage({')],
  ['smart feedback can call project repair package', main.includes('generateProjectRepairPackage({')],
  ['smart feedback IPC is exposed', main.includes("ipcMain.handle('book:generate-smart-feedback-package'")],
  ['preload exposes smart feedback', preload.includes('generateSmartFeedbackPackage') && preloadCjs.includes('generateSmartFeedbackPackage')],
  ['frontend calls smart feedback instead of manual split', app.includes('generateSmartFeedbackPackage') && app.includes('smartFeedbackRoute')],
  ['candidate carries project repair updates', app.includes('projectUpdates: projectRepairPackage?.updates') && types.includes('projectRepairPackage?: GeneratedProjectUpdatePackage')],
  ['package exposes smoke script', pkg.scripts?.['smoke:smart-feedback-routing'] === 'node scripts/smoke-smart-feedback-routing.mjs'],
  ['core smoke includes smart feedback smoke', pkg.scripts?.['smoke:core']?.includes('smoke:smart-feedback-routing')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Smart feedback routing smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Smart feedback routing smoke passed')
