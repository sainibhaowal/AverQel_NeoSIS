import { existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'tsdown'

const generatedDir = join(import.meta.dirname, 'lib')
if (existsSync(generatedDir)) {
  for (const entry of readdirSync(generatedDir)) {
    if (/^runner-launch-[\w-]+\.js(?:\.map)?$/u.test(entry)) unlinkSync(join(generatedDir, entry))
  }
}

export default defineConfig({
  entry: {
    index: 'lib/types/index.js',
    runner: 'lib/types/bin.js',
    output: 'lib/types/output.js',
  },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
