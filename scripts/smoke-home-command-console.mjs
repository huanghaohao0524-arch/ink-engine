import fs from 'node:fs'

const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const styles = fs.readFileSync('public/bookshelf-enhancer.css', 'utf8')

const checks = [
  ['cockpit shell exists', enhancer.includes('cockpit-nav') && enhancer.includes('cockpit-main') && enhancer.includes('墨引擎 · 写作工作台')],
  ['dashboard overview uses real counts', enhancer.includes('<div><dt>作品</dt><dd>${visibleCount} / ${totalCount}</dd></div>') && enhancer.includes('<div><dt>题材</dt><dd>${genreCount}</dd></div>')],
  ['genre count remains derived', enhancer.includes('const genreCount = Math.max(genres.length - 2, 0)')],
  ['module cockpit exists', enhancer.includes('const moduleCards = [') && enhancer.includes('cockpit-modules')],
  ['assistant uses real book meta', enhancer.includes('const primaryMeta = visibleCards[0] ? getCardMeta(visibleCards[0]) : null') && enhancer.includes('assistantLines')],
  ['progress is derived from visible books', enhancer.includes('const progress = totalCount ? Math.max(1, Math.round((visibleCount / totalCount) * 100)) : 0')],
  ['dark cockpit styles exist', styles.includes('.cockpit-nav') && styles.includes('.cockpit-overview') && styles.includes('.cockpit-progress') && styles.includes('.cockpit-modules')],
  ['filter empty hidden rule exists', styles.includes('.bookshelf-filter-empty[hidden]') && styles.includes('display: none')],
  ['outline button stays before delete', enhancer.includes('actions.insertBefore(outlineButton, dangerButton || null)')],
  ['mobile cockpit collapses', /@media \(max-width: 720px\)[\s\S]+\.cockpit-modules > div[\s\S]+grid-template-columns: 1fr/.test(styles)],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failures.length) {
  console.error(`Home command console smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('smoke-home-command-console ok')
