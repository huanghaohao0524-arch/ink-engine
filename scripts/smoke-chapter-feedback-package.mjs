import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = fs.readFileSync('electron/preload.cjs', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'chapter feedback ipc is exposed',
    ok:
      preload.includes("generateChapterFeedbackPackage: (input) => ipcRenderer.invoke('book:generate-chapter-feedback-package', input)") &&
      preloadCjs.includes("generateChapterFeedbackPackage: (input) => ipcRenderer.invoke('book:generate-chapter-feedback-package', input)") &&
      main.includes("ipcMain.handle('book:generate-chapter-feedback-package'"),
  },
  {
    name: 'backend builds chapter feedback package with long-term memory sections',
    ok:
      main.includes('function buildChapterFeedbackPackagePrompt') &&
      main.includes('async function generateChapterFeedbackPackage') &&
      main.includes('## 本章重写稿') &&
      main.includes('## 影响范围') &&
      main.includes('## 长期记忆更新') &&
      main.includes("parseSyncSection(content, '结构化状态更新')") &&
      main.includes("parseSyncSection(content, '未来章节规划更新')"),
  },
  {
    name: 'frontend type carries feedback candidate and package fields',
    ok:
      types.includes('interface GeneratedChapterFeedbackPackage') &&
      types.includes('generateChapterFeedbackPackage') &&
      app.includes("'chapter-feedback'") &&
      app.includes('feedbackSummary?: string') &&
      app.includes('impactSummary?: string'),
  },
  {
    name: 'frontend has a clear feedback rewrite entry',
    ok:
      app.includes('chapterFeedback') &&
      app.includes('这章不行，反馈重写') &&
      app.includes('generateChapterFeedbackPackage') &&
      app.includes('currentContent: draftContent'),
  },
  {
    name: 'applying feedback package replaces chapter and persists long-term patches',
    ok:
      app.includes("candidate.kind === 'chapter-feedback'") &&
      app.includes("mode: 'replace'") &&
      app.includes('structuredPatch: candidate.structuredPatch') &&
      app.includes('futurePlanPatch: candidate.futurePlanPatch') &&
      app.includes('stylePatch: candidate.stylePatch'),
  },
]

const failed = checks.filter((check) => !check.ok)

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
