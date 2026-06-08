import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')
const main = fs.readFileSync('electron/main.mjs', 'utf8')
const preload = fs.readFileSync('electron/preload.mjs', 'utf8')
const preloadCjs = fs.readFileSync('electron/preload.cjs', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const nextFlow = main.slice(main.indexOf('async function startNextChapterFlow'))

const orderedNeedles = [
  'async function finishChapterAndStartNext()',
  "createAiRequestId('next-chapter-flow')",
  'await api.startNextChapterFlow({',
  "kind: 'continue-writing'",
]

const failures = []
let cursor = -1
for (const needle of orderedNeedles) {
  const index = app.indexOf(needle, cursor + 1)
  if (index === -1) {
    failures.push(`Missing or out of order: ${needle}`)
  } else {
    cursor = index
  }
}

const checks = [
  ['next chapter flow state exists', app.includes('nextChapterFlowSteps')],
  ['workflow progress renders in AI panel', app.includes('workflow-progress-card') && app.includes('workflow-step')],
  ['start next chapter disabled while AI busy', app.includes('disabled={isLoading || isSaving || isAiBusy}')],
  ['frontend uses unified backend task', app.includes('api.startNextChapterFlow') && !app.includes('bookPath: createdDetail.book.path')],
  ['draft remains a candidate', app.includes('setCandidate({') && app.includes("targetChapterFile: newChapter.file")],
  ['backend unified task exists', main.includes('async function startNextChapterFlow') && main.includes("ipcMain.handle('book:start-next-chapter-flow'")],
  ['next chapter carries writing speed mode', app.includes("useState<WritingSpeedMode>('guarded')") && app.includes('speedMode: writingSpeedMode') && types.includes("speedMode?: 'polish' | 'guarded' | 'reckless'")],
  ['backend speed mode guards expensive repairs', main.includes('normalizeWritingSpeedMode') && main.includes('shouldAutoReviseChapterDraftForSpeed') && main.includes('shouldForceNaturalProseCalibrationForSpeed') && main.includes('shouldRepairEditorialFinalPassForSpeed')],
  ['backend saves, reuses or creates, drafts, then saves outline locally', nextFlow.indexOf('await writeChapterSnapshot(bookPath, currentChapterFile') < nextFlow.indexOf('const reusableChapter = await findReusableChapterForNextFlow(bookPath, currentChapterFile)') && nextFlow.includes('await createChapter({ bookPath })') && nextFlow.indexOf('const draft = await runChapterWritingDirector({') < nextFlow.indexOf('buildChapterOutlineFromDirectorDraft({ selectedChapter, draft })')],
  ['backend reuses empty placeholder chapters before creating new ones', main.includes('async function findReusableChapterForNextFlow') && main.includes('async function isPlaceholderChapter') && main.includes('? await buildBookDetail(bookPath, reusableChapter.file)')],
  ['backend reuses cache key across outline and draft', main.includes('const promptCacheKey = createBookWritingPromptCacheKey(bookPath)') && main.includes('promptCacheKey,')],
  ['next chapter avoids extra outline AI call', main.includes('function buildChapterOutlineFromDirectorDraft') && !nextFlow.includes("selectOutlineContext(await readProjectContext(bookPath, selectedChapter), 'chapter'")],
  ['preload exposes unified task', preload.includes('startNextChapterFlow') && preloadCjs.includes('startNextChapterFlow')],
  ['types expose unified task', types.includes('startNextChapterFlow:')],
  ['workflow styles exist', styles.includes('.workflow-progress-card') && styles.includes('.workflow-step.running') && styles.includes('.workflow-step.done')],
  ['package exposes smoke script', pkg.scripts?.['smoke:next-chapter-flow'] === 'node scripts/smoke-next-chapter-flow.mjs'],
]

for (const [name, ok] of checks) {
  if (!ok) {
    failures.push(name)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Next chapter flow smoke passed')
