import type { TurnBoundaryProjection } from './types.ts'
import type {} from '@averqel/neosis-session-projection'

declare module '@averqel/neosis-session-projection/types' {
  interface SessionProjectionStateMap {
    /** The agent session's open/last turn and step boundary facts (whole value). */
    turnBoundary: TurnBoundaryProjection
  }
}

export {}
