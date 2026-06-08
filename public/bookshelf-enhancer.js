const GENRE_STORAGE_KEY = 'ink-engine.bookshelf.genres'
const ACTIVE_GENRE_STORAGE_KEY = 'ink-engine.bookshelf.activeGenre'

const DEFAULT_GENRES = [
  { id: 'all', label: '全部作品', keywords: [] },
  { id: 'game', label: '网游', keywords: ['网游', '游戏', '副本', '玩家', '系统', '装备', '技能', '等级', '公会'] },
  { id: 'urban', label: '都市', keywords: ['都市', '重生', '校花', '创业', '神医', '鉴宝', '赘婿', '战神'] },
  { id: 'fantasy', label: '玄幻', keywords: ['玄幻', '修仙', '武侠', '功法', '宗门', '仙', '灵气', '境界'] },
  { id: 'suspense', label: '悬疑', keywords: ['悬疑', '死人', '火化', '阴单', '破案', '诡', '规则', '怪谈'] },
  { id: 'romance', label: '言情', keywords: ['言情', '甜宠', '离婚', '萌宝', '女主', '婚恋', '古言'] },
  { id: 'uncategorized', label: '未分类', keywords: [] },
]

let renderQueued = false
let isRendering = false
let aiProgressHideTimer = null
let bookMetaByTitle = new Map()
let bookMetaLoading = false
let bookMetaSignature = ''

const SHELF_GENRES = [
  { id: 'all', label: '\u5168\u90e8\u4f5c\u54c1', keywords: [] },
  { id: 'game', label: '\u7f51\u6e38', keywords: ['\u7f51\u6e38', '\u6e38\u620f', '\u7535\u7ade', '\u5168\u606f', '\u526f\u672c', '\u73a9\u5bb6', '\u7cfb\u7edf', '\u88c5\u5907', '\u6280\u80fd', '\u7b49\u7ea7', '\u516c\u4f1a'] },
  { id: 'urban', label: '\u90fd\u5e02', keywords: ['\u90fd\u5e02', '\u73b0\u4ee3', '\u804c\u573a', '\u91cd\u751f', '\u6821\u56ed', '\u521b\u4e1a', '\u795e\u533b', '\u9274\u5b9d', '\u8d58\u5a7f', '\u6218\u795e'] },
  { id: 'fantasy', label: '\u7384\u5e7b', keywords: ['\u7384\u5e7b', '\u4fee\u4ed9', '\u4ed9\u4fa0', '\u6b66\u4fa0', '\u529f\u6cd5', '\u5b97\u95e8', '\u7075\u6c14', '\u5883\u754c', '\u5f02\u80fd'] },
  { id: 'suspense', label: '\u60ac\u7591', keywords: ['\u60ac\u7591', '\u63a8\u7406', '\u5211\u4fa6', '\u63a2\u6848', '\u6cd5\u533b', '\u89c4\u5219\u602a\u8c08', '\u65e0\u9650\u6d41', '\u60ca\u609a'] },
  { id: 'romance', label: '\u8a00\u60c5', keywords: ['\u8a00\u60c5', '\u73b0\u8a00', '\u53e4\u8a00', '\u751c\u5ba0', '\u79bb\u5a5a', '\u840c\u5b9d', '\u5973\u4e3b', '\u5a5a\u604b', '\u5bab\u6597', '\u5b85\u6597'] },
  { id: 'uncategorized', label: '\u672a\u5206\u7c7b', keywords: [] },
]

const AI_PROGRESS_PHASES = {
  prepare: '\u51c6\u5907\u4e0a\u4e0b\u6587',
  route: '\u5224\u65ad\u5f71\u54cd\u8303\u56f4',
  patch: '\u6574\u7406\u53d8\u66f4\u5305',
  compact: '\u538b\u7f29\u957f\u671f\u8bb0\u5fc6',
  check: '\u68c0\u67e5\u672c\u7ae0',
  revise: '\u91cd\u5199\u5019\u9009',
  save: '\u4fdd\u5b58\u5f53\u524d\u7ae0',
  'save-done': '\u5f53\u524d\u7ae0\u5df2\u4fdd\u5b58',
  create: '\u521b\u5efa\u4e0b\u4e00\u7ae0',
  'create-done': '\u65b0\u7ae0\u5df2\u5efa\u7acb',
  outline: '\u751f\u6210\u672c\u7ae0\u7ec6\u7eb2',
  'outline-done': '\u7ec6\u7eb2\u5df2\u5b8c\u6210',
  draft: '\u6b63\u6587\u6d41\u5f0f\u751f\u6210',
  'self-check': '\u81ea\u68c0\u4e0e\u4fee\u8ba2',
  'final-sync': '\u540c\u6b65\u72b6\u6001',
  'natural-prose': '\u53bb AI \u5473\u6821\u51c6',
  'editorial-final-pass': '\u4e3b\u7f16\u7ec8\u5ba1',
  'reader-simulation': '\u8bfb\u8005\u8bd5\u8bfb',
  'batch-chapter': '\u6279\u91cf\u751f\u6210\u4e2d',
  'batch-chapter-done': '\u672c\u7ae0\u5df2\u5e94\u7528',
  apply: '\u5199\u5165\u7ae0\u8282',
  'impact-map': '\u751f\u6210\u5f71\u54cd\u56fe',
  done: '\u4efb\u52a1\u5df2\u5b8c\u6210',
}

const AI_PROGRESS_SCOPE_LABELS = {
  'next-chapter-flow': '\u4e0b\u4e00\u7ae0',
  'ai-edit-candidate': '\u672c\u7ae0\u4fee\u6539',
  'batch-writing-flow': '\u6279\u91cf\u751f\u6210',
  'chapter-outline-batch': '\u6279\u91cf\u7ec6\u7eb2',
  'chapter-outline-single': '\u5355\u7ae0\u7ec6\u7eb2',
  'project-update-package': '\u9879\u76ee\u6c89\u6dc0',
  'project-repair-package': '\u9879\u76ee\u4fee\u590d',
  'memory-compaction': '\u8bb0\u5fc6\u6574\u7406',
}

