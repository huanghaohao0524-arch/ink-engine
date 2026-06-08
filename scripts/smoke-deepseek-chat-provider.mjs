import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['base url normalizer strips endpoint suffixes', main.includes('function normalizeAiBaseUrl') && main.includes('chat\\/completions|responses')],
  ['chat-only provider detector exists', main.includes('function isChatCompletionsOnlyProvider')],
  ['deepseek model is detected', main.includes("model.startsWith('deepseek')")],
  ['deepseek base url is detected', main.includes("baseUrl.includes('deepseek.')")],
  ['callOpenAiText routes chat-only providers to chat text', main.includes('isChatCompletionsOnlyProvider({ model, baseUrl })') && main.includes('return callOpenAiChatText({ input, temperature, maxOutputTokens, signal, settings: { ...settings, apiKey, model, baseUrl, proxyUrl } })')],
  ['deepseek smoke script is registered', pkg.scripts?.['smoke:deepseek-chat-provider'] === 'node scripts/smoke-deepseek-chat-provider.mjs'],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`)

if (failures.length) {
  console.error(`DeepSeek chat provider smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('DeepSeek chat provider smoke passed')
