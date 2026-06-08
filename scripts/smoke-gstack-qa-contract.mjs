import fs from 'node:fs/promises'

const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
const qaScript = await fs.readFile('scripts/qa-gstack-home.mjs', 'utf8')

const checks = [
  {
    name: 'package exposes gstack home QA command',
    ok: packageJson.scripts?.['qa:gstack:home'] === 'node scripts/qa-gstack-home.mjs',
  },
  {
    name: 'gstack QA uses real browser command and Chrome fallback',
    ok: qaScript.includes('browse.exe') && qaScript.includes('GSTACK_CHROMIUM_PATH') && qaScript.includes('Google') && qaScript.includes('Chrome') && qaScript.includes('chrome.exe'),
  },
  {
    name: 'gstack QA verifies home and settings controls',
    ok:
      qaScript.includes('AI 写作工作台') &&
      qaScript.includes('书籍总控台') &&
      qaScript.includes('OpenAI API Key') &&
      qaScript.includes('Base URL') &&
      qaScript.includes('保存设置'),
  },
  {
    name: 'gstack QA writes reusable evidence artifacts',
    ok:
      qaScript.includes("path.join(root, 'artifacts', 'gstack')") &&
      qaScript.includes('home-report.json') &&
      qaScript.includes('home.png'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Gstack QA contract smoke failed')
}
