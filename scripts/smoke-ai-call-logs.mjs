import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const preloadCjs = await fs.readFile('electron/preload.cjs', 'utf8')
const preloadMjs = await fs.readFile('electron/preload.mjs', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')

const checks = [
  {
    name: 'main process keeps in-memory ai call logs',
    ok: main.includes('const aiCallLogs = []') &&
      main.includes('function recordAiCallLog') &&
      main.includes('function getAiCallLogs'),
  },
  {
    name: 'callOpenAiText records success and failure metadata',
    ok: main.includes('recordAiCallLog({') &&
      main.includes("status: 'success'") &&
      main.includes("status: 'failed'") &&
      main.includes('durationMs') &&
      main.includes('inputChars') &&
      main.includes('outputChars') &&
      main.includes('reasoningEffort') &&
      main.includes('promptCacheKey'),
  },
  {
    name: 'ai call logs ipc is exposed',
    ok: main.includes("ipcMain.handle('ai:get-call-logs'") &&
      preloadCjs.includes("getAiCallLogs: () => ipcRenderer.invoke('ai:get-call-logs')") &&
      preloadMjs.includes("getAiCallLogs: () => ipcRenderer.invoke('ai:get-call-logs')"),
  },
  {
    name: 'frontend types include call log shape and api',
    ok: types.includes('interface AiCallLog') &&
      types.includes('reasoningEffort: string') &&
      types.includes('getAiCallLogs: () => Promise<AiCallLog[]>'),
  },
  {
    name: 'frontend has development call log panel',
    ok: app.includes('isAiCallLogsOpen') &&
      app.includes('loadAiCallLogs') &&
      app.includes('AI 调用记录') &&
      app.includes('开发期观测工具'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('AI call logs smoke failed')
}
