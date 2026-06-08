import fs from 'node:fs'

const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const styles = fs.readFileSync('public/bookshelf-enhancer.css', 'utf8')

const checks = [
  [
    'home dashboard is a library summary',
    enhancer.includes('class="shelf-library-summary"')
      && enhancer.includes('class="shelf-library-stats"')
      && enhancer.includes('进入书籍后再处理项目包、大纲、章节写作和追踪'),
  ],
  [
    'home dashboard uses real counts',
    enhancer.includes('<section><span>全部作品</span><strong>${totalCount}</strong></section>')
      && enhancer.includes('<section><span>当前显示</span><strong>${visibleCount}</strong></section>')
      && enhancer.includes('<section><span>题材架</span><strong>${genreCount}</strong></section>'),
  ],
  ['genre count remains derived', enhancer.includes('const genreCount = Math.max(genres.length - 2, 0)')],
  [
    'editor cockpit is scoped to opened books',
    enhancer.includes("const shell = document.querySelector('.editor-shell')")
      && enhancer.includes("nav.className = 'editor-cockpit-nav'")
      && enhancer.includes('commandCenter.insertBefore(nav, commandCenter.firstChild)'),
  ],
  [
    'editor cockpit buttons are wired to real actions',
    enhancer.includes('data-target=".prep-overview"')
      && enhancer.includes('data-target=".knowledge-board"')
      && enhancer.includes('data-target=".chapter-prep-card"')
      && enhancer.includes('data-action="outline"')
      && enhancer.includes('data-action="write"')
      && enhancer.includes('openOutlineCockpitFromCurrentEditor()')
      && enhancer.includes("document.querySelector('.prep-overview .primary-button')?.click()"),
  ],
  [
    'old fake home cockpit markup is gone',
    !enhancer.includes('cockpit-main')
      && !enhancer.includes('cockpit-modules')
      && !enhancer.includes('const moduleCards = ['),
  ],
  [
    'styles separate home shelf and editor cockpit',
    styles.includes('.shelf-library-summary')
      && styles.includes('.shelf-library-stats')
      && styles.includes('.editor-shell .project-command-center')
      && styles.includes('.editor-cockpit-nav'),
  ],
  ['filter empty hidden rule exists', styles.includes('.bookshelf-filter-empty[hidden]') && styles.includes('display: none')],
  ['outline button stays before delete', enhancer.includes('actions.insertBefore(outlineButton, dangerButton || null)')],
  [
    'mobile editor cockpit collapses',
    /@media \(max-width: 720px\)[\s\S]+\.editor-cockpit-nav[\s\S]+grid-template-columns: 1fr/.test(styles),
  ],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failures.length) {
  console.error(`Home command console smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('smoke-home-command-console ok')
