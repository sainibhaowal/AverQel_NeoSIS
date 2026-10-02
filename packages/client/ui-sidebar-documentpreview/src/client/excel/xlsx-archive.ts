/** XLSX preview copies without DrawingML parts; worksheet XML and source bytes remain untouched. */
import { strToU8, unzipSync, zipSync, type Unzipped } from 'fflate'
import { XMLParser } from 'fast-xml-parser'
import type { ExcelUnsupportedFeature } from './model.ts'

/** Owns the unpacked preview copy and its detected unsupported content. */
export class XlsxPreviewArchive {
  /** Detected workbook content that the preview does not display. */
  readonly unsupportedFeatures = new Set<ExcelUnsupportedFeature>()
  private readonly files: Unzipped
  private readonly parts = new Map<string, Uint8Array>()

  /**
   * Read an archive without modifying the borrowed source buffer.
   * @param bytes - Complete XLSX source bytes.
   * @throws When ZIP entries have ASCII case-equivalent names.
   */
  constructor(private readonly bytes: Uint8Array<ArrayBuffer>) {
    this.files = unzipSync(bytes)
    for (const [path, bytes] of Object.entries(this.files)) {
      if (path.endsWith('/')) continue
      const key = partKey(path)
      if (this.parts.has(key)) throw new Error(`Ambiguous XLSX part: ${path}`)
      this.parts.set(key, bytes)
    }
  }

