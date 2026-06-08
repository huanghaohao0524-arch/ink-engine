import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const css = fs.readFileSync('public/bookshelf-enhancer.css', 'utf8')
const types = fs.readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['backend builds major change order', main.includes('function buildProjectMajorChangeOrderContent') && main.includes('# 大改变更单')],
  ['project update returns only reviewable change order update', main.includes('const majorChangeOrder = buildProjectMajorChangeOrderUpdate') && main.includes('updates: [majorChangeOrder]')],
  ['major change writes to repair log not scattered files', main.includes("id: 'projectRepairLog'") && main.includes('大改先写入可回读的变更单，不直接覆盖原始设定文件')],
  ['apply returns project update apply report', main.includes('projectUpdateApplyReport') && main.includes('后续生成会优先读取资料修复记录')],
  ['types expose apply report', types.includes('interface ProjectUpdateApplyReport') && types.includes('projectUpdateApplyReport?: ProjectUpdateApplyReport')],
  ['runtime enhances major change candidate panel', enhancer.includes('function enhanceProjectUpdateCandidatePanel') && enhancer.includes('大改确认流')],
  ['runtime asks confirm before applying major change', enhancer.includes('确认把这份大改变更单写入资料修复记录')],
  ['runtime enhancement is queued on DOM changes', enhancer.includes('enhanceProjectUpdateCandidatePanel()')],
  ['styles include major change card', css.includes('.major-change-card') && css.includes('.major-change-grid')],
  ['package exposes smoke', pkg.scripts?.['smoke:major-change-order-flow'] === 'node scripts/smoke-major-change-order-flow.mjs'],
  ['core smoke includes major change order flow', pkg.scripts?.['smoke:core']?.includes('smoke:major-change-order-flow')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(`Major change order flow smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Major change order flow smoke passed')
