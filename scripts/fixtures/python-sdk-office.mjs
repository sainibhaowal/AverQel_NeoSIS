/** Exercise the wheel's external Office package from a shipped neosis profile. */
import { writeFile } from 'node:fs/promises'
import { createConverter } from '@averqel/libreoffice-kit'

export const name = 'python-sdk-office-smoke'

export async function apply(_ctx, config) {
  const converter = await createConverter({ timeoutMs: 120_000 })
  try {
    const result = await converter.render({ inputPath: config.input, outputPath: config.output })
    await writeFile(config.result, JSON.stringify({ ...result, moduleUrl: import.meta.resolve('@averqel/libreoffice-kit') }))
  } finally {
    await converter.dispose()
  }
}
