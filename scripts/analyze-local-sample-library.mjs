import { execFileSync } from 'node:child_process'
import path from 'node:path'

const DEFAULT_LIBRARY = 'D:/ai/写作/写作样本库'
const DEFAULT_BUNDLE = 'build/writing-fingerprints'

function parseArgs(argv) {
  const args = new Map()

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item.startsWith('--')) {
      args.set(item.slice(2), argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true)
    }
  }

  return {
    libraryPath: path.resolve(String(args.get('library') ?? DEFAULT_LIBRARY)),
    bundlePath: path.resolve(String(args.get('bundle') ?? DEFAULT_BUNDLE)),
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))

  execFileSync(process.execPath, [
    path.resolve('scripts/analyze-sample-fingerprints-cli.mjs'),
    '--library',
    options.libraryPath,
    '--bundle',
    options.bundlePath,
  ], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  execFileSync(process.execPath, [
    path.resolve('scripts/build-fingerprint-growth-report.mjs'),
    '--library',
    options.libraryPath,
  ], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
}

main()
