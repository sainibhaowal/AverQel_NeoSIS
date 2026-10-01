// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TextShimmer } from '../src/TextShimmer.tsx'

afterEach(cleanup)

describe('TextShimmer', () => {
  it('retains its text span across activity, text, and owner-class changes', () => {
    const view = render(<TextShimmer active className="title">Run</TextShimmer>)
    const span = view.getByText('Run').parentElement?.parentElement
    if (span === null || span === undefined) throw new Error('expected the shimmer root')
    expect(span.tagName).toBe('SPAN')
    expect(span.dataset.shimmer).toBe('true')
    expect(span.classList.contains('title')).toBe(true)

    view.rerender(<TextShimmer active={false}>End</TextShimmer>)
    expect(view.getByText('End').parentElement?.parentElement).toBe(span)
    expect(span.hasAttribute('data-shimmer')).toBe(false)
    expect(span.classList.contains('title')).toBe(false)

    view.rerender(<TextShimmer active>Running</TextShimmer>)
    expect(view.getByText('Running').parentElement?.parentElement).toBe(span)
    expect(span.dataset.shimmer).toBe('true')
  })

})
