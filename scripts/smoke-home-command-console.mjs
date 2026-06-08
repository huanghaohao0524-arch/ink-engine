import fs from 'node:fs'

const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const styles = fs.readFileSync('public/bookshelf-enhancer.css', 'utf8')

const checks = [
  ['dashboard hero exists', enhancer.includes('shelf-dashboard-hero') && enhancer.includes('墨引擎驾驶舱')],
  ['dashboard panel uses real counts', enhancer.includes('<div><span>全部作品</span><strong>${totalCount}</strong></div>') && enhancer.includes('<div><span>当前显示</span><strong>${visibleCount}</strong></div>')],
  ['genre count remains derived', enhancer.includes('const genreCount = Math.max(genres.length - 2, 0)')],
  ['linear flow strip exists', enhancer.includes('const flowNodes = [') && enhancer.includes('shelf-flow-strip')],
  ['dark console styles exist', styles.includes('.shelf-dashboard-hero') && styles.includes('.shelf-dashboard-panel') && styles.includes('.shelf-flow-strip')],
  ['filter empty hidden rule exists', styles.includes('.bookshelf-filter-empty[hidden]') && styles.includes('display: none')],
  ['outline button stays before delete', enhancer.includes('actions.insertBefore(outlineButton, dangerButton || null)')],
  ['mobile flow collapses', /@media \(max-width: 720px\)[\s\S]+\.shelf-flow-strip[\s\S]+grid-template-columns: 1fr/.test(styles)],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failures.length) {
  console.error(`Home command console smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('smoke-home-command-console ok')
