import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')

const checks = [
  {
    name: 'project package can carry genre rules',
    ok: main.includes('genreRules: valueOrFallback(projectPackage.genreRules') && types.includes('genreRules: string'),
  },
  {
    name: 'book creation writes genre rules material',
    ok: main.includes("genre-rules.md") && main.includes('buildGenreRulesSeed'),
  },
  {
    name: 'project materials expose genre rules card',
    ok: main.includes("id: 'genreRules'") && main.includes("label: '\\u9898\\u6750\\u89c4\\u5219'"),
  },
  {
    name: 'writing context reads genre rules',
    ok: main.includes('genreRules: await readTextFileIfExists') && main.includes("names.settings, 'genre-rules.md'"),
  },
  {
    name: 'outline and chapter writing prompts enforce genre rules',
    ok: main.includes('## \\u9898\\u6750\\u89c4\\u5219') && main.includes('\\u4e0d\\u80fd\\u8dd1\\u9898\\u6750') && main.includes('\\u672c\\u7ae0\\u9898\\u6750\\u5473\\u9053'),
  },
  {
    name: 'web game genre has explicit anti-drift signals',
    ok: main.includes('\\u7f51\\u6e38\\u6587\\u9898\\u6750\\u89c4\\u5219') && main.includes('\\u73a9\\u5bb6\\u611f') && main.includes('\\u7eaf\\u7384\\u5e7b') && main.includes('\\u4e16\\u754c\\u516c\\u544a'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Genre engine smoke failed')
}
