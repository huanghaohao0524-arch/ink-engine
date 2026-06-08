import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')

const checks = [
  {
    name: 'old messages are summarized separately',
    ok: main.includes("'# \\u65e7\\u5bf9\\u8bdd\\u6458\\u8981'") && main.includes("'# \\u6700\\u8fd1\\u5bf9\\u8bdd'"),
  },
  {
    name: 'project update target pass limits update files',
    ok: main.includes('const projectUpdateMaxMaterials = 3') && main.includes('.slice(0, projectUpdateMaxMaterials)'),
  },
  {
    name: 'target selection failure falls back instead of aborting sediment',
    ok: main.includes('try {') && main.includes('targetMaterials = []') && main.includes('fallbackTargetMaterialIds'),
  },
  {
    name: 'final project update is a change order patch',
    ok: main.includes('function buildProjectUpdatePatchPrompt') && main.includes('normalizeProjectUpdatePatches') && main.includes('projectUpdatePatch: 2200'),
  },
  {
    name: 'change order patch has bounded output',
    ok: main.includes('projectUpdatePatch: 2200') && main.includes('maxOutputTokens: aiOutputLimits.projectUpdatePatch'),
  },
  {
    name: 'applying change order appends local material patches',
    ok: main.includes('const existing = (await pathExists(target))') && main.includes('update.patch') && main.includes('createTimestamp()'),
  },
  {
    name: 'final project update prompt uses compact target context',
    ok: main.includes('const targetIds = materials.map((material) => material.id)') && main.includes('compactProjectContextForUpdate(context, targetIds)'),
  },
  {
    name: 'final project update prompt no longer keeps last 20 full messages',
    ok: !main.includes('.slice(-20)'),
  },
  {
    name: 'material rewrite has bounded compiled context',
    ok: main.includes('readMaterialRewriteContext') && main.includes('volumeOutlinePatch: 1600') && main.includes('chapterOutlinePatch: 1200') && main.includes('materialPatch: 1200'),
  },
  {
    name: 'material rewrite produces append patch not full rewrite',
    ok: main.includes('const patch = await callOpenAiText') && main.includes('patch.trim()') && main.includes('volumeOutlinePatch') && !main.includes('volumeOutlineRewrite'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Chat sediment compression smoke failed')
}