function readGenres() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GENRE_STORAGE_KEY) || '[]')
    if (Array.isArray(saved) && saved.length > 0) {
      return mergeGenres(saved.filter((item) => item?.id && item?.label))
    }
  } catch {
    // Ignore invalid local drafts.
  }
  return SHELF_GENRES
}

function mergeGenres(customGenres) {
  const defaultIds = new Set(SHELF_GENRES.map((item) => item.id))
  const customOnly = customGenres.filter((item) => !defaultIds.has(item.id))
  return [
    ...SHELF_GENRES.filter((item) => item.id !== 'uncategorized'),
    ...customOnly,
    SHELF_GENRES.find((item) => item.id === 'uncategorized'),
  ].filter(Boolean)
}

function writeGenres(genres) {
  window.localStorage.setItem(GENRE_STORAGE_KEY, JSON.stringify(genres))
}

function normalizeGenreId(value, genres = SHELF_GENRES) {
  const text = String(value || '').trim()
  if (!text) {
    return 'uncategorized'
  }

  const direct = genres.find((genre) => genre.id === text || genre.label === text)
  if (direct) {
    return direct.id
  }

  const matched = genres.find((genre) => {
    if (genre.id === 'all' || genre.id === 'uncategorized') {
      return false
    }
    return genre.keywords?.some((keyword) => text.includes(keyword))
  })
  return matched?.id || 'uncategorized'
}

async function refreshBookMetaByTitle() {
  const api = window.writingWorkbench
  if (!api?.getWorkspaceState || bookMetaLoading) {
    return
  }
  bookMetaLoading = true
  try {
    const state = await api.getWorkspaceState()
    const books = Array.isArray(state?.books) ? state.books : []
    const nextSignature = JSON.stringify(books.map((book) => [book.path, book.title, book.genre, book.updatedAt || '']))
    if (nextSignature === bookMetaSignature) {
      return
    }
    bookMetaByTitle = new Map(books.map((book) => [book.title, book]))
    bookMetaSignature = nextSignature
    queueEnhanceDashboard()
  } catch {
    // The dashboard can still fall back to visible card text.
  } finally {
    bookMetaLoading = false
  }
}

function getActiveGenre(genres) {
  const saved = window.localStorage.getItem(ACTIVE_GENRE_STORAGE_KEY)
  return genres.some((genre) => genre.id === saved) ? saved : 'all'
}

function sanitize(text) {
  return String(text || '').replace(/[<>&"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
  })[char])
}

function createAiRequestId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function resolveBookFromTitle(title) {
  const api = window.writingWorkbench
  if (!api?.getWorkspaceState) {
    return null
  }
  const state = await api.getWorkspaceState()
  const books = Array.isArray(state?.books) ? state.books : []
  const rememberedPath = window.sessionStorage.getItem('ink-engine.currentBookPath')
  const remembered = rememberedPath ? books.find((book) => book.path === rememberedPath) : null
  if (remembered) {
    return remembered
  }
  return books.find((book) => book.title === title)
    || books.find((book) => title && (book.title.includes(title) || title.includes(book.title)))
    || null
}

function ensureOutlineCockpitModal() {
  let modal = document.querySelector('.outline-cockpit-modal-backdrop')
  if (modal) {
    return modal
  }

  modal = document.createElement('div')
  modal.className = 'outline-cockpit-modal-backdrop'
  modal.hidden = true
  modal.innerHTML = `
    <section class="outline-cockpit-modal" role="dialog" aria-modal="true" aria-label="细纲驾驶舱">
      <div class="outline-cockpit-head">
        <div>
          <span>项目驾驶舱</span>
          <h2>细纲目录</h2>
          <p>提前把章节细纲准备好，写正文时就不用每章临时等待规划。</p>
        </div>
        <button type="button" class="secondary-button outline-close">关闭</button>
      </div>
      <div class="outline-cockpit-body">
        <aside class="outline-cockpit-nav">
          <div class="outline-cockpit-metrics"></div>
          <div class="outline-cockpit-actions">
            <label class="outline-target-row">
              <span>补齐到第几章</span>
              <input class="outline-target-count" type="number" min="1" max="300" value="30" />
            </label>
            <div class="outline-quick-actions">
              <button type="button" data-target="10">10</button>
              <button type="button" data-target="30">30</button>
              <button type="button" data-target="50">50</button>
            </div>
            <label class="outline-overwrite-row">
              <input class="outline-overwrite" type="checkbox" />
              <span>覆盖已有细纲</span>
            </label>
            <button type="button" class="primary-button outline-generate">批量生成缺失细纲</button>
          </div>
          <div class="outline-cockpit-list"></div>
        </aside>
        <article class="outline-cockpit-preview">
          <div class="outline-preview-title">
            <div>
              <strong>选择一章查看细纲</strong>
              <span></span>
            </div>
            <div class="outline-preview-actions">
              <button type="button" class="secondary-button outline-generate-current">生成本章细纲</button>
              <button type="button" class="secondary-button outline-regenerate-current">重写本章细纲</button>
            </div>
          </div>
          <pre></pre>
        </article>
      </div>
    </section>
  `
  modal.querySelector('.outline-close').addEventListener('click', () => {
    modal.hidden = true
  })
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.hidden = true
    }
  })
  document.body.appendChild(modal)
  return modal
}

function renderOutlineMetrics(node, index) {
  const coverage = index.total ? Math.round(((index.readyCount || 0) / index.total) * 100) : 0
  node.innerHTML = `
    <div><span>章节</span><strong>${index.total || 0}</strong></div>
    <div><span>已生成</span><strong>${index.readyCount || 0}</strong></div>
    <div><span>缺失</span><strong>${index.missingCount || 0}</strong></div>
    <div><span>覆盖</span><strong>${coverage}%</strong></div>
  `
}

