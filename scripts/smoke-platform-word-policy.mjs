import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')

const checks = [
  ['platform word policies exist', main.includes('const platformWordPolicies = {')],
  ['qidian target is higher', main.includes("'\\u8d77\\u70b9': {\n    min: 2200,\n    target: 2400,\n    max: 2600")],
  ['fanqie target is shorter', main.includes("'\\u756a\\u8304': {\n    min: 1800,\n    target: 2000,\n    max: 2200")],
  ['qimao target exists', main.includes("'\\u4e03\\u732b': {\n    min: 2000,\n    target: 2200,\n    max: 2400")],
  ['jinjiang target exists', main.includes("'\\u664b\\u6c5f': {\n    min: 2500,\n    target: 3000,\n    max: 3500")],
  ['platform fit includes deterministic word rule', main.includes('formatPlatformWordRule(platform)')],
  ['project package normalizer ignores model word drift', main.includes('targetWordsPerChapter: formatPlatformWordRule(platform)')],
  ['create book uses platform target words', main.includes("targetWords: resolveTargetWordsForBook({ platform: rawProjectPackage?.platform || book.platform })")],
  ['list chapters resolves missing target words from platform', main.includes('targetWords: resolveTargetWordsForBook(config, meta?.targetWords)')],
  ['new chapters inherit platform target words', main.includes('targetWords: resolveTargetWordsForBook(config, input.targetWords)')],
  ['draft prompt includes word requirement', main.includes('buildChapterWordRequirement(book, selectedChapter)')],
  ['draft max output tokens follows platform bounds', main.includes('function getChapterWordBounds') && main.includes('Math.ceil(bounds.max * multiplier)')],
  ['fanqie output limit is stricter', main.includes("platform === '\\u756a\\u8304' ? 1.18")],
  ['generated chapter content is word-budget gated', main.includes('async function enforceChapterWordBudget') && main.includes('buildChapterWordBudgetRevisionPrompt')],
  ['draft and revisions enforce word budget', main.includes("sourceLabel: 'initial draft'") && main.includes("sourceLabel: 'self-check revision'") && main.includes("sourceLabel: 'execution-gate revision'") && main.includes("sourceLabel: 'editorial final pass revision'")],
  ['feedback rewrites enforce word budget', main.includes("reason: 'feedback rewrite must keep platform chapter length'") && main.includes("reason: 'feedback editorial revision must keep platform chapter length'")],
  ['platform writing strategy exists', main.includes('function getPlatformWritingStrategy') && main.includes('volumeRule') && main.includes('chapterRule') && main.includes('budgetRevisionRule')],
  ['all built-in platforms have outline strategy', ['\\u756a\\u8304', '\\u8d77\\u70b9', '\\u4e03\\u732b', '\\u664b\\u6c5f'].every((platform) => main.includes(`'${platform}': {`))],
  ['unknown platform asks for research fallback', main.includes('needsPlatformResearch: true') && main.includes('This platform has no built-in playbook yet')],
  ['platform-specific compression is not fanqie-only', main.includes('Platform-specific compression rule') && !main.includes('For Fanqie, shorter is better')],
  ['outline density expands chapter count by platform', main.includes("minVolumeChapters: 24") && main.includes("targetVolumeChapters: 32") && main.includes("targetVolumeChapters: 20")],
  ['outline prompts include platform density contract', main.includes('const planningRule = buildPlatformOutlinePlanningRule({ book, selectedChapter, mode })')],
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`Platform word policy smoke failed: ${label}`)
  }
  process.exit(1)
}

console.log('Platform word policy smoke passed.')
