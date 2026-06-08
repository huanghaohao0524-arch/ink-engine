import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'structured state machine material exists',
    ok: main.includes('state-machine.json') &&
      main.includes('buildStructuredStateSeed') &&
      main.includes('ensureStructuredStateMaterial') &&
      main.includes('readStructuredStateMaterial') &&
      main.includes("id: 'structuredState'"),
  },
  {
    name: 'future chapter plan material exists',
    ok: main.includes('future-plan.md') &&
      main.includes('buildFuturePlanSeed') &&
      main.includes('ensureFuturePlanMaterial') &&
      main.includes('readFuturePlanMaterial') &&
      main.includes("id: 'futurePlan'"),
  },
  {
    name: 'style calibration material exists',
    ok: main.includes('style-sample.md') &&
      main.includes('buildStyleSampleSeed') &&
      main.includes('ensureStyleSampleMaterial') &&
      main.includes('readStyleSampleMaterial') &&
      main.includes("id: 'styleSample'"),
  },
  {
    name: 'genre engine profile is selected and injected',
    ok: main.includes('function buildGenreEngineProfile') &&
      main.includes('## 题材专属写作引擎') &&
      main.includes('网游文专属执行') &&
      main.includes('context.genreEngine'),
  },
  {
    name: 'quality gate exists and affects director status',
    ok: main.includes('function parseQualityScore') &&
      main.includes('qualityScore') &&
      main.includes('qualityGatePassed') &&
      main.includes('质量门禁') &&
      main.includes('低于 80 分'),
  },
  {
    name: 'final sync emits structured state and future plan patches',
    ok: main.includes('## 结构化状态更新') &&
      main.includes('## 未来章节规划更新') &&
      main.includes('structuredPatch') &&
      main.includes('futurePlanPatch'),
  },
  {
    name: 'apply writing candidate persists new foundation patches',
    ok: main.includes('input.structuredPatch') &&
      main.includes('mergeStructuredStatePatch') &&
      main.includes("appendGovernedSection(input.bookPath, `${names.tracking}/future-plan.md`") &&
      main.includes("appendGovernedSection(input.bookPath, `${names.settings}/style-sample.md`"),
  },
  {
    name: 'frontend carries quality and foundation patches',
    ok: types.includes('qualityScore?: number') &&
      types.includes('structuredPatch?: string') &&
      types.includes('futurePlanPatch?: string') &&
      types.includes('stylePatch?: string') &&
      app.includes('qualityScore?: number') &&
      app.includes('structuredPatch: generated.structuredPatch') &&
      app.includes('futurePlanPatch: candidate.futurePlanPatch') &&
      app.includes('stylePatch: candidate.stylePatch'),
  },
  {
    name: 'chapter flow can run one-click foundation chain',
    ok: app.includes("generateChapterWithFoundationFlow") &&
      app.includes("flowMode: 'chapter-foundation'") &&
      app.includes('章节导演流程'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Writing foundation 95 smoke failed')
}