async function renderOutlinePreview(modal, item) {
  const api = window.writingWorkbench
  const title = modal.querySelector('.outline-preview-title strong')
  const meta = modal.querySelector('.outline-preview-title span')
  const pre = modal.querySelector('.outline-cockpit-preview pre')
  const generateButton = modal.querySelector('.outline-generate-current')
  const regenerateButton = modal.querySelector('.outline-regenerate-current')

  modal.dataset.selectedChapterId = item.chapterId || ''
  modal.dataset.selectedChapterFile = item.chapterFile || ''
  modal.dataset.selectedOutlineReady = item.ready ? '1' : ''
  title.textContent = item.chapterTitle || item.chapterId
  meta.textContent = item.ready ? item.outlineFile : '还没有细纲'
  pre.textContent = item.ready ? '读取中...' : '这一章还没有细纲。可以先批量生成，也可以进入章节后单独生成。'
  if (generateButton) {
    generateButton.disabled = !item.chapterFile || item.ready
  }
  if (regenerateButton) {
    regenerateButton.disabled = !item.chapterFile
  }

  if (!item.ready || !api?.readProjectMaterial) {
    return
  }

  try {
    const detail = await api.readProjectMaterial({ bookPath: modal.dataset.bookPath, file: item.outlineFile })
    pre.textContent = detail.content || '细纲为空。'
  } catch (error) {
    pre.textContent = `读取失败：${error instanceof Error ? error.message : '未知错误'}`
  }
}

function renderOutlinePreviewEmpty(modal, message) {
  const title = modal.querySelector('.outline-preview-title strong')
  const meta = modal.querySelector('.outline-preview-title span')
  const pre = modal.querySelector('.outline-cockpit-preview pre')
  const generateButton = modal.querySelector('.outline-generate-current')
  const regenerateButton = modal.querySelector('.outline-regenerate-current')
  modal.dataset.selectedChapterId = ''
  modal.dataset.selectedChapterFile = ''
  modal.dataset.selectedOutlineReady = ''
  if (title) title.textContent = '选择一章查看细纲'
  if (meta) meta.textContent = ''
  if (pre) pre.textContent = message
  if (generateButton) generateButton.disabled = true
  if (regenerateButton) regenerateButton.disabled = true
}

function groupOutlineItemsByVolume(items, volumeSize = 50) {
  const groups = []
  items.forEach((item, index) => {
    const volumeIndex = Math.floor(index / volumeSize)
    if (!groups[volumeIndex]) {
      const start = volumeIndex * volumeSize + 1
      groups[volumeIndex] = {
        title: `第${volumeIndex + 1}卷`,
        range: `${start}-${Math.min(start + volumeSize - 1, items.length)}章`,
        items: [],
      }
    }
    groups[volumeIndex].items.push(item)
  })
  return groups
}

function createOutlineRow({ item, modal, list }) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `outline-row${item.ready ? ' ready' : ' missing'}`
  button.dataset.chapterId = item.chapterId
  button.innerHTML = `
    <span>${sanitize(item.chapterTitle || item.chapterId)}</span>
    <strong>${item.ready ? '已生成' : '缺失'}</strong>
    <small>${sanitize(item.outlineFile || item.chapterFile || '')}</small>
  `
  button.addEventListener('click', () => {
    list.querySelectorAll('.outline-row.active').forEach((node) => node.classList.remove('active'))
    button.classList.add('active')
    renderOutlinePreview(modal, item)
  })
  return button
}

