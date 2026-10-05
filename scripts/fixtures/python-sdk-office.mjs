/** Exercise the wheel's system-LibreOffice adapter from a shipped NeoSIS profile. */
import { readFile, writeFile } from 'node:fs/promises'

export const name = 'python-sdk-office-smoke'
export const inject = ['officeToPdf']

export async function apply(ctx, config) {
  const input = await readFile(config.input)
  try {
    const result = await ctx.officeToPdf.convert({
      extension: 'docx',
      priority: 'foreground',
      source: {
        key: `python-sdk-office-smoke:${config.input}`,
        version: 'fixture',
        bytes: input.byteLength,
        async read(signal, maxBytes) {
          signal.throwIfAborted()
          if (input.byteLength > maxBytes) throw new Error('fixture input exceeded the converter limit')
          return { bytes: input, version: 'fixture' }
        },
      },
    })
    await writeFile(config.output, result.pdf)
    await writeFile(config.result, JSON.stringify({
      backend: 'system',
      adapter: '@averqel/neosis-office-to-pdf',
      missingFonts: result.missingFonts,
    }))
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause)
    await writeFile(config.result, JSON.stringify({ backend: 'error', error }))
    throw cause
  }
}
