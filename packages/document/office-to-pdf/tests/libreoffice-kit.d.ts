declare module '@averqel/libreoffice-kit' {
  /** Options accepted by the external Office conversion engine. */
  export interface ConverterOptions {
    readonly [key: string]: unknown
  }

  /** Test-facing conversion engine interface supplied by the external kit. */
  export interface Converter {
    readonly backend: 'native' | 'wasm'
    render(
      paths: { inputPath: string; outputPath: string },
      signal?: AbortSignal,
    ): Promise<{ backend: 'native' | 'wasm'; missingFonts: string[] }>
    dispose(): Promise<void>
  }

  /** Creates a configured conversion engine. */
  export function createConverter(options?: ConverterOptions): Promise<Converter>
}