async function generateSelectedOutline(modal, overwrite = false) {
  const api = window.writingWorkbench
  const bookPath = modal.dataset.bookPath
  const chapterFile = modal.dataset.selectedChapterFile
  const chapterId = modal.dataset.selectedChapterId
  if (!api?.generateSingleChapterOutline || !bookPath || !chapterFile) {
    return
  }

  const generateButton = modal.querySelector('.outline-generate-current')
  const regenerateButton = modal.querySelector('.outline-regenerate-current')
  const pre = modal.querySelector('.outline-cockpit-preview pre')
  const previousGenerateText = generateButton?.textContent || ''
  const previousRegenerateText = regenerateButton?.textContent || ''
  if (generateButton) generateButton.disabled = true
  if (regenerateButton) regenerateButton.disabled = true
  if (pre) pre.textContent = overwrite ? '正在重写这一章的细纲...' : '正在生成这一章的细纲...'

  try {
    const result = await api.generateSingleChapterOutline({
      bookPath,
      chapterFile,
      overwrite,
      requestId: createAiRequestId('chapter-outline-single'),
    })
    await refreshOutlineCockpit(modal, result?.outline?.chapterId || chapterId)
  } catch (error) {
    if (pre) {
      pre.textContent = `生成失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    if (generateButton) generateButton.textContent = previousGenerateText || '生成本章细纲'
    if (regenerateButton) regenerateButton.textContent = previousRegenerateText || '重写本章细纲'
  }
}

async function refreshOutlineCockpit(modal, preferredChapterId = '') {
  const api = window.writingWorkbench
  const bookPath = modal.dataset.bookPath
  if (!api?.listChapterOutlineIndex || !bookPath) {
    return
  }

  const list = modal.querySelector('.outline-cockpit-list')
  const metrics = modal.querySelector('.outline-cockpit-metrics')
  list.innerHTML = '<p class="outline-loading">正在读取细纲目录...</p>'

  const index = await api.listChapterOutlineIndex({ bookPath })
  modal.dataset.outlineTotal = String(index.total || 0)
  renderOutlineMetrics(metrics, index)
  const targetInput = modal.querySelector('.outline-target-count')
  if (targetInput && index.recommendedTotalChapters && Number(targetInput.value || 0) < index.recommendedTotalChapters) {
    targetInput.value = String(index.recommendedTotalChapters)
  }

  if (!index.items.length) {
    list.innerHTML = '<p class="outline-loading">还没有章节。先创建章节，或直接用批量生成补齐章节占位。</p>'
    renderOutlinePreviewEmpty(modal, '还没有章节。可以在左侧输入目标章数后批量生成章节占位和细纲。')
    return
  }

  list.replaceChildren()
  const outlineGroups = groupOutlineItemsByVolume(index.items)
  outlineGroups.forEach((volume) => {
    const details = document.createElement('details')
    details.className = 'outline-volume-group'
    const shouldOpen = volume.items.some((item) => item.chapterId === preferredChapterId || item.chapterId === modal.dataset.selectedChapterId)
      || outlineGroups.length === 1
    details.open = shouldOpen
    const readyCount = volume.items.filter((item) => item.ready).length
    details.innerHTML = `
      <summary>
        <span>${sanitize(volume.title)}</span>
        <em>${sanitize(volume.range)} · ${readyCount}/${volume.items.length}</em>
      </summary>
      <div class="outline-volume-list"></div>
    `
    const volumeList = details.querySelector('.outline-volume-list')
    volume.items.forEach((item) => {
      volumeList.appendChild(createOutlineRow({ item, modal, list }))
    })
    list.appendChild(details)
  })

  const preferred = preferredChapterId
    ? list.querySelector(`[data-chapter-id="${CSS.escape(preferredChapterId)}"]`)
    : modal.dataset.selectedChapterId
      ? list.querySelector(`[data-chapter-id="${CSS.escape(modal.dataset.selectedChapterId)}"]`)
      : null
  ;(preferred || list.querySelector('.outline-row'))?.click()
}

async function openOutlineCockpit(book) {
  const api = window.writingWorkbench
  if (!book?.path || !api?.listChapterOutlineIndex) {
    return
  }

  const modal = ensureOutlineCockpitModal()
  modal.hidden = false
  modal.dataset.bookPath = book.path
  modal.querySelector('.outline-cockpit-head h2').textContent = `${book.title} · 细纲目录`
  modal.querySelector('.outline-target-count').value = '30'

  const generateButton = modal.querySelector('.outline-generate')
  const generateCurrentButton = modal.querySelector('.outline-generate-current')
  const regenerateCurrentButton = modal.querySelector('.outline-regenerate-current')
  const targetInput = modal.querySelector('.outline-target-count')
  const overwriteInput = modal.querySelector('.outline-overwrite')
  modal.querySelectorAll('.outline-quick-actions button').forEach((button) => {
    button.onclick = () => {
      targetInput.value = button.dataset.target || '30'
    }
  })
  generateButton.onclick = async () => {
    if (!api.batchGenerateChapterOutlines) {
      return
    }
    const selectedChapterId = modal.dataset.selectedChapterId || ''
    generateButton.disabled = true
    generateButton.textContent = '生成中...'
    try {
      const requestId = createAiRequestId('chapter-outline-batch')
      const targetTotalChapters = Math.max(1, Math.min(Number(targetInput.value) || 30, 300))
      await api.batchGenerateChapterOutlines({
        bookPath: book.path,
        targetTotalChapters,
        overwrite: overwriteInput.checked,
        requestId,
      })
      await refreshOutlineCockpit(modal, selectedChapterId)
    } catch (error) {
      const pre = modal.querySelector('.outline-cockpit-preview pre')
      pre.textContent = `批量生成失败：${error instanceof Error ? error.message : '未知错误'}`
    } finally {
      generateButton.disabled = false
      generateButton.textContent = '批量生成缺失细纲'
    }
  }
  if (generateCurrentButton) {
    generateCurrentButton.onclick = () => generateSelectedOutline(modal, false)
  }
  if (regenerateCurrentButton) {
    regenerateCurrentButton.onclick = () => generateSelectedOutline(modal, true)
  }

  await refreshOutlineCockpit(modal)
}

async function openOutlineCockpitFromCard(card) {
  const title = getCardMeta(card).title
  const book = await resolveBookFromTitle(title)
  if (book) {
    window.sessionStorage.setItem('ink-engine.currentBookPath', book.path)
    await openOutlineCockpit(book)
  }
}

async function openOutlineCockpitFromCurrentEditor() {
  const shell = document.querySelector('.editor-shell')
  const title = shell?.querySelector('.topbar h1, h1')?.textContent?.trim()
  const book = await resolveBookFromTitle(title)
  if (book) {
    await openOutlineCockpit(book)
  }
}

function ensureAiProgressPanel() {
  let panel = document.querySelector('.ai-stream-progress-panel')
  if (panel) {
    return panel
  }

  panel = document.createElement('section')
  panel.className = 'ai-stream-progress-panel'
  panel.hidden = true
  panel.innerHTML = `
    <div class="ai-stream-progress-head">
      <span></span>
      <strong></strong>
      <button type="button" title="\u505c\u6b62\u751f\u6210">\u505c\u6b62</button>
    </div>
    <div class="ai-stream-progress-bar"><i></i></div>
    <p></p>
    <pre></pre>
  `
  panel.querySelector('button').addEventListener('click', () => {
    const requestId = panel.dataset.requestId || ''
    if (!requestId || !window.writingWorkbench?.cancelAiRequest) {
      return
    }
    panel.dataset.status = 'done'
    panel.dataset.requestId = ''
    panel.querySelector('button').hidden = true
    panel.querySelector('p').textContent = '\u5df2\u505c\u6b62\u751f\u6210'
    panel.hidden = true
    void window.writingWorkbench.cancelAiRequest(requestId).catch(() => null)
  })
  document.body.appendChild(panel)
  return panel
}

function renderAiProgress(payload) {
  if (!payload) {
    return
  }

  const panel = ensureAiProgressPanel()
  const phaseLabel = AI_PROGRESS_PHASES[payload.phase] || payload.phase || '\u751f\u6210\u4e2d'
  const preview = String(payload.preview || '').trim()
  const scopeLabel = AI_PROGRESS_SCOPE_LABELS[payload.scope] || payload.label || '\u5199\u4f5c\u4efb\u52a1'

  window.clearTimeout(aiProgressHideTimer)
  panel.hidden = false
  panel.dataset.status = payload.status || 'running'
  panel.dataset.requestId = payload.requestId || ''
  panel.querySelector('.ai-stream-progress-head span').textContent = scopeLabel
  panel.querySelector('.ai-stream-progress-head strong').textContent = phaseLabel
  panel.querySelector('p').textContent = payload.detail || '\u8bf7\u7a0d\u7b49\uff0cAI \u6b63\u5728\u5904\u7406\u3002'
  panel.querySelector('button').hidden = !payload.requestId || payload.status === 'done'

  const previewNode = panel.querySelector('pre')
  if (preview) {
    previewNode.hidden = false
    previewNode.textContent = preview.length > 900 ? `${preview.slice(-900)}` : preview
  } else {
    previewNode.hidden = true
    previewNode.textContent = ''
  }

  if (payload.status === 'done') {
    aiProgressHideTimer = window.setTimeout(() => {
      panel.hidden = true
    }, 4500)
  }
}

function attachAiProgressListener() {
  if (window.__inkEngineAiProgressAttached) {
    return
  }

  const api = window.writingWorkbench
  if (!api?.onAiTaskProgress) {
    return
  }

  window.__inkEngineAiProgressAttached = true
  api.onAiTaskProgress(renderAiProgress)
}

function splitMajorChangeOrder(content) {
  const text = String(content || '')
  const section = (name) => {
    const pattern = new RegExp(`(?:^|\\n)##\\s*${name}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'u')
    return text.match(pattern)?.[1]?.trim() || ''
  }
  return {
    status: text.match(/应用状态[：:]\s*([^\n]+)/u)?.[1]?.trim() || '待确认',
    conclusion: section('人话结论'),
    scope: section('影响范围'),
    patches: section('具体补丁'),
    impact: section('全项目影响图'),
    verify: section('应用后如何确认'),
  }
}

function enhanceProjectUpdateCandidatePanel() {
  const panel = document.querySelector('.candidate-panel-wide')
  if (!panel || panel.dataset.majorChangeEnhanced === 'true') {
    return
  }

  const titleText = panel.querySelector('.section-title p')?.textContent || ''
  const targetText = panel.textContent || ''
  if (!/项目变更单|资料修复包|大改变更单/u.test(titleText + targetText)) {
    return
  }

  const mainPre = Array.from(panel.querySelectorAll(':scope > details pre, :scope > pre'))
    .find((node) => node.textContent?.includes('# 大改变更单'))
  if (!mainPre) {
    return
  }

  panel.dataset.majorChangeEnhanced = 'true'
  const parsed = splitMajorChangeOrder(mainPre.textContent)
  const card = document.createElement('section')
  card.className = 'major-change-card'
  card.innerHTML = `
    <div class="major-change-head">
      <span>大改确认流</span>
      <strong>${sanitize(parsed.status)}</strong>
      <small>先确认变更单，再写入资料修复记录；不会直接覆盖设定、总纲、角色卡原文。</small>
    </div>
    <div class="major-change-grid">
      <section>
        <h3>改什么</h3>
        <pre>${sanitize(parsed.conclusion || '这次整理没有给出清晰结论。')}</pre>
      </section>
      <section>
        <h3>影响哪些资料</h3>
        <pre>${sanitize(parsed.scope || '暂无影响范围。')}</pre>
      </section>
      <section class="wide">
        <h3>具体补丁</h3>
        <pre>${sanitize(parsed.patches || '暂无补丁。')}</pre>
      </section>
      ${parsed.impact ? `<section class="wide"><h3>全项目影响图</h3><pre>${sanitize(parsed.impact)}</pre></section>` : ''}
      <section class="wide">
        <h3>应用后怎么确认</h3>
        <pre>${sanitize(parsed.verify || '应用后打开资料修复记录查看。')}</pre>
      </section>
    </div>
    <p class="major-change-note">这一步像你和我对话后的“改文件前确认”：先看懂，再应用。应用后会优先影响后续生成，但原始资料不会被整段重写。</p>
  `

  const details = panel.querySelector('.candidate-detail-shell')
  panel.insertBefore(card, details || panel.querySelector('.candidate-actions'))
  if (details) {
    details.open = false
    const summary = details.querySelector('summary')
    if (summary) {
      summary.textContent = '查看原始变更单与技术细节'
    }
  }

  const applyButton = panel.querySelector('.candidate-actions .primary-button')
  if (applyButton && !applyButton.dataset.majorChangeConfirmBound) {
    applyButton.dataset.majorChangeConfirmBound = 'true'
    applyButton.textContent = '确认应用大改变更单'
    applyButton.addEventListener('click', (event) => {
      if (!window.confirm('确认把这份大改变更单写入资料修复记录？原设定/总纲/角色卡不会被直接覆盖，后续生成会优先读取这份变更单。')) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }, true)
  }
}

function getCardRows(card) {
  return Array.from(card.querySelectorAll('dl div')).map((row) => {
    const label = row.querySelector('dt')?.textContent?.trim() || ''
    const value = row.querySelector('dd')?.textContent?.trim() || row.textContent?.trim() || ''
    return { label, value, text: `${label} ${value}`.trim() }
  })
}

function getCardMeta(card) {
  const rows = getCardRows(card)
  const title = card.querySelector('h3')?.textContent?.trim() || '未命名作品'
  const book = bookMetaByTitle.get(title)
  const status = rows.find((row) => /阶段|状态/.test(row.label))?.value || '推进中'
  const task = rows.find((row) => /今日|任务/.test(row.label))?.value || ''
  const risk = rows.find((row) => /风险|提示/.test(row.label))?.value || ''
  const genre = typeof book?.genre === 'string' && book.genre.trim()
    ? book.genre.trim()
    : rows.find((row) => /题材|类型/.test(row.label))?.value || ''
  const searchable = [title, genre, ...rows.map((row) => row.text)].join(' ')
  return { title, status, task, risk, genre, book, searchable }
}

function classifyCard(card, genres) {
  const meta = getCardMeta(card)
  const bookGenre = normalizeGenreId(meta.genre, genres)
  if (bookGenre !== 'uncategorized') {
    card.dataset.bookGenre = bookGenre
    return bookGenre
  }

  const matched = genres.find((genre) => {
    if (genre.id === 'all' || genre.id === 'uncategorized') {
      return false
    }
    return genre.keywords?.some((keyword) => meta.searchable.includes(keyword))
  })
  return matched?.id || 'uncategorized'
}

function decorateCard(card, genreId) {
  const meta = getCardMeta(card)
  card.dataset.bookshelfDecorated = 'true'
  card.dataset.genre = genreId
  card.dataset.bookGenre = genreId
  card.tabIndex = 0

  let metaNode = card.querySelector('.bookshelf-card-meta')
  if (!metaNode) {
    metaNode = document.createElement('div')
    metaNode.className = 'bookshelf-card-meta'
    card.appendChild(metaNode)
  }

  metaNode.innerHTML = `
    <span>${sanitize(meta.status)}</span>
    ${meta.task ? `<small>${sanitize(meta.task)}</small>` : ''}
    ${meta.risk ? `<small class="risk">${sanitize(meta.risk)}</small>` : ''}
  `

  const firstAction = card.querySelector('.book-actions button')
  const actions = card.querySelector('.book-actions')
  if (firstAction && firstAction.dataset.rememberBookPathBound !== 'true') {
    firstAction.dataset.rememberBookPathBound = 'true'
    firstAction.addEventListener('click', async () => {
      const book = await resolveBookFromTitle(meta.title)
      if (book?.path) {
        window.sessionStorage.setItem('ink-engine.currentBookPath', book.path)
      }
    }, { capture: true })
  }
  if (actions && !actions.querySelector('.outline-cockpit-button')) {
    const outlineButton = document.createElement('button')
    outlineButton.type = 'button'
    outlineButton.className = 'secondary-button outline-cockpit-button'
    outlineButton.textContent = '细纲驾驶舱'
    outlineButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      openOutlineCockpitFromCard(card)
    })
    actions.appendChild(outlineButton)
  }
  if (firstAction && card.dataset.bookshelfKeybound !== 'true') {
    card.dataset.bookshelfKeybound = 'true'
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        firstAction.click()
      }
    })
  }
}

