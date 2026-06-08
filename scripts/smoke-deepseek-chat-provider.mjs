import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const enhancerStyles = fs.readFileSync('public/bookshelf-enhancer.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['base url normalizer strips endpoint suffixes', main.includes('function normalizeAiBaseUrl') && main.includes('chat\\/completions|responses')],
  ['chat-only provider detector exists', main.includes('function isChatCompletionsOnlyProvider')],
  ['deepseek model is detected', main.includes("model.startsWith('deepseek')")],
  ['deepseek base url is detected', main.includes("baseUrl.includes('deepseek.')")],
  ['callOpenAiText routes chat-only providers to chat text', main.includes('isChatCompletionsOnlyProvider({ model, baseUrl })') && main.includes('return callOpenAiChatText({ input, temperature, maxOutputTokens, signal, settings: { ...settings, apiKey, model, baseUrl, proxyUrl } })')],
  ['deepseek preset fills editable settings form', app.includes("applyAiProviderPreset('deepseek')") && app.includes("baseUrl: 'https://api.deepseek.com/v1'") && app.includes("model: 'deepseek-chat'")],
  ['deepseek preset is injected into legacy runtime settings panel', enhancer.includes('ai-provider-preset-row') && enhancer.includes('https://api.deepseek.com/v1') && enhancer.includes('deepseek-chat')],
  ['legacy runtime preset uses delegated pointer/click handling', enhancer.includes('function bindAiProviderPresetDelegation') && enhancer.includes("document.addEventListener('pointerdown', handleAiProviderPresetEvent, true)") && enhancer.includes('data-ai-provider-preset="deepseek"')],
  ['legacy runtime preset has inline pointer fallback', enhancer.includes('window.__inkEngineApplyAiPreset') && enhancer.includes('onpointerdown="return window.__inkEngineApplyAiPreset') && enhancer.includes("onclick=\"return window.__inkEngineApplyAiPreset")],
  ['legacy runtime defaults unconfigured settings to deepseek', enhancer.includes('function maybeAutoFillDeepSeekPreset') && enhancer.includes("status.textContent = '已默认填入 DeepSeek 地址和模型，请直接粘贴 API Key。'")],
  ['legacy runtime does not rebuild preset row while typing', !enhancer.includes("panel.querySelectorAll('.ai-provider-preset-row')).forEach((row) => row.remove())") && enhancer.includes("let presetRow = panel.querySelector('.ai-provider-preset-row')")],
  ['legacy runtime keeps AI settings controls focusable by click', enhancer.includes('function bindAiSettingsControlFocusGuard') && enhancer.includes("document.addEventListener('pointerup', handleAiSettingsControlFocus, true)") && enhancer.includes("'.ai-settings-panel input, .ai-settings-panel textarea, .ai-settings-panel select'")],
  ['legacy runtime shows AI settings input focus visibly', enhancerStyles.includes('.ai-settings-panel input:focus') && enhancerStyles.includes('box-shadow: 0 0 0 3px')],
  ['legacy runtime preset uses React-compatible input events', enhancer.includes('setReactInputValue(inputs.baseUrl') && enhancer.includes("new Event('input', { bubbles: true })")],
  ['AI settings inputs use stable updater', app.includes('function updateAiForm') && app.includes('onChange={(event) => updateAiForm({ apiKey: event.target.value })}') && app.includes('onChange={(event) => updateAiForm({ baseUrl: event.target.value })}')],
  ['AI settings submit disabled state is explicit', app.includes('isAiSettingsSubmitDisabled') && app.includes('disabled={isAiSettingsSubmitDisabled}')],
  ['deepseek smoke script is registered', pkg.scripts?.['smoke:deepseek-chat-provider'] === 'node scripts/smoke-deepseek-chat-provider.mjs'],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`DeepSeek chat provider smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('DeepSeek chat provider smoke passed')
