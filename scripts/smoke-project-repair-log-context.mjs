import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')

const contracts = [
  ['main', main, 'projectRepairLog: 1800'],
  ['main', main, "project-repair-log.md"],
  ['main', main, 'async function readProjectRepairLogMaterial'],
  ['main', main, 'projectRepairLog: await readProjectRepairLogMaterial(bookPath)'],
  ['main', main, '## 最近资料修复记录'],
  ['main', main, 'appendProjectRepairLog'],
  ['main', main, "source === 'project-repair'"],
  ['main', main, '最近资料修复记录优先于旧资料中含糊或冲突的表述'],
  ['types', types, "source?: 'project-update' | 'project-repair' | 'memory-compaction'"],
  ['types', types, 'summary?: string'],
  ['app', app, 'candidate.title.includes(text.projectRepairPackage)'],
  ['app', app, "source: candidate.title.includes(text.projectRepairPackage) ? 'project-repair' : 'project-update'"],
]

const missing = contracts.filter(([, source, text]) => !source.includes(text))

if (missing.length > 0) {
  throw new Error(`Missing project repair log context contracts: ${missing.map(([file, , text]) => `${file}:${text}`).join(', ')}`)
}

console.log('smoke-project-repair-log-context passed')