function createGenreButton(genre, count, activeId, onSelect) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `genre-rail-item${genre.id === activeId ? ' active' : ''}`
  button.dataset.genreId = genre.id
  button.innerHTML = `
    <span>${sanitize(genre.label)}</span>
    <strong>${count}</strong>
  `
  button.addEventListener('click', () => handleGenreRailClick(genre.id, onSelect))
  return button
}

function handleGenreRailClick(genreId, onSelect) {
  window.localStorage.setItem(ACTIVE_GENRE_STORAGE_KEY, genreId)
  onSelect(genreId)
}

function bindGenreRailDelegation() {
  if (window.__inkEngineGenreRailDelegationBound) {
    return
  }
  window.__inkEngineGenreRailDelegationBound = true
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('.genre-rail-item')
    if (!button) {
      return
    }
    const genreId = button.dataset.genreId
    if (!genreId) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    window.localStorage.setItem(ACTIVE_GENRE_STORAGE_KEY, genreId)
    const booksSection = button.closest('.books-section')
    if (typeof booksSection?.bookshelfRender === 'function') {
      booksSection.bookshelfRender(genreId)
      return
    }
    queueEnhanceDashboard()
  }, true)
}

function createCustomGenreForm(genres, rerender) {
  const form = document.createElement('form')
  form.className = 'genre-custom-form'
  form.innerHTML = `
    <label>
      <span>自定义题材</span>
      <input name="genre" type="text" placeholder="例如 科幻" maxlength="10" />
    </label>
    <button type="submit">加入书架</button>
  `
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const input = form.querySelector('input')
    const label = input.value.trim()
    if (!label) {
      return
    }
    const id = `custom-${Date.now()}`
    const nextGenres = [
      ...genres.filter((genre) => genre.id !== 'uncategorized'),
      { id, label, keywords: [label] },
      genres.find((genre) => genre.id === 'uncategorized') || SHELF_GENRES.at(-1),
    ]
    writeGenres(nextGenres)
    input.value = ''
    rerender(id)
  })
  return form
}

