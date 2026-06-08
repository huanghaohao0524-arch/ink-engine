import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const preload = readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = readFileSync('electron/preload.cjs', 'utf8')

const contracts = [
  ['main', main, 'function buildProjectRepairTargetPrompt'],
  ['main', main, 'function buildProjectRepairPatchPrompt'],
  ['main', main, 'async function generateProjectRepairPackage'],
  ['main', main, "ipcMain.handle('book:generate-project-repair-package'"],
  ['main', main, '资料修复包'],
  ['main', main, '问题影响范围'],
  ['main', main, '长期资料修复'],
  ['preload', preload, "generateProjectRepairPackage: (input) => ipcRenderer.invoke('book:generate-project-repair-package', input)"],
  ['preloadCjs', preloadCjs, "generateProjectRepairPackage: (input) => ipcRenderer.invoke('book:generate-project-repair-package', input)"],
  ['types', types, 'generateProjectRepairPackage'],
  ['app', app, 'generateProjectRepairPackage'],
  ['app', app, 'projectRepairPackage'],
  ['app', app, '诊断资料修复'],
]

const missing = contracts.filter(([, source, text]) => !source.includes(text))

if (missing.length > 0) {
  throw new Error(`Missing project repair package contracts: ${missing.map(([file, , text]) => `${file}:${text}`).join(', ')}`)
}

console.log('smoke-project-repair-package passed')
