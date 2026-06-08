import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preloadMjs = fs.readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = fs.readFileSync('electron/preload.cjs', 'utf8')
const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const runtime = fs.readFileSync('public/legacy-runtime.js', 'utf8')

for (const snippet of [
  'aiConnectionProfiles',
  'activeAiProfileId',
  'upsertAiConnectionProfile',
  "ipcMain.handle('ai:list-profiles'",
  "ipcMain.handle('ai:use-profile'",
  "ipcMain.handle('ai:delete-profile'",
  'settingsUiMode',
]) {
  if (!main.includes(snippet)) {
    throw new Error(`AI profile backend missing ${snippet}`)
  }
}

for (const [name, source] of [['preload.mjs', preloadMjs], ['preload.cjs', preloadCjs]]) {
  for (const api of ['listAiProfiles', 'useAiProfile', 'deleteAiProfile']) {
    if (!source.includes(api)) {
      throw new Error(`${name} missing ${api}`)
    }
  }
}

for (const snippet of ['ai-profile-row', 'listAiProfiles', 'useAiProfile', 'deleteAiProfile']) {
  if (!enhancer.includes(snippet)) {
    throw new Error(`AI settings profile UI missing ${snippet}`)
  }
}

if (!enhancer.includes('panel.dataset.aiProfileRendering') || !enhancer.includes("existingProfileRows.slice(1).forEach((row) => row.remove())")) {
  throw new Error('AI settings profile enhancer must guard against concurrent duplicate profile rows')
}

if (!enhancer.includes('function removeAiProfileRows') || !enhancer.includes("Array.from(panel.querySelectorAll('.ai-profile-row')).forEach((row) => row.remove())")) {
  throw new Error('AI settings profile refresh must remove all stale profile rows')
}

if (!main.includes('testConnection: 512')) {
  throw new Error('AI test connection token budget should be large enough for reasoning/relay models to return visible text')
}

const saveFnStart = app.indexOf('async function saveAiSettings()')
const saveFnEnd = app.indexOf('async function testAiConnection()', saveFnStart)
const saveFnBody = saveFnStart >= 0 && saveFnEnd > saveFnStart ? app.slice(saveFnStart, saveFnEnd) : ''
if (!saveFnBody || saveFnBody.includes('setCandidate(') || saveFnBody.includes('revealCandidate(')) {
  throw new Error('AI settings save failures must stay in AI settings status and must not create writing candidates')
}

if (runtime.includes('自动沉淀失败，已保留对话摘要候选')) {
  throw new Error('Legacy runtime AI settings save handler still creates a project-chat candidate on failure')
}

console.log('smoke-ai-settings-profiles ok')