  /**
   * Omit DrawingML parts before ExcelJS parses them; callers must also ignore worksheet drawing references.
   * @returns Source bytes when no parts were omitted, otherwise an uncompressed temporary ZIP.
   */
  withoutDrawings(): Uint8Array<ArrayBuffer> {
    this.validatePackage()
    const entries = Object.entries(this.files)
    const omitted = new Set<string>()
    for (const [path, bytes] of entries) {
      // ExcelJS also discovers unreferenced drawings in its conventional directory.
      if (/^xl\/drawings\/(?:[^/]+\.xml|_rels\/[^/]+\.xml\.rels)$/i.test(path)) omitted.add(partKey(path))
      const owner = relationshipOwner(path)
      if (owner === undefined) continue
      new XMLParser({
        removeNSPrefix: true, ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: false,
        updateTag: (tag: string, _path, attributes: Record<string, unknown>) => {
          const type = typeof attributes.Type === 'string'
            ? attributes.Type.replace(/^http:\/\/purl\.oclc\.org\/ooxml\/officeDocument\/relationships\//, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/') : undefined
          if (tag !== 'Relationship' || attributes.TargetMode === 'External') return tag
          const drawing = type === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing'
          if (!drawing && type !== 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet') return tag
          if (typeof attributes.Target !== 'string') throw new Error('Missing XLSX relationship target')
          const target = resolvePart(owner, attributes.Target)
          const content = this.parts.get(partKey(target))
          if (content === undefined) throw new Error(`Missing XLSX part: ${target}`)
          this.inspectContent(content)
          if (drawing) {
            omitted.add(partKey(target))
            const split = target.lastIndexOf('/')
            omitted.add(partKey(`${target.slice(0, split + 1)}_rels/${target.slice(split + 1)}.rels`))
          }
          return tag
        },
      }).parse(decodeXml(bytes))
    }
    const retained = entries.filter(([path]) => !omitted.has(partKey(path)))
    return retained.length === entries.length ? this.bytes : new Uint8Array(zipSync(Object.fromEntries(retained), { level: 0 }))
  }

  /**
   * Build an ExcelJS-only copy. OOXML permits absolute relationship targets and
   * CDATA text segments; ExcelJS 4.4 does not consistently read either form.
   * The caller-owned archive and {@link withoutDrawings} output stay byte exact.
   * @returns A temporary normalized ZIP for ExcelJS.
   */
  excelJsInput(): Uint8Array<ArrayBuffer> {
    const retained = unzipSync(this.withoutDrawings())
    for (const [path, bytes] of Object.entries(retained)) {
      if (/\/_rels\/[^/]+\.rels$/i.test(path)) retained[path] = strToU8(normalizeRelationships(path, decodeXml(bytes)))
      else if (/\/sharedStrings\.xml$/i.test(path)) retained[path] = strToU8(normalizeCdata(decodeXml(bytes)))
    }
    return new Uint8Array(zipSync(retained, { level: 0 }))
  }

  /** Validate every internal OPC edge and the root/workbook worksheet graph. */
  private validatePackage(): void {
    const relationships = new Map<string, readonly Relationship[]>()
    for (const [path, bytes] of Object.entries(this.files)) {
      const owner = relationshipOwner(path)
      if (owner === undefined) continue
      const parsed = readRelationships(decodeXml(bytes))
      relationships.set(partKey(owner), parsed)
      for (const relation of parsed) {
        // A theme is optional OOXML presentation metadata; ExcelJS correctly
        // falls back to direct colors when its relationship target is absent.
        if (relation.external || relation.type === `${RELATIONSHIP}theme`) continue
        const target = resolvePart(owner, relation.target)
        if (!this.parts.has(partKey(target))) throw new Error(`Missing XLSX part: ${target}`)
      }
    }
    const root = relationships.get('')
    if (root === undefined) return
    const office = root.filter(relation => relation.type === OFFICE_DOCUMENT)
    const [officeRelationship] = office
    if (officeRelationship === undefined || office.length !== 1 || officeRelationship.external) throw new Error('Invalid XLSX officeDocument relationship')
    const workbookPath = resolvePart('', officeRelationship.target)
    const workbook = this.parts.get(partKey(workbookPath))
    if (workbook === undefined) throw new Error(`Missing XLSX workbook: ${workbookPath}`)
    const workbookRelationships = relationships.get(partKey(workbookPath))
    if (workbookRelationships === undefined) throw new Error('Missing XLSX workbook relationships')
    const ids = [...decodeXml(workbook).matchAll(/<[^>]*sheet\b[^>]*\b(?:r:)?id=["']([^"']+)["']/giu)]
      .map(match => match[1]).filter((id): id is string => id !== undefined)
    if (ids.length === 0 || new Set(ids).size !== ids.length) throw new Error('Invalid XLSX workbook sheets')
    for (const id of ids) {
      const matches = workbookRelationships.filter(relation => relation.id === id && relation.type === WORKSHEET && !relation.external)
      if (matches.length !== 1) throw new Error(`Invalid XLSX worksheet relationship: ${id}`)
    }
  }

  private inspectContent(bytes: Uint8Array): void {
    new XMLParser({
      removeNSPrefix: true,
      processEntities: false,
      parseTagValue: false,
      stopNodes: ['*.sheetData'],
      updateTag: (tag: string) => {
        if (tag === 'chart') this.unsupportedFeatures.add('charts')
        if (tag === 'pic' || tag === 'picture') this.unsupportedFeatures.add('images')
        if (tag === 'sp' || tag === 'grpSp' || tag === 'cxnSp') this.unsupportedFeatures.add('shapes')
        if (tag === 'conditionalFormatting') this.unsupportedFeatures.add('conditionalFormatting')
        if (tag === 'sheetData') return false
        return tag
      },
    }).parse(decodeXml(bytes))
  }
}

const RELATIONSHIP = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/'
const OFFICE_DOCUMENT = `${RELATIONSHIP}officeDocument`
const WORKSHEET = `${RELATIONSHIP}worksheet`

type Relationship = { readonly id: string; readonly type: string; readonly target: string; readonly external: boolean }

/** Read relationship records without accepting malformed or duplicate IDs. */
function readRelationships(xml: string): readonly Relationship[] {
  const records: Relationship[] = []
  const ids = new Set<string>()
  for (const [index, match] of [...xml.matchAll(/<(?:[\w.-]+:)?Relationship\b([^>]*)\/?\s*>/giu)].entries()) {
    const attributes = match[1]
    if (attributes === undefined) throw new Error('Invalid XLSX relationship')
    const read = (name: string): string | undefined => new RegExp(`\\b${name}=["']([^"']*)["']`, 'iu').exec(attributes)?.[1]
    const id = read('Id') ?? `__anonymous_${index}`
    const type = read('Type')?.replace(/^http:\/\/purl\.oclc\.org\/ooxml\/officeDocument\/relationships\//u, RELATIONSHIP)
    const target = read('Target')
    if (type === undefined || target === undefined || ids.has(id)) throw new Error('Invalid XLSX relationship')
    ids.add(id)
    records.push({ id, type, target, external: read('TargetMode') === 'External' })
  }
  return records
}

/** Convert absolute targets to the relative form ExcelJS 4.4 resolves. */
function normalizeRelationships(path: string, xml: string): string {
  const owner = relationshipOwner(path)
  if (owner === undefined) return xml
  return xml.replace(/\bTarget=(['"])(\/[^'"]*)\1/giu, (_whole, quote: string, target: string) =>
    `Target=${quote}${relativePart(owner, target)}${quote}`)
}

/** Resolve an OPC relationship part to its owning source part. */
function relationshipOwner(path: string): string | undefined {
  if (path === '_rels/.rels') return ''
  const match = /^(.*\/)?_rels\/([^/]+)\.rels$/i.exec(path)
  return match === null ? undefined : `${match[1]}${match[2]}`
}

/** Join CDATA runs into ordinary escaped XML text for ExcelJS's SAX reader. */
function normalizeCdata(xml: string): string {
  return xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, (_whole, value: string) => value
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'))
}

function relativePart(owner: string, target: string): string {
  const from = owner.split('/').slice(0, -1)
  const to = resolvePart(owner, target).split('/')
  while (from.length > 0 && from[0] === to[0]) { from.shift(); to.shift() }
  return `${'../'.repeat(from.length)}${to.join('/')}`
}

/** OPC compares part names using ASCII case equivalence, leaving ZIP names intact. */
function partKey(path: string): string {
  return path.replace(/[A-Z]/g, character => character.toLowerCase())
}

/** Decode the mandatory XML encodings without rewriting the archived bytes. */
function decodeXml(bytes: Uint8Array): string {
  const encoding = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0x3c && bytes[1] === 0)
    ? 'utf-16le'
    : (bytes[0] === 0xfe && bytes[1] === 0xff) || (bytes[0] === 0 && bytes[1] === 0x3c)
      ? 'utf-16be' : 'utf-8'
  return new TextDecoder(encoding, { fatal: true }).decode(bytes)
}

/** Resolve internal relationship targets without accepting traversal above the package root. */
function resolvePart(owner: string, target: string): string {
  const parts = target.startsWith('/') ? [] : owner.split('/').slice(0, -1)
  for (const segment of target.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (parts.length === 0) throw new Error('XLSX relationship escapes package')
      parts.pop()
    } else parts.push(segment)
  }
  return parts.join('/')
}
