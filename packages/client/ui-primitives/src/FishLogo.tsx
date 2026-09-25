import type { IconProps } from './icons/props.ts'

/** Native viewBox of the AverQel NeoSIS mascot mark. */
export const FISH_LOGO_VIEWBOX = { width: 128, height: 96 }

/** Mascot path retained as a stable export for consumers that compose the mark. */
export const FISH_LOGO_PATH = 'M12 27C16 15 28 8 43 10L53 2L53 15C66 15 79 21 90 31C99 39 106 48 116 51C108 58 99 60 90 57C87 69 79 78 67 84C52 91 35 88 23 79C12 71 7 59 8 46C8 38 9 32 12 27C16 23 19 20 24 18L22 2L31 9L43 10Z M70 35A4 4 0 1 0 70 43A4 4 0 1 0 70 35ZM20 50C29 39 42 35 56 39C47 43 41 49 38 57C35 66 39 73 46 80C34 78 25 72 20 64C17 59 17 54 20 50Z'

const AVERQEL_MARK_TRAIL = 'M82 25C91 33 99 43 106 49C98 49 91 52 85 56'

/**
 * Render the AverQel NeoSIS mascot mark.
 * @param props.size - width in px (default 24; height keeps the 4:3 mark ratio).
 * @param props.className - extra class for layout placement.
 * @returns the mark svg (aria-hidden; pair with the wordmark for accessibility).
 */
export function FishLogo({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={(size * FISH_LOGO_VIEWBOX.height) / FISH_LOGO_VIEWBOX.width}
      className={className}
      viewBox={`0 0 ${FISH_LOGO_VIEWBOX.width} ${FISH_LOGO_VIEWBOX.height}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={FISH_LOGO_PATH} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      <path d={AVERQEL_MARK_TRAIL} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".72" />
    </svg>
  )
}
