declare module 'semver' {
  /** Return the canonical version for a valid semantic version, or null. */
  export function valid(version: string): string | null
  /** Test a semantic version against a range. */
  export function satisfies(version: string, range: string, options?: { includePrerelease?: boolean }): boolean
  /** Parse a semantic version into its canonical value and build identifiers. */
  export function parse(version: string): { version: string; build: readonly string[] } | null
}
