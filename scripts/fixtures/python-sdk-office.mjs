/** Exercise the wheel's system-LibreOffice adapter from a shipped NeoSIS profile. */
import { writeFile } from 'node:fs/promises'
import { createSystemOfficeConverter } from '@averqel/neosis-office-to-pdf'

export const name = 'python-sdk-office-smoke'

export async function apply(_ctx, config) {
  let converter
  try {
    converter = await createSystemOfficeConverter({
      executable: process.env.NEOSIS_OFFICE_EXECUTABLE ?? 'soffice',
      timeoutMs: 120_000,
    })
    const result = await converter.render({ inputPath: config.input, outputPath: config.output })
    await writeFile(config.result, JSON.stringify({ ...result, moduleUrl: import.meta.resolve('@averqel/neosis-office-to-pdf') }))
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause)
    await writeFile(config.result, JSON.stringify({ backend: 'error', error }))
    throw cause
  } finally {
    if (converter !== undefined) await converter.dispose()
  }
}
