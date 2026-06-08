import fs from 'node:fs/promises'

const app = await fs.readFile('src/App.tsx', 'utf8')
const main = await fs.readFile('electron/main.mjs', 'utf8')
const preload = await fs.readFile('electron/preload.cjs', 'utf8')
const types = await fs.readFile('src/vite-env.d.ts', 'utf8')
const commercialAiSpeed = await fs.readFile('docs/commercial-ai-speed-strategy.md', 'utf8')
const openChapterBody = app.match(/async function openChapter[\s\S]*?\n  const saveChapter/)?.[0] ?? ''
const projectChatReplyBody = main.match(/async function generateProjectChatReply[\s\S]*?\n}\n\nfunction buildProjectUpdatePatchPrompt/)?.[0] ?? ''
const projectChatPromptBody = main.match(/function buildProjectChatPrompt[\s\S]*?\n}\n\nasync function generateProjectChatReply/)?.[0] ?? ''

const checks = [
  {
    name: 'applyCandidate sends selectedChapterFile',
    ok: app.includes('selectedChapterFile: bookDetail.selectedChapter?.file'),
  },
  {
    name: 'apply-candidate preserves selected chapter',
    ok: main.includes('return buildBookDetail(input.bookPath, input.selectedChapterFile)'),
  },
  {
    name: 'material rewrite IPC exposed',
    ok: preload.includes("generateMaterialCandidate: (input) => ipcRenderer.invoke('book:generate-material-candidate', input)"),
  },
  {
    name: 'project chat IPC exposed',
    ok: preload.includes("projectChat: (input) => ipcRenderer.invoke('book:project-chat', input)"),
  },
  {
    name: 'project chat backend registered',
    ok: main.includes("ipcMain.handle('book:project-chat'"),
  },
  {
    name: 'project update package IPC exposed',
    ok: preload.includes("generateProjectUpdatePackage: (input) => ipcRenderer.invoke('book:generate-project-update-package', input)") && preload.includes("applyProjectUpdatePackage: (input) => ipcRenderer.invoke('book:apply-project-update-package', input)"),
  },
  {
    name: 'project update package applies multiple files',
    ok: main.includes('async function applyProjectUpdatePackage') && main.includes("writeProjectMaterialSnapshot(input.bookPath, file, 'before-project-update-package')") && main.includes('update.patch'),
  },
  {
    name: 'ai cancellation channel exists',
    ok: preload.includes("cancelAiRequest: (requestId) => ipcRenderer.invoke('ai:cancel-request', requestId)") && main.includes("ipcMain.handle('ai:cancel-request'"),
  },
  {
    name: 'chat sediment creates project update package',
    ok: app.includes("kind: 'project-update'") && app.includes('generateProjectUpdatePackage') && app.includes("saveChatToMaterial: '整理变更单'"),
  },
  {
    name: 'failed chat sediment preserves conversation summary candidate',
    ok: app.includes('function summarizeProjectChatForFallback') && app.includes('自动沉淀失败') && app.includes('项目对话摘要候选'),
  },
  {
    name: 'project chat draft persists locally per book',
    ok: app.includes('function projectChatDraftStorageKey') && app.includes('window.localStorage.setItem(key, JSON.stringify(pruneProjectChatMessages(projectChatMessages)))') && app.includes('loadProjectChatDraft(detail.book.path)'),
  },
  {
    name: 'project chat draft is pruned and can be cleared',
    ok: app.includes('const maxProjectChatMessages') && app.includes('function pruneProjectChatMessages') && app.includes('clearProjectChatDraft') && app.includes('setProjectChatMessages(pruneProjectChatMessages'),
  },
  {
    name: 'project chat buttons show task-specific busy labels',
    ok: app.includes("activeAiTaskLabel === text.projectChat") && app.includes("activeAiTaskLabel === text.projectUpdatePackage") && app.includes('isProjectChatSending') && app.includes('isProjectUpdateGenerating'),
  },
  {
    name: 'chat sediment compresses long conversations',
    ok: main.includes('function compressProjectChatMessages') && main.includes('function buildProjectUpdateTargetPrompt') && main.includes('compactProjectContextForUpdate(context, targetIds)'),
  },
  {
    name: 'low-risk ai tasks have output limits',
    ok: main.includes('const aiOutputLimits') && main.includes('max_output_tokens: maxOutputTokens') && main.includes('max_tokens: maxOutputTokens') && main.includes('maxOutputTokens: aiOutputLimits.projectUpdateTarget') && main.includes('maxOutputTokens: aiOutputLimits.projectUpdatePatch') && main.includes('maxOutputTokens: aiOutputLimits.testConnection'),
  },
  {
    name: 'project chat uses light context instead of full project context',
    ok: main.includes('async function readLightProjectChatContext') && projectChatReplyBody.includes('const context = await readLightProjectChatContext') && !projectChatReplyBody.includes('readProjectContext(input.bookPath, detail.selectedChapter)'),
  },
  {
    name: 'project chat has no hard output cap',
    ok: projectChatReplyBody.includes('temperature: 0.45') && !projectChatReplyBody.includes('maxOutputTokens'),
  },
  {
    name: 'responses requests can set prompt cache key',
    ok: main.includes('function createPromptCacheKey') && main.includes('prompt_cache_key: promptCacheKey'),
  },
  {
    name: 'responses requests use task-level reasoning effort',
    ok: main.includes('function normalizeReasoningEffort') &&
      main.includes('reasoning: { effort: normalizedReasoningEffort }') &&
      main.includes("reasoningEffort = 'low'") &&
      main.includes("reasoningEffort = 'medium'"),
  },
  {
    name: 'project chat uses chat completions fallback path directly',
    ok: projectChatReplyBody.includes('callOpenAiChatText') && !projectChatReplyBody.includes('promptCacheKey'),
  },
  {
    name: 'project chat retries alternate endpoint when text is empty',
    ok: projectChatReplyBody.includes('retryWithResponses') && projectChatReplyBody.includes('retryWithChatCompletions') && main.includes("endpoint: 'chat/completions'") && main.includes("endpoint: 'responses'"),
  },
  {
    name: 'project chat keeps dynamic conversation after project context for cacheability',
    ok: projectChatPromptBody.indexOf("'# \\u9879\\u76ee\\u8d44\\u6599'") > -1 && projectChatPromptBody.indexOf("'# \\u5bf9\\u8bdd'") > projectChatPromptBody.indexOf("'# \\u9879\\u76ee\\u8d44\\u6599'"),
  },
  {
    name: 'material rewrite type exists',
    ok: types.includes('generateMaterialCandidate:'),
  },
  {
    name: 'material rewrite returns applicable candidate kind',
    ok: main.includes(": 'material'") && types.includes("| 'material'"),
  },
  {
    name: 'material rewrite uses compiled context instead of full project context',
    ok: main.includes('async function readMaterialRewriteContext') && main.includes('const context = await readMaterialRewriteContext') && main.includes('maxOutputTokens: input.materialId ==='),
  },
  {
    name: 'material rewrite generates patch instead of full material',
    ok: main.includes('AI 资料补丁') && main.includes('volumeOutlinePatch: 2400') && main.includes('materialPatch: 1200') && main.includes('const patch = await callOpenAiText') && main.includes('const content = ['),
  },
  {
    name: 'settings can save without new api key',
    ok: main.includes('const existingApiKey = store.get') && main.includes('const apiKey = inputApiKey ||'),
  },
  {
    name: 'test connection uses current form settings without saving',
    ok: app.includes('api.testAiConnection(aiForm)') && preload.includes("testAiConnection: (input) => ipcRenderer.invoke('ai:test-connection', input)") && main.includes("ipcMain.handle('ai:test-connection', async (_event, input)"),
  },
  {
    name: 'ai model name is normalized for api calls',
    ok: main.includes('function normalizeAiModel') && main.includes("replace(/^GPT-/i, 'gpt-')"),
  },
  {
    name: 'ai network errors are user-readable',
    ok: main.includes('function createAiNetworkError') && main.includes('无法连接 AI 服务'),
  },
  {
    name: 'ai proxy can be configured for electron requests',
    ok: main.includes('openaiProxyUrl') && main.includes('session.defaultSession.setProxy') && main.includes('net.fetch') && app.includes('proxyUrlPlaceholder') && types.includes('proxyUrl: string'),
  },
  {
    name: 'responses fallback handles compatible api errors',
    ok: main.includes('[400, 404, 405, 422, 501].includes(response.status)'),
  },
  {
    name: 'chat completions parses array content',
    ok: main.includes('Array.isArray(messageContent)') && main.includes("typeof part?.text === 'string'"),
  },
  {
    name: 'golden first three is project material and context',
    ok: main.includes("id: 'goldenFirstThree'") && main.includes('goldenFirstThreeForCurrentChapter') && main.includes('golden-first-3-chapters.md'),
  },
  {
    name: 'genre rules are project material and writing context',
    ok: main.includes("id: 'genreRules'") && main.includes('genre-rules.md') && main.includes('buildGenreRulesSeed') && main.includes('context.genreRules') && main.includes('ensureGenreRulesMaterial') && types.includes('genreRules: string'),
  },
  {
    name: 'chapter planning and writing enforce genre anti-drift',
    ok: main.includes('\\u672c\\u7ae0\\u9898\\u6750\\u5473\\u9053') && main.includes('\\u4e0d\\u80fd\\u8dd1\\u9898\\u6750') && main.includes('\\u7f51\\u6e38\\u6587\\u9898\\u6750\\u89c4\\u5219') && main.includes('\\u73a9\\u5bb6\\u611f') && main.includes('\\u4e16\\u754c\\u516c\\u544a'),
  },
  {
    name: 'continue writing uses director over task card draft and self check',
    ok: main.includes('async function runChapterWritingDirector') && main.includes('function buildChapterTaskCardPrompt') && main.includes('function buildChapterDraftPrompt') && main.includes('function buildChapterSelfCheckPrompt') && main.includes('const planBundle = useLocalPlanBundle') && main.includes('buildLocalChapterPlanBundle({') && main.includes(': await callOpenAiText({') && main.includes('selfCheck = await callOpenAiText') && app.includes('candidate.directorDetail'),
  },
  {
    name: 'continue candidate auto revises by self check and preserves partial failures',
    ok: main.includes('shouldAutoReviseChapterDraft') && main.includes('function buildChapterSelfCheckRevisionPrompt') && main.includes('selfCheckFailed') && main.includes("directorStatus = 'needs-review'") && types.includes('directorDetail?: string'),
  },
  {
    name: 'cover prompt is project material',
    ok: main.includes("id: 'coverPrompt'") && main.includes('cover-prompt.md') && main.includes('const coverPrompt'),
  },
  {
    name: 'chapter outline target shown before apply',
    ok: app.includes('candidate.targetFile') && app.includes('chapterOutlineSafeHint'),
  },
  {
    name: 'candidate panel explains kind and apply target',
    ok: app.includes('function getCandidateKindLabel') && app.includes('function describeCandidateTarget') && app.includes('应用后会追加到') && app.includes('应用后会写入'),
  },
  {
    name: 'chapter ai candidate is anchored to source chapter',
    ok: app.includes('targetChapterFile?: string') && app.includes('targetChapterFile: targetChapter.file') && app.includes('candidateWrongChapter'),
  },
  {
    name: 'switching chapter preserves pending candidate',
    ok: openChapterBody.includes('async function openChapter') && !openChapterBody.includes('setCandidate(null)'),
  },
  {
    name: 'wrong-chapter candidate auto-opens target before applying',
    ok: app.includes("reason: 'before-apply-candidate-switch'") && app.includes('await api.openChapter(bookDetail.book.path, candidate.targetChapterFile)'),
  },
  {
    name: 'book opens into project prep before writing editor',
    ok: app.includes("type BookMode = 'prep' | 'write'") && app.includes("setBookMode('prep')") && app.includes("bookMode === 'prep'") && app.includes("bookMode === 'write'"),
  },
  {
    name: 'next chapter flow saves current chapter before creating next',
    ok: app.includes('function finishChapterAndStartNext') && app.includes("reason: 'before-finish-chapter-flow'") && app.includes('await createChapter()'),
  },
  {
    name: 'chapter outline is shown in chapter preparation not foundation list',
    ok: app.includes("projectMaterials.filter((material) => material.id !== 'chapterOutline')") && app.includes("projectMaterials.find((material) => material.id === 'chapterOutline')"),
  },
  {
    name: 'commercial ai speed strategy documented',
    ok: commercialAiSpeed.includes('模型分层') && commercialAiSpeed.includes('上下文策略') && commercialAiSpeed.includes('流式输出'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Source contract smoke failed')
}
