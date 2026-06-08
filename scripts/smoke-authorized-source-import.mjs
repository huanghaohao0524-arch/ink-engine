import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['authorized source constants exist', main.includes('authorized-source-index.json') && main.includes('authorizedSourceDefaultUrl')],
  ['source parser exists', main.includes('function normalizeAuthorizedBookSources') && main.includes('bookSourceName')],
  ['source importer fetches url', main.includes('async function importAuthorizedBookSources') && main.includes('aiFetch(sourceUrl')],
  ['source index stored locally', main.includes('writeAuthorizedSourceIndex') && main.includes('readAuthorizedSourceIndex')],
  ['source import records authorization boundary', main.includes('用户确认合法来源') && main.includes('不默认抓取正文')],
  ['ipc handlers exist', main.includes("ipcMain.handle('book:import-authorized-sources'") && main.includes("ipcMain.handle('book:get-authorized-source-index'")],
  ['preload exposes source api', preload.includes('importAuthorizedSources') && preload.includes('getAuthorizedSourceIndex')],
  ['types expose source api', types.includes('importAuthorizedSources:') && types.includes('AuthorizedSourceIndex')],
  ['package exposes smoke script', pkg.scripts?.['smoke:authorized-sources'] === 'node scripts/smoke-authorized-source-import.mjs'],
  ['core smoke includes authorized sources', pkg.scripts?.['smoke:core']?.includes('smoke:authorized-sources')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Authorized source import smoke passed')
