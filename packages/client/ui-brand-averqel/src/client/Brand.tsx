import type { SidebarBrandMarkOwnerProps } from '@averqel/neosis-client-ui-sidebar/client'

const MARK_PATH = 'M12 27C16 15 28 8 43 10L53 2L53 15C66 15 79 21 90 31C99 39 106 48 116 51C108 58 99 60 90 57C87 69 79 78 67 84C52 91 35 88 23 79C12 71 7 59 8 46C8 38 9 32 12 27C16 23 19 20 24 18L22 2L31 9L43 10Z M70 35A4 4 0 1 0 70 43A4 4 0 1 0 70 35ZM20 50C29 39 42 35 56 39C47 43 41 49 38 57C35 66 39 73 46 80C34 78 25 72 20 64C17 59 17 54 20 50Z'
const MARK_TRAIL = 'M82 25C91 33 99 43 106 49C98 49 91 52 85 56'

/**
 * Render the AverQel NeoSIS mascot mark.
 * @param props - Host-supplied mark presentation.
 * @returns the AverQel NeoSIS logo mark.
 */
export function AverQelBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return (
    <svg
      width={size}
      height={(size * 96) / 128}
      viewBox="0 0 128 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      <path d={MARK_TRAIL} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".72" />
    </svg>
  )
}
/**
 * Render the AverQel NeoSIS name artwork without its independently slotted mark.
 * @returns the AverQel NeoSIS name wordmark.
 */
export function AverQelBrandName() {
  return (
    <span style={{
      color: 'currentColor',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      fontWeight: 600,
      fontSize: '14px',
      letterSpacing: '0.25px',
    }}>
      AverQel NeoSIS
    </span>
  )
}
