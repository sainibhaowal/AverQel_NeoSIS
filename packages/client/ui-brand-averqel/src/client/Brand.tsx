import { FishLogo } from '@averqel/neosis-client-ui-primitives'
import type { SidebarBrandMarkOwnerProps } from '@averqel/neosis-client-ui-sidebar/client'

/**
 * Render the AverQel NeoSIS mascot mark.
 * @param props - Host-supplied mark presentation.
 * @returns the AverQel NeoSIS logo mark.
 */
export function AverQelBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <FishLogo size={size} />
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
