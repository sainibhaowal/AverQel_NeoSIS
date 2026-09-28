/** Official LibreOffice payloads used by the self-contained Desktop package. */

export const LIBREOFFICE_VERSION = '26.8.0'

export interface OfficeRuntimeSpec {
  readonly target: string
  readonly filename: string
  readonly url: string
  readonly sha256: string
  readonly archive: 'deb-tar' | 'dmg' | 'msi'
}

const base = `https://download.documentfoundation.org/libreoffice/stable/${LIBREOFFICE_VERSION}`

/** Target-specific payloads published by The Document Foundation. */
export const OFFICE_RUNTIME_SPECS: readonly OfficeRuntimeSpec[] = [
  {
    target: 'linux-x64',
    filename: `LibreOffice_${LIBREOFFICE_VERSION}_Linux_x86-64_deb.tar.gz`,
    url: `${base}/deb/x86_64/LibreOffice_${LIBREOFFICE_VERSION}_Linux_x86-64_deb.tar.gz`,
    sha256: 'd0a6031a3837e48f9854e6d2da6489b9fadbd814afa4741fa32a197741663a22',
    archive: 'deb-tar',
  },
  {
    target: 'linux-arm64',
    filename: `LibreOffice_${LIBREOFFICE_VERSION}_Linux_aarch64_deb.tar.gz`,
    url: `${base}/deb/aarch64/LibreOffice_${LIBREOFFICE_VERSION}_Linux_aarch64_deb.tar.gz`,
    sha256: 'f989b73c31e7e16b3f99475bc5befaffdf42af75f83fe882293e1a0258cc9173',
    archive: 'deb-tar',
  },
  {
    target: 'mac-x64',
    filename: `LibreOffice_${LIBREOFFICE_VERSION}_MacOS_x86-64.dmg`,
    url: `${base}/mac/x86_64/LibreOffice_${LIBREOFFICE_VERSION}_MacOS_x86-64.dmg`,
    sha256: '2dcbce4894e01bc1ecd594658e2cbda70ff7bfcd0b310f35d38887797172d09e',
    archive: 'dmg',
  },
  {
    target: 'mac-arm64',
    filename: `LibreOffice_${LIBREOFFICE_VERSION}_MacOS_aarch64.dmg`,
    url: `${base}/mac/aarch64/LibreOffice_${LIBREOFFICE_VERSION}_MacOS_aarch64.dmg`,
    sha256: '8858d8058da4f862f47559486814e65efc27294da67c5e4bb56b006b1ee59f89',
    archive: 'dmg',
  },
  {
    target: 'win-x64',
    filename: `LibreOffice_${LIBREOFFICE_VERSION}_Win_x86-64.msi`,
    url: `${base}/win/x86_64/LibreOffice_${LIBREOFFICE_VERSION}_Win_x86-64.msi`,
    sha256: '4aa6c6e1895f4055104effcb556bd3362d20c6ad707c149543304f395ef9db95',
    archive: 'msi',
  },
]

/**
 * Find the pinned payload for one build target.
 * @param target - Desktop platform and architecture name.
 * @returns The verified download description.
 */
export function officeRuntimeSpec(target: string): OfficeRuntimeSpec {
  const spec = OFFICE_RUNTIME_SPECS.find(candidate => candidate.target === target)
  if (spec === undefined) throw new Error(`desktop office: no pinned LibreOffice payload for ${target}`)
  return spec
}