function filterCards(cards, activeGenre) {
  let visibleCount = 0
  cards.forEach((card) => {
    const isVisible = activeGenre === 'all' || card.dataset.genre === activeGenre
    card.hidden = !isVisible
    card.style.display = isVisible ? '' : 'none'
    card.setAttribute('aria-hidden', isVisible ? 'false' : 'true')
    if (isVisible) {
      visibleCount += 1
    }
  })
  return visibleCount
}

function findAiSettingsInputs(panel) {
  const labels = Array.from(panel.querySelectorAll('.form-grid label'))
  const byText = (pattern) => labels.find((label) => pattern.test(label.querySelector('span')?.textContent || ''))?.querySelector('input')
  const inputs = Array.from(panel.querySelectorAll('.form-grid input'))
  return {
    apiKey: byText(/API|Key/i) || inputs[0],
    baseUrl: byText(/Base|URL/i) || inputs[1],
    proxyUrl: byText(/代理|proxy/i) || inputs[2],
    model: byText(/模型|model/i) || inputs[3],
  }
}

function setReactInputValue(input, value) {
  if (!input) {
    return
  }
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')
  if (descriptor?.set) {
    descriptor.set.call(input, value)
  } else {
    input.value = value
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function applyAiProfileToPanel(panel, profileId) {
  const api = window.writingWorkbench
  if (!api?.useAiProfile) {
    return
  }

  const settings = await api.useAiProfile(profileId)
  const inputs = findAiSettingsInputs(panel)
  setReactInputValue(inputs.apiKey, '')
  setReactInputValue(inputs.baseUrl, settings.baseUrl || '')
  setReactInputValue(inputs.proxyUrl, settings.proxyUrl || '')
  setReactInputValue(inputs.model, settings.model || '')
  panel.querySelector('.ai-profile-status').textContent = '已切换到保存配置'
}

function applyAiProviderPresetToPanel(panel, provider) {
  const inputs = findAiSettingsInputs(panel)
  const status = panel.querySelector('.ai-provider-preset-status')
  if (provider === 'deepseek') {
    setReactInputValue(inputs.baseUrl, 'https://api.deepseek.com/v1')
    setReactInputValue(inputs.model, 'deepseek-chat')
    if (status) {
      status.textContent = '已填入 DeepSeek 地址和模型，请粘贴 API Key 后保存。'
    }
    return
  }

  setReactInputValue(inputs.baseUrl, 'https://api.openai.com/v1')
  setReactInputValue(inputs.model, 'gpt-4.1')
  if (status) {
    status.textContent = '已切换为 OpenAI 默认地址和模型。'
  }
}

function maybeAutoFillDeepSeekPreset(panel) {
  if (panel.dataset.aiProviderAutoFilled === 'true') {
    return
  }

  const inputs = findAiSettingsInputs(panel)
  const apiKey = inputs.apiKey?.value?.trim() || ''
  const baseUrl = inputs.baseUrl?.value?.trim() || ''
  const model = inputs.model?.value?.trim() || ''
  const isDefaultOpenAi =
    (!baseUrl || baseUrl === 'https://api.openai.com/v1') &&
    (!model || model === 'gpt-4.1')

  if (apiKey || !isDefaultOpenAi) {
    return
  }

  panel.dataset.aiProviderAutoFilled = 'true'
  applyAiProviderPresetToPanel(panel, 'deepseek')
  const status = panel.querySelector('.ai-provider-preset-status')
  if (status) {
    status.textContent = '已默认填入 DeepSeek 地址和模型，请直接粘贴 API Key。'
  }
}

function handleAiProviderPresetEvent(event) {
  const button = event.target?.closest?.('[data-ai-provider-preset]')
  if (!button) {
    return
  }
  const panel = button.closest('.ai-settings-panel')
  const provider = button.dataset.aiProviderPreset
  if (!panel || !provider) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  applyAiProviderPresetToPanel(panel, provider)
}

function bindAiProviderPresetDelegation() {
  if (window.__inkEngineAiProviderPresetDelegationBound) {
    return
  }
  window.__inkEngineAiProviderPresetDelegationBound = true
  window.__inkEngineApplyAiPreset = (button, provider) => {
    const panel = button?.closest?.('.ai-settings-panel')
    if (!panel || !provider) {
      return false
    }
    applyAiProviderPresetToPanel(panel, provider)
    return false
  }
  document.addEventListener('pointerdown', handleAiProviderPresetEvent, true)
  document.addEventListener('click', handleAiProviderPresetEvent, true)
}

async function deleteAiProfileFromPanel(panel, profileId) {
  const api = window.writingWorkbench
  if (!api?.deleteAiProfile || !profileId) {
    return
  }
  await api.deleteAiProfile(profileId)
  panel.querySelector('.ai-profile-row')?.remove()
  enhanceAiSettingsProfiles()
}

async function enhanceAiSettingsProfiles() {
  const api = window.writingWorkbench
  const panels = Array.from(document.querySelectorAll('.ai-settings-panel'))
  for (const panel of panels) {
    const formGrid = panel.querySelector('.form-grid')
    if (!formGrid) {
      continue
    }

    let presetRow = panel.querySelector('.ai-provider-preset-row')
    if (!presetRow) {
      presetRow = document.createElement('div')
      presetRow.className = 'ai-provider-preset-row'
      presetRow.innerHTML = `
        <strong>快速填入</strong>
        <button type="button" class="secondary-button ai-preset-deepseek" data-ai-provider-preset="deepseek" onpointerdown="return window.__inkEngineApplyAiPreset?.(this, 'deepseek')" onclick="return window.__inkEngineApplyAiPreset?.(this, 'deepseek')">DeepSeek</button>
        <button type="button" class="secondary-button ai-preset-openai" data-ai-provider-preset="openai" onpointerdown="return window.__inkEngineApplyAiPreset?.(this, 'openai')" onclick="return window.__inkEngineApplyAiPreset?.(this, 'openai')">OpenAI</button>
        <small class="ai-provider-preset-status">点 DeepSeek 会自动填写 Base URL 和模型，API Key 仍需手动粘贴。</small>
      `
      panel.insertBefore(presetRow, formGrid)
    }
    if (panel.dataset.aiProviderAutoFilled === 'true') {
      presetRow.querySelector('.ai-provider-preset-status').textContent = '已默认填入 DeepSeek 地址和模型，请直接粘贴 API Key。'
    }
    maybeAutoFillDeepSeekPreset(panel)

    if (!api?.listAiProfiles) {
      continue
    }

    if (panel.querySelector('.ai-profile-row')) {
      continue
    }

    let profiles = []
    try {
      profiles = await api.listAiProfiles()
    } catch {
      profiles = []
    }

    const row = document.createElement('div')
    row.className = 'ai-profile-row'
    row.innerHTML = `
      <label>
        <span>已保存连接</span>
        <select>
          <option value="">手动填写或保存新的连接</option>
          ${profiles.map((profile) => `
            <option value="${sanitize(profile.id)}">${sanitize(profile.label)} · ${sanitize(profile.model)}</option>
          `).join('')}
        </select>
      </label>
      <button type="button" class="secondary-button ai-profile-delete" ${profiles.length ? '' : 'disabled'}>删除</button>
      <small class="ai-profile-status">测试连接成功后会自动保存到这里。</small>
    `

    panel.insertBefore(row, presetRow)

    const select = row.querySelector('select')
    const deleteButton = row.querySelector('.ai-profile-delete')

    select.addEventListener('change', async () => {
      if (!select.value) {
        return
      }
      try {
        await applyAiProfileToPanel(panel, select.value)
      } catch (error) {
        row.querySelector('.ai-profile-status').textContent = error instanceof Error ? error.message : '切换失败'
      }
    })

    deleteButton.addEventListener('click', async () => {
      if (!select.value) {
        return
      }
      try {
        await deleteAiProfileFromPanel(panel, select.value)
      } catch (error) {
        row.querySelector('.ai-profile-status').textContent = error instanceof Error ? error.message : '删除失败'
      }
    })

    const actionButtons = Array.from(panel.querySelectorAll('.panel-actions button'))
    actionButtons.forEach((button) => {
      if (button.dataset.aiProfileRefreshBound === 'true') {
        return
      }
      button.dataset.aiProfileRefreshBound = 'true'
      button.addEventListener('click', () => {
        window.setTimeout(() => {
          panel.querySelector('.ai-profile-row')?.remove()
          enhanceAiSettingsProfiles()
        }, 1400)
      })
    })
  }
}

function ensureShell(booksSection, bookGrid) {
  let shell = booksSection.querySelector(':scope > .bookshelf-layout')
  let rail = booksSection.querySelector(':scope .genre-rail')
  let content = booksSection.querySelector(':scope .bookshelf-content')
  let dashboard = booksSection.querySelector(':scope > .shelf-dashboard')
  let empty = booksSection.querySelector(':scope .bookshelf-filter-empty')

  if (!dashboard) {
    dashboard = document.createElement('div')
    dashboard.className = 'shelf-dashboard'
    booksSection.insertBefore(dashboard, booksSection.firstElementChild?.nextSibling || booksSection.firstChild)
  }

  if (!shell) {
    shell = document.createElement('div')
    shell.className = 'bookshelf-layout'
    rail = document.createElement('aside')
    rail.className = 'genre-rail'
    content = document.createElement('div')
    content.className = 'bookshelf-content'
    bookGrid.parentNode.insertBefore(shell, bookGrid)
    shell.appendChild(rail)
    shell.appendChild(content)
    content.appendChild(bookGrid)
  }

  if (!empty) {
    empty = document.createElement('div')
    empty.className = 'bookshelf-filter-empty'
    empty.innerHTML = '<strong>这个题材下还没有作品</strong><span>新建书籍后会自动按书名和项目资料归类，也可以添加自定义题材。</span>'
    content.appendChild(empty)
  }

  return { dashboard, rail, empty }
}

function renderDashboard(dashboard, totalCount, visibleCount, activeGenre, genres) {
  const active = genres.find((genre) => genre.id === activeGenre) || genres[0]
  dashboard.innerHTML = `
    <div class="shelf-dashboard-copy">
      <span>我的书库</span>
      <strong>${sanitize(active.label)}</strong>
      <small>${activeGenre === 'all' ? '按题材管理作品，进入书内再处理卷与章节。' : '当前只显示这个题材下的作品。'}</small>
    </div>
    <div class="shelf-dashboard-stats">
      <div><span>全部</span><strong>${totalCount}</strong></div>
      <div><span>当前</span><strong>${visibleCount}</strong></div>
      <div><span>题材</span><strong>${Math.max(genres.length - 2, 0)}</strong></div>
    </div>
  `
}

function renderRail(rail, genres, counts, activeGenre, render) {
  rail.replaceChildren()

  const title = document.createElement('div')
  title.className = 'genre-rail-title'
  title.innerHTML = '<strong>题材书架</strong><span>先选题材，再进入作品</span>'
  rail.appendChild(title)

  const list = document.createElement('div')
  list.className = 'genre-rail-list'
  genres.forEach((genre) => {
    list.appendChild(createGenreButton(genre, counts.get(genre.id) || 0, activeGenre, render))
  })
  rail.appendChild(list)
  rail.appendChild(createCustomGenreForm(genres, render))
}

function enhanceDashboard() {
  if (isRendering) {
    return
  }
  const booksSection = document.querySelector('.books-section')
  const bookGrid = booksSection?.querySelector('.book-grid')
  if (!booksSection || !bookGrid) {
    return
  }

  isRendering = true
  booksSection.classList.add('bookshelf-home')
  booksSection.dataset.bookshelfEnhanced = 'true'
  refreshBookMetaByTitle()

  const { dashboard, rail, empty } = ensureShell(booksSection, bookGrid)

  function render(nextActiveGenre) {
    const genres = readGenres()
    const activeGenre = nextActiveGenre || getActiveGenre(genres)
    const cards = Array.from(bookGrid.querySelectorAll('.book-card'))
    const counts = new Map(genres.map((genre) => [genre.id, 0]))
    const remembered = window.localStorage.getItem(ACTIVE_GENRE_STORAGE_KEY)
    const currentActiveGenre = genres.some((genre) => genre.id === remembered) ? remembered : activeGenre

    cards.forEach((card) => {
      card.dataset.genre = ''
      card.dataset.bookGenre = ''
      const genreId = classifyCard(card, genres)
      decorateCard(card, genreId)
      counts.set(genreId, (counts.get(genreId) || 0) + 1)
      counts.set('all', (counts.get('all') || 0) + 1)
    })

    window.localStorage.setItem(ACTIVE_GENRE_STORAGE_KEY, currentActiveGenre)
    const visibleCount = filterCards(cards, currentActiveGenre)
    empty.hidden = cards.length === 0 || visibleCount > 0

    renderDashboard(dashboard, cards.length, visibleCount, currentActiveGenre, genres)
    renderRail(rail, genres, counts, currentActiveGenre, render)
  }

  booksSection.bookshelfRender = render
  render()
  isRendering = false
}

function enhanceProjectOutlineCockpit() {
  const commandCenter = document.querySelector('.editor-shell .project-command-center')
  if (!commandCenter || commandCenter.dataset.outlineCockpitEnhanced === 'true') {
    return
  }

  commandCenter.dataset.outlineCockpitEnhanced = 'true'
  const panel = document.createElement('section')
  panel.className = 'outline-command-card'
  panel.innerHTML = `
    <div>
      <span>前置规划</span>
      <strong>细纲驾驶舱</strong>
      <small>先批量准备细纲，写正文时减少等待；每一章细纲都能单独查看。</small>
    </div>
    <button type="button" class="secondary-button">打开细纲目录</button>
  `
  panel.querySelector('button').addEventListener('click', () => {
    openOutlineCockpitFromCurrentEditor()
  })
  commandCenter.appendChild(panel)
}

function queueEnhanceDashboard() {
  if (renderQueued) {
    return
  }
  renderQueued = true
  window.requestAnimationFrame(() => {
    renderQueued = false
    enhanceDashboard()
    enhanceAiSettingsProfiles()
    enhanceProjectOutlineCockpit()
    enhanceProjectUpdateCandidatePanel()
  })
}

const observer = new MutationObserver(queueEnhanceDashboard)
observer.observe(document.documentElement, { childList: true, subtree: true })
bindGenreRailDelegation()
bindAiProviderPresetDelegation()
attachAiProgressListener()
queueEnhanceDashboard()
