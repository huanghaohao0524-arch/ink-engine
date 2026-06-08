import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const preload = readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = readFileSync('electron/preload.cjs', 'utf8')

const contracts = [
  ['main', main, 'async function getLatestRecoverableWritingTaskRun'],
  ['main', main, "ipcMain.handle('book:get-latest-writing-task-run'"],
  ['main', main, "task-runs"],
  ['main', main, "recoverable: true"],
  ['main', main, "partialContent"],
  ['preload', preload, "getLatestWritingTaskRun: (input) => ipcRenderer.invoke('book:get-latest-writing-task-run', input)"],
  ['preloadCjs', preloadCjs, "getLatestWritingTaskRun: (input) => ipcRenderer.invoke('book:get-latest-writing-task-run', input)"],
  ['types', types, 'interface WritingTaskRunSummary'],
  ['types', types, 'getLatestWritingTaskRun: (input: { bookPath: string; chapterFile?: string; since?: string }) => Promise<WritingTaskRunSummary | null>'],
  ['app', app, 'async function recoverLatestWritingTaskRun'],
  ['app', app, '中断恢复候选'],
  ['app', app, 'const startedAt = new Date().toISOString()'],
  ['app', app, 'await recoverLatestWritingTaskRun(targetChapter.file, startedAt, err instanceof Error ? err.message : text.aiSettingsFailed)'],
  ['app', app, 'since: startedAt'],
  ['app', app, 'directorStatus: recovery.status === \'completed\' ? \'ready\' : \'needs-review\''],
  ['main', main, 'const sinceTime = typeof input?.since === \'string\' ? Date.parse(input.since) : 0'],
  ['main', main, 'if (sinceTime && updatedAt < sinceTime)'],
]

const missing = contracts.filter(([, source, text]) => !source.includes(text))

if (missing.length > 0) {
  throw new Error(`Missing writing task recovery contracts: ${missing.map(([file, , text]) => `${file}:${text}`).join(', ')}`)
}

console.log('smoke-writing-task-recovery passed')
