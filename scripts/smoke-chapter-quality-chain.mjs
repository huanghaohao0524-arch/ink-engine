import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')

const checks = [
  {
    name: 'chapter task card prompt exists',
    ok: main.includes('function buildChapterTaskCardPrompt') && main.includes('\\u672c\\u7ae0\\u4efb\\u52a1\\u5361'),
  },
  {
    name: 'chapter draft prompt consumes task card',
    ok: main.includes('function buildChapterDraftPrompt') && main.includes('taskCard') && main.includes('\\u4ee5\\u672c\\u7ae0\\u4efb\\u52a1\\u5361\\u4e3a\\u6700\\u9ad8\\u6267\\u884c\\u4f9d\\u636e'),
  },
  {
    name: 'chapter self check prompt exists',
    ok: main.includes('function buildChapterSelfCheckPrompt') && main.includes('\\u8dd1\\u9898\\u6750') && main.includes('\\u5e73\\u53f0\\u8282\\u594f') && main.includes('\\u672c\\u7ae0\\u4efb\\u52a1'),
  },
  {
    name: 'continue mode runs bundled planning, draft and self check',
    ok: main.includes('const planBundle = await callOpenAiText') &&
      main.includes("parseSyncSection(planBundle, '章节策略规划')") &&
      main.includes("parseSyncSection(planBundle, '本章任务卡')") &&
      main.includes('const draftText = await callOpenAiTextPreferStream') &&
      main.includes('selfCheck = await callOpenAiText'),
  },
  {
    name: 'continue candidate returns final content with director metadata',
    ok: main.includes('async function runChapterWritingDirector') && main.includes('content: finalContent') && main.includes('directorDetail: buildDirectorDetail'),
  },
  {
    name: 'task card and self check have bounded outputs',
    ok: main.includes('chapterTaskCard: 1200') && main.includes('chapterSelfCheck: 1000'),
  },
  {
    name: 'frontend types expose task card and self check',
    ok: types.includes('taskCard?: string') && types.includes('selfCheck?: string'),
  },
  {
    name: 'self check revision prompt exists',
    ok: main.includes('function buildChapterSelfCheckRevisionPrompt') && main.includes('\\u6839\\u636e\\u81ea\\u68c0\\u62a5\\u544a\\u4fee\\u8ba2\\u7eed\\u5199\\u521d\\u7a3f'),
  },
  {
    name: 'continue revision mode consumes task card self check and draft',
    ok: main.includes("mode === 'revise-continuation'") && main.includes('input.taskCard') && main.includes('input.selfCheck') && main.includes('input.draftContent'),
  },
  {
    name: 'continue mode preserves partial draft if self check fails',
    ok: main.includes('selfCheckFailed') && main.includes("directorStatus = 'needs-review'") && main.includes('正文候选已保留'),
  },
  {
    name: 'frontend folds task card and self check behind director detail',
    ok: types.includes("'revise-continuation'") && types.includes('directorDetail?: string') && app.includes('<details className="director-detail">') && !app.includes('candidate.taskCard ? <pre>') && !app.includes('candidate.selfCheck ? <pre>'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Chapter quality chain smoke failed')
}
