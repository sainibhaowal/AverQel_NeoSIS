/** Text activity animation shared by a row and its nested text fragments. */
import { createContext, memo, useContext, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './TextShimmer.module.css'

const DecorativeCopy = createContext<boolean | undefined>(undefined)

/** Text and activity supplied by the owning row. */
export interface TextShimmerProps {
  children: ReactNode
  active?: boolean | undefined
  className?: string | undefined
  contentClassName?: string | undefined
}

function TextContent({ children, className }: Pick<TextShimmerProps, 'children' | 'className'>) {
  const decorative = useContext(DecorativeCopy)
  const generated = decorative === true && typeof children === 'string'
  return <span className={clsx(css.text, className)} data-shimmer-text={generated ? children : undefined}>
    {generated ? null : children}
  </span>
}

/**
 * Render text with an optional moving highlight; inactive text keeps the same node.
 * @param props - localized text, running state, and owner styling.
 * @returns the retained text span.
 */
export const TextShimmer = memo(function TextShimmer({ children, active = false, className, contentClassName }: TextShimmerProps) {
  const decorative = useContext(DecorativeCopy)
  if (decorative !== undefined) return <TextContent className={className}>{children}</TextContent>
  const content = typeof children === 'string' ? <TextContent>{children}</TextContent> : children
  return (
    <span className={clsx(css.root, className)} data-shimmer={active || undefined}>
      <DecorativeCopy.Provider value={false}>
        <span className={clsx(css.content, contentClassName)}>{content}</span>
      </DecorativeCopy.Provider>
      {active && <span className={css.decoration} aria-hidden="true" {...{ inert: '' }}>
        <span className={css.sweep}>
          <DecorativeCopy.Provider value>
            <span className={clsx(css.content, css.highlight, contentClassName)}>{content}</span>
          </DecorativeCopy.Provider>
        </span>
      </span>}
    </span>
  )
})
