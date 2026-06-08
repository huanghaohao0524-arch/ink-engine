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
    'editor cockpit has real workspace architecture',
    enhancer.includes('EDITOR_COCKPIT_MODULES')
      && enhancer.includes("cockpit.className = 'editor-cockpit-shell'")
      && enhancer.includes('editor-cockpit-rail')
      && enhancer.includes('editor-cockpit-modules')
      && enhancer.includes('editor-cockpit-preview'),
  ],
  [
    'editor cockpit switches in place instead of anchor scrolling',
    enhancer.includes('setEditorCockpitPanel(commandCenter, panel)')
      && enhancer.includes('getEditorCockpitPanelData')
      && !enhancer.includes('scrollToEditorSection')
      && !enhancer.includes('data-target=".prep-overview"'),
  ],
  [
    'editor cockpit direct actions are real',
    enhancer.includes("triggerEditorCockpitAction(action)")
      && enhancer.includes("if (action === 'outline')")
      && enhancer.includes("if (action === 'write')")
      && enhancer.includes("if (action === 'save')")
      && enhancer.includes('openOutlineCockpitFromCurrentEditor()')
      && enhancer.includes("document.querySelector('.prep-overview .primary-button')?.click()"),
  ],
  [
    'old fake home cockpit markup is gone',
    !enhancer.includes('class="cockpit-main"')
      && !enhancer.includes('class="cockpit-modules"')
      && !enhancer.includes('const moduleCards = ['),
  ],
  [
    'styles separate home shelf and editor cockpit',
    styles.includes('.shelf-library-summary')
      && styles.includes('.shelf-library-stats')
      && styles.includes('.editor-cockpit-shell')
      && styles.includes('.editor-cockpit-rail')
      && styles.includes('.editor-cockpit-preview'),
  ],
  ['filter empty hidden rule exists', styles.includes('.bookshelf-filter-empty[hidden]') && styles.includes('display: none')],
  ['outline button stays before delete', enhancer.includes('actions.insertBefore(outlineButton, dangerButton || null)')],
  [
    'mobile editor cockpit collapses',
    /@media \(max-width: 720px\)[\s\S]+\.editor-cockpit-modules[\s\S]+grid-template-columns: 1fr/.test(styles),
  ],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failures.length) {
  console.error(`Home command console smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('smoke-home-command-console ok')
