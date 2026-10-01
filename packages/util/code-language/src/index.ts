/**
 * Shared filename-to-language selection for NeoSIS code previews, diffs, and
 * persisted filesystem read metadata.
 *
 * The extension table is adapted from DeepSeek Harness dsh-v0.2.0-rc.2 and
 * remains stateless so host and browser consumers use the same decisions.
 * @module @averqel/neosis-util-code-language
 */

/** Recognized extensions grouped by the canonical grammar language id. */
const LANGUAGE_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  typescript: ['ts', 'tsx', 'mts', 'cts'],
  javascript: ['js', 'jsx', 'mjs', 'cjs'],
  shellscript: ['sh', 'bash', 'zsh'],
  fish: ['fish'],
  json: ['json', 'jsonc', 'jsonl', 'ndjson', 'ipynb'],
  csv: ['csv'],
  python: ['py', 'pyw', 'pyi'],
  ruby: ['rb', 'rake', 'gemspec'],
  go: ['go'],
  rust: ['rs'],
  java: ['java'],
  c: ['c', 'h'],
  cpp: ['cc', 'cpp', 'cxx', 'hh', 'hpp', 'hxx'],
  csharp: ['cs'],
  kotlin: ['kt', 'kts'],
  swift: ['swift'],
  php: ['php'],
  yaml: ['yaml', 'yml'],
  toml: ['toml'],
  ini: ['ini', 'conf', 'cfg', 'properties'],
  dotenv: ['env'],
  log: ['log'],
  diff: ['diff', 'patch'],
  http: ['http'],
  markdown: ['md', 'markdown'],
  mdx: ['mdx'],
  rst: ['rst'],
  latex: ['tex', 'sty', 'cls'],
  bibtex: ['bib'],
  asciidoc: ['adoc'],
  html: ['html', 'htm', 'xhtml'],
  css: ['css'],
  scss: ['scss'],
  less: ['less'],
  sql: ['sql'],
  xml: ['xml', 'xsd', 'xsl', 'xslt', 'plist', 'svg'],
  lua: ['lua'],
  bat: ['bat', 'cmd'],
  powershell: ['ps1', 'psm1', 'psd1'],
  r: ['r'],
  julia: ['jl'],
  dart: ['dart'],
  scala: ['scala'],
  clojure: ['clj', 'cljs', 'edn'],
  erlang: ['erl', 'hrl'],
  elixir: ['ex', 'exs'],
  haskell: ['hs'],
  fsharp: ['fs', 'fsi', 'fsx'],
  vb: ['vb'],
  perl: ['pl', 'pm'],
  verilog: ['v'],
  'system-verilog': ['sv', 'svh'],
  graphql: ['graphql', 'gql'],
  proto: ['proto'],
  hcl: ['tf', 'tfvars', 'hcl'],
  nix: ['nix'],
  vue: ['vue'],
  svelte: ['svelte'],
  make: ['makefile', 'mk'],
  cmake: ['cmake'],
  groovy: ['gradle', 'groovy'],
}

const LANGUAGES = new Map(Object.entries(LANGUAGE_EXTENSIONS)
  .flatMap(([language, extensions]) => extensions.map(extension => [extension, language] as const)))

/** Every recognized suffix, exactly once, for preview registries. */
export const CODE_HIGHLIGHT_EXTENSIONS: readonly string[] = [...LANGUAGES.keys()]

const READ_LANG_BY_EXTENSION = new Map<string, string>([
  ['tsx', 'tsx'], ['jsx', 'jsx'], ['tf', 'tf'], ['tfvars', 'tfvars'], ['gradle', 'gradle'],
])

/** Short ids retained in the filesystem read metadata persisted in sessions. */
const SHORT_BY_LANGUAGE: Readonly<Record<string, string>> = {
  typescript: 'ts', javascript: 'js', shellscript: 'sh', fish: 'fish', json: 'json', csv: 'csv',
  python: 'py', ruby: 'rb', go: 'go', rust: 'rs', java: 'java', c: 'c', cpp: 'cpp', csharp: 'cs',
  kotlin: 'kotlin', swift: 'swift', php: 'php', yaml: 'yaml', toml: 'toml', ini: 'ini', dotenv: 'env',
  log: 'log', diff: 'diff', http: 'http', markdown: 'md', mdx: 'mdx', rst: 'rst', latex: 'tex',
  bibtex: 'bib', asciidoc: 'adoc', html: 'html', css: 'css', scss: 'scss', less: 'less', sql: 'sql',
  xml: 'xml', lua: 'lua', bat: 'bat', powershell: 'ps1', r: 'r', julia: 'jl', dart: 'dart', scala: 'scala',
  clojure: 'clj', erlang: 'erl', elixir: 'ex', haskell: 'hs', fsharp: 'fs', vb: 'vb', perl: 'pl', verilog: 'v',
  'system-verilog': 'sv', graphql: 'graphql', proto: 'proto', hcl: 'hcl', nix: 'nix', vue: 'vue', svelte: 'svelte',
  make: 'make', cmake: 'cmake', groovy: 'groovy',
}

function extensionForPath(path: string): string | undefined {
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  const base = path.slice(slash + 1)
  const dot = base.lastIndexOf('.')
  return dot < 0 ? undefined : base.slice(dot + 1).toLowerCase()
}

/**
 * Resolve a path to the canonical language id used by the client highlighter.
 * @param path - A decoded POSIX or Windows path.
 * @returns The canonical language id, or `undefined` for an unrecognized suffix.
 */
export function languageForPath(path: string): string | undefined {
  const extension = extensionForPath(path)
  return extension === undefined ? undefined : LANGUAGES.get(extension)
}

/**
 * Resolve a path to the short language id persisted in filesystem read metadata.
 * @param path - The model-facing path reported by the read tool.
 * @returns A stable short id, or `undefined` for an unrecognized suffix.
 */
export function readLangHintForPath(path: string): string | undefined {
  const extension = extensionForPath(path)
  if (extension === undefined) return undefined
  const language = LANGUAGES.get(extension)
  return language === undefined ? undefined : READ_LANG_BY_EXTENSION.get(extension) ?? SHORT_BY_LANGUAGE[language]
}
