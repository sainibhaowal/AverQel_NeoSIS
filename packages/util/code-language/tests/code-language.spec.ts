import { describe, expect, it } from 'vitest'
import { CODE_HIGHLIGHT_EXTENSIONS, languageForPath, readLangHintForPath } from '../src/index.ts'

describe('languageForPath', () => {
  it('covers the additional release extensions', () => {
    const expected: Record<string, string> = {
      'build.bat': 'bat', 'deploy.ps1': 'powershell', 'config.fish': 'fish',
      '.env': 'dotenv', 'server.log': 'log', 'change.diff': 'diff', 'api.http': 'http',
      'notebook.ipynb': 'json', 'table.csv': 'csv', 'guide.rst': 'rst', 'paper.tex': 'latex',
      'refs.bib': 'bibtex', 'logo.svg': 'xml', 'analysis.r': 'r', 'model.jl': 'julia',
      'main.dart': 'dart', 'query.gql': 'graphql', 'message.proto': 'proto', 'main.tf': 'hcl',
      'flake.nix': 'nix', 'App.vue': 'vue', 'App.svelte': 'svelte', 'build.gradle': 'groovy',
    }
    for (const [path, language] of Object.entries(expected)) expect(languageForPath(path)).toBe(language)
  })

  it('is case-insensitive, handles Windows separators, and rejects ambiguous names', () => {
    expect(languageForPath('C:\\path\\X.PS1')).toBe('powershell')
    expect(languageForPath('src/a.TSX')).toBe('typescript')
    expect(languageForPath('a.py.bak')).toBeUndefined()
    expect(languageForPath('.gitignore')).toBeUndefined()
    expect(languageForPath('foo.constructor')).toBeUndefined()
    expect(languageForPath('secret.pem')).toBeUndefined()
    expect(languageForPath('table.tsv')).toBeUndefined()
  })
})

describe('readLangHintForPath', () => {
  it('keeps existing short ids and uses short ids for new extensions', () => {
    expect(readLangHintForPath('src/a.tsx')).toBe('tsx')
    expect(readLangHintForPath('README.md')).toBe('md')
    expect(readLangHintForPath('build.ps1')).toBe('ps1')
    expect(readLangHintForPath('.env')).toBe('env')
    expect(readLangHintForPath('main.tf')).toBe('tf')
    expect(readLangHintForPath('nomad.hcl')).toBe('hcl')
    expect(readLangHintForPath('build.gradle')).toBe('gradle')
    expect(readLangHintForPath('unknown.bin')).toBeUndefined()
  })
})

describe('CODE_HIGHLIGHT_EXTENSIONS', () => {
  it('contains unique suffixes that resolve back to a language', () => {
    expect(new Set(CODE_HIGHLIGHT_EXTENSIONS).size).toBe(CODE_HIGHLIGHT_EXTENSIONS.length)
    expect(CODE_HIGHLIGHT_EXTENSIONS.length).toBeGreaterThan(100)
    for (const extension of CODE_HIGHLIGHT_EXTENSIONS) expect(languageForPath(`file.${extension}`)).toBeDefined()
  })
})
