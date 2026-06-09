import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const enhancer = fs.readFileSync('public/bookshelf-enhancer.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['local base url detector exists in main process', main.includes('function isLocalAiBaseUrl') && main.includes("['localhost', '127.0.0.1', '0.0.0.0', '::1']")],
  ['local providers can omit api key', main.includes('function isApiKeyOptionalProvider') && main.includes('return isLocalAiBaseUrl(settings.baseUrl)')],
  ['local providers use chat completions endpoint', main.includes('function isChatCompletionsOnlyProvider') && main.includes('isLocalAiBaseUrl(baseUrl)')],
  ['blank local api key does not inherit old cloud key', main.includes('keyOptional && inputOwnsApiKey ?') && main.includes("const apiKey = inputApiKey || (keyOptional && inputOwnsApiKey ? ''")],
  ['saved local profiles are considered configured', main.includes('configured: apiKey.length > 0 || isApiKeyOptionalProvider({ model, baseUrl })')],
  ['activating local profiles does not require api key', main.includes('!profile.apiKey && !isApiKeyOptionalProvider(profile)')],
  ['chat text accepts blank api key for local base url', main.includes("!isApiKeyOptionalProvider({ model, baseUrl })") && main.includes("apiKey: typeof apiKey === 'string' ? apiKey.trim() : ''")],
  ['chat request headers omit authorization when api key is blank', main.includes('function createAiRequestHeaders') && main.includes("...(typeof apiKey === 'string' && apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {})")],
  ['non-stream and stream chat calls use optional auth headers', (main.match(/headers: createAiRequestHeaders\(apiKey\)/g) || []).length >= 2],
  ['React source exposes local provider presets', app.includes("applyAiProviderPreset('ollama')") && app.includes("applyAiProviderPreset('lmstudio')")],
  ['React source fills Ollama and LM Studio base urls', app.includes('http://127.0.0.1:11434/v1') && app.includes('http://127.0.0.1:1234/v1')],
  ['React source allows local submit without key', app.includes('function isLocalAiBaseUrlValue') && app.includes('!isLocalAiBaseUrlValue(aiForm.baseUrl)')],
  ['legacy runtime enhancer injects local provider preset buttons', enhancer.includes('data-ai-provider-preset="ollama"') && enhancer.includes('data-ai-provider-preset="lmstudio"')],
  ['legacy runtime enhancer clears key for local presets', enhancer.includes("setReactInputValue(inputs.apiKey, '')")],
  ['legacy runtime enhancer fills local base urls', enhancer.includes('http://127.0.0.1:11434/v1') && enhancer.includes('http://127.0.0.1:1234/v1')],
  ['legacy runtime enhancer unlocks save/test buttons for local urls', enhancer.includes('function syncAiSettingsLocalSubmitState') && enhancer.includes("label.includes('测试')") && enhancer.includes("label.includes('保存')")],
  ['legacy runtime enhancer rechecks local submit state on input', enhancer.includes("document.addEventListener('input', handleAiSettingsInputForLocalSubmit, true)")],
  ['local llm smoke script is registered', pkg.scripts?.['smoke:local-llm-provider'] === 'node scripts/smoke-local-llm-provider.mjs'],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`Local LLM provider smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Local LLM provider smoke passed')
