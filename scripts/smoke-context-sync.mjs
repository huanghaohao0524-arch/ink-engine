import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const bookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-sync-'))
const folders = ['\u8bbe\u5b9a', '\u89d2\u8272', '\u8ffd\u8e2a']
await Promise.all(folders.map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))

const targets = [
  ['\u8bbe\u5b9a/core-setting.md', '# setting\n', '- new setting'],
  ['\u89d2\u8272/main-character.md', '# main\n', '- main change'],
  ['\u89d2\u8272/supporting-characters.md', '# supporting\n', '- supporting change'],
  ['\u89d2\u8272/minor-characters.md', '# minor\n', '- minor record'],
  ['\u8ffd\u8e2a/tracking.md', '# tracking\n', '- new clue'],
]

for (const [file, initial, patch] of targets) {
  const target = path.join(bookPath, file)
  await fs.writeFile(target, initial, 'utf8')
  await fs.appendFile(target, `\n## sync\n\n${patch}\n`, 'utf8')
}

const results = await Promise.all(targets.map(async ([file, , patch]) => {
  const content = await fs.readFile(path.join(bookPath, file), 'utf8')
  return { file, ok: content.includes(patch) }
}))

console.log(JSON.stringify({ bookPath, results }, null, 2))

if (results.some((result) => !result.ok)) {
  throw new Error('Context sync smoke failed')
}
