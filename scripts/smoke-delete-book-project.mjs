import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const preload = readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = readFileSync('electron/preload.cjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['backend delete uses recycle bin', main.includes('async function deleteBookProject') && main.includes('shell.trashItem(target)')],
  ['backend guards current library boundary', main.includes("ipcMain.handle('workspace:delete-book'") && main.includes('path.relative(libraryRoot, target)')],
  ['preload exposes delete book', preload.includes("deleteBook: (bookPath) => ipcRenderer.invoke('workspace:delete-book', bookPath)") && preloadCjs.includes("deleteBook: (bookPath) => ipcRenderer.invoke('workspace:delete-book', bookPath)")],
  ['frontend type exposes delete book', types.includes('deleteBook: (bookPath: string) => Promise<WorkspaceState>')],
  ['dashboard has delete action', app.includes('async function deleteBookProject') && app.includes('text.deleteBook') && app.includes('window.confirm')],
  ['delete action is visible but explicit', app.includes('danger-button') && app.includes('移到回收站')],
  ['package exposes smoke', pkg.scripts?.['smoke:delete-book-project'] === 'node scripts/smoke-delete-book-project.mjs'],
  ['core includes smoke', pkg.scripts?.['smoke:core']?.includes('smoke:delete-book-project')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Delete book project smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Delete book project smoke passed.')
