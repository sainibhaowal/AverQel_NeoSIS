/** CSS activity and reduced-motion rules that jsdom does not execute. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/TextShimmer.module.css', import.meta.url), 'utf8')

describe('TextShimmer styles', () => {
  it('animates active text and disables motion and transparent fill for reduced motion', () => {
    expect(css).toMatch(/\.sweep\s*\{[^}]*animation-name: neosis-row-shimmer-sweep/s)
    expect(css).toMatch(/@keyframes neosis-row-shimmer-sweep\s*\{/s)
    expect(css).toMatch(/@keyframes neosis-row-shimmer-highlight\s*\{/s)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.decoration\s*\{[^}]*display: none;/s)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.sweep, \.highlight\s*\{[^}]*animation: none;/s)
  })
})
