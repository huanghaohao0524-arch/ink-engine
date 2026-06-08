import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const detectStart = main.indexOf('function detectGenreRequiredSignals')
const detectEnd = main.indexOf('function buildWritingCompanion90Contract', detectStart)
const detectBody = detectStart >= 0 && detectEnd > detectStart ? main.slice(detectStart, detectEnd) : ''

const hardGateStart = main.indexOf('function extractBookScopedGenreSignals')
const hardGateEnd = main.indexOf('function buildGenreRequirement', hardGateStart)
const hardGateBody = hardGateStart >= 0 && hardGateEnd > hardGateStart ? main.slice(hardGateStart, hardGateEnd) : ''

const pickStart = main.indexOf('function pickFingerprintGroups')
const pickEnd = main.indexOf('function buildGenreRulesSeed', pickStart)
const pickBody = pickStart >= 0 && pickEnd > pickStart ? main.slice(pickStart, pickEnd) : ''

const taxonomyStart = main.indexOf('function buildChapterFunctionTaxonomy')
const taxonomyEnd = main.indexOf('function buildGenreEngineProfile', taxonomyStart)
const taxonomyBody = taxonomyStart >= 0 && taxonomyEnd > taxonomyStart ? main.slice(taxonomyStart, taxonomyEnd) : ''

const checks = [
  ['genre detector ignores sample fingerprints', detectBody && !detectBody.includes('context.samplePoolFingerprints')],
  ['hard gate ignores sample and human fingerprints', hardGateBody && !hardGateBody.includes('context.samplePoolFingerprints') && !hardGateBody.includes('context.humanWritingFingerprint')],
  ['fingerprint picker does not fallback to unrelated genres', pickBody.includes('if (!preferred.length)') && pickBody.includes('return []') && pickBody.includes('return matched.slice(0, 4)')],
  ['fingerprint layer declares active genre isolation without hard gate', main.includes('样本指纹只辅助选择题材变量') && main.includes('禁止把其他题材样本信号注入当前正文') && main.includes('不作为硬门禁')],
  ['generic chapter taxonomy avoids webgame-only vocabulary', taxonomyBody.includes('能力/资源兑现章') && taxonomyBody.includes('场景/行动推进章') && taxonomyBody.includes('某类收益') && !taxonomyBody.includes('地图/副本推进章') && !taxonomyBody.includes('上一章已经获得经验奖励')],
  ['package exposes contamination guard smoke', pkg.scripts?.['smoke:genre-contamination-guard'] === 'node scripts/smoke-genre-contamination-guard.mjs'],
  ['core smoke includes contamination guard', pkg.scripts?.['smoke:core']?.includes('smoke:genre-contamination-guard')],
]

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label)

if (failures.length) {
  console.error(`Genre contamination guard smoke failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Genre contamination guard smoke passed')
