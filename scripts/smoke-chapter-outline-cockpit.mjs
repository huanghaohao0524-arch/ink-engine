import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const preload = await fs.readFile('electron/preload.mjs', 'utf8')
const preloadCjs = await fs.readFile('electron/preload.cjs', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')
const enhancer = await fs.readFile('public/bookshelf-enhancer.js', 'utf8')
const styles = await fs.readFile('public/bookshelf-enhancer.css', 'utf8')
const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))

const checks = [
  ['backend exposes outline index', main.includes('function getChapterOutlineFile') && main.includes('async function buildChapterOutlineIndex')],
  ['backend can create placeholder chapters for batch outlines', main.includes('async function ensureChapterCount') && main.includes('await createChapter({ bookPath })')],
  ['backend batch generates missing outlines', main.includes('async function batchGenerateChapterOutlines') && main.includes('generateChapterOutlineForChapter')],
  ['backend emits outline batch progress', main.includes("scope: 'chapter-outline-batch'") && main.includes("emitProgress('outline'")],
  ['backend single outline generator is exposed', main.includes('async function generateSingleChapterOutline') && main.includes("scope: 'chapter-outline-single'")],
  ['backend returns platform recommended outline count', main.includes('recommendedTotalChapters: getPlatformOutlinePolicy')],
  ['ipc handlers are registered', main.includes("book:list-chapter-outline-index") && main.includes("book:generate-single-chapter-outline") && main.includes("book:batch-generate-chapter-outlines")],
  ['preload exposes outline APIs', preload.includes('listChapterOutlineIndex') && preload.includes('generateSingleChapterOutline') && preload.includes('batchGenerateChapterOutlines') && preloadCjs.includes('listChapterOutlineIndex') && preloadCjs.includes('generateSingleChapterOutline') && preloadCjs.includes('batchGenerateChapterOutlines')],
  ['types expose outline APIs', types.includes('interface ChapterOutlineIndex') && types.includes('recommendedTotalChapters?: number') && types.includes('generateSingleChapterOutline:') && types.includes('batchGenerateChapterOutlines:')],
  ['dashboard adds outline cockpit button', enhancer.includes('outline-cockpit-button') && enhancer.includes('openOutlineCockpitFromCard')],
  ['editor remembers current book for cockpit', enhancer.includes('ink-engine.currentBookPath') && enhancer.includes('rememberBookPathBound')],
  ['project cockpit adds outline command card', enhancer.includes('enhanceProjectOutlineCockpit') && enhancer.includes('outline-command-card')],
  ['modal can preview and batch generate outlines', enhancer.includes('ensureOutlineCockpitModal') && enhancer.includes('refreshOutlineCockpit') && enhancer.includes('api.batchGenerateChapterOutlines')],
  ['modal can generate or rewrite the selected outline', enhancer.includes('outline-generate-current') && enhancer.includes('outline-regenerate-current') && enhancer.includes('generateSelectedOutline') && enhancer.includes('api.generateSingleChapterOutline')],
  ['modal uses compact volume directory rows', enhancer.includes('groupOutlineItemsByVolume') && enhancer.includes('outline-volume-group') && enhancer.includes('createOutlineRow') && !enhancer.includes('item.preview || item.outlineFile')],
  ['modal uses recommended outline count', enhancer.includes('index.recommendedTotalChapters') && enhancer.includes('targetInput.value = String(index.recommendedTotalChapters)')],
  ['styles exist for outline cockpit', styles.includes('.outline-cockpit-modal') && styles.includes('.outline-row.ready') && styles.includes('.outline-command-card')],
  ['styles keep outline and chapter directories scrollable', styles.includes('.outline-volume-group summary') && styles.includes('.outline-cockpit-modal') && styles.includes('height: min(860px') && styles.includes('.editor-shell .chapter-list') && styles.includes('overflow-y: auto')],
  ['editor chapter directory is dense tree list', styles.includes('.editor-shell .chapter-item') && styles.includes('grid-template-columns: minmax(0, 1fr) auto') && styles.includes('.editor-shell .volume-group') && styles.includes('border-radius: 0') && styles.includes('.editor-shell .chapter-item::before')],
  ['package exposes smoke script', pkg.scripts?.['smoke:chapter-outline-cockpit'] === 'node scripts/smoke-chapter-outline-cockpit.mjs'],
  ['core smoke includes outline cockpit', pkg.scripts?.['smoke:core']?.includes('smoke:chapter-outline-cockpit')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Chapter outline cockpit smoke passed')
