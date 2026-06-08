import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const app = await fs.readFile('src/App.tsx', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'chapter writing director function exists',
    ok: main.includes('async function runChapterWritingDirector') &&
      main.includes('shouldAutoReviseChapterDraft') &&
      main.includes('buildDirectorDetail'),
  },
  {
    name: 'continue mode delegates to director',
    ok: main.includes("if (mode === 'continue')") &&
      main.includes('return runChapterWritingDirector({') &&
      !main.includes('content: draft,\n        taskCard,\n        selfCheck,'),
  },
  {
    name: 'director can auto revise when self check asks for revision',
    ok: main.includes("directorStatus = 'auto-revised'") &&
      main.includes("directorStatus = 'ready'") &&
      main.includes('buildChapterSelfCheckRevisionPrompt({') &&
      main.includes('shouldAutoReviseChapterDraft(selfCheck)'),
  },
  {
    name: 'candidate type carries director details',
    ok: types.includes("directorStatus?: 'ready' | 'auto-revised' | 'needs-review'") &&
      types.includes('directorDetail?: string') &&
      app.includes("directorStatus?: 'ready' | 'auto-revised' | 'needs-review'") &&
      app.includes('directorDetail?: string'),
  },
  {
    name: 'frontend defaults to final draft and folds details',
    ok: app.includes('<details className="director-detail">') &&
      app.includes('生成详情') &&
      app.includes('candidate.directorDetail') &&
      !app.includes('candidate.taskCard ? <pre>') &&
      !app.includes('candidate.selfCheck ? <pre>'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Writing director smoke failed')
}
