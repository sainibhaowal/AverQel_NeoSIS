/**
 * The identity, timestamp, link, mutation, and durability-sink guarantees
 * MemoryVfs owes its consumers, asserted directly rather than through the
 * `node:fs` bridge.
 *
 * `neosis-fs-local` builds a version token from `dev:ino:size:mtimeNs:ctimeNs` and
 * refuses a write whose token moved since it read. Two properties carry that:
 * `ino` identifies the entry at a path, and `mtimeMs` moves on every write. The
 * timestamp cases freeze the clock, because these writes are in memory and two
 * revisions routinely land in the same millisecond — a real-clock test passes
 * whether or not the strict increment exists.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryVfs } from '../../src/storage/memory.ts'
import type { VfsBigIntStats, VfsMutation, VfsMutationSink, VfsStats } from '../../src/storage/types.ts'

const identity = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).ino

const linkCount = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).nlink

const modified = (vfs: MemoryVfs, path: string): number => (vfs.statSync(path) as VfsStats).mtimeMs

afterEach(() => { vi.restoreAllMocks() })

describe('entry identity', () => {
  it('distinguishes paths and holds each identity across repeated stats', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/one.txt', 'one')
    vfs.seed('/neosis/two.txt', 'two')
    const first = identity(vfs, '/neosis/one.txt')
    expect(identity(vfs, '/neosis/two.txt')).not.toBe(first)
    expect(identity(vfs, '/neosis/one.txt')).toBe(first)
  })

  it('forgets the identities under a directory removed as a subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/skills/git/SKILL.md', '# git\n')
    const before = identity(vfs, '/neosis/skills/git/SKILL.md')
    vfs.rmSync('/neosis/skills', { recursive: true })
    vfs.seed('/neosis/skills/git/SKILL.md', '# git rebuilt\n')
    expect(identity(vfs, '/neosis/skills/git/SKILL.md')).not.toBe(before)
  })

  it('moves the source identity when a file replaces another path', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/from.txt', 'moved')
    vfs.seed('/neosis/to.txt', 'replaced')
    const [source, destination] = [identity(vfs, '/neosis/from.txt'), identity(vfs, '/neosis/to.txt')]
    vfs.renameSync('/neosis/from.txt', '/neosis/to.txt')
    const renamed = identity(vfs, '/neosis/to.txt')
    expect(vfs.readFileSync('/neosis/to.txt', 'utf8')).toBe('moved')
    expect([renamed === source, renamed === destination]).toEqual([true, false])
  })
})

describe('modification time', () => {
  it('hydrates explicit metadata without confusing timestamps with permission bits', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/restored', 'value', { mode: 0o600, mtimeMs: 1_600_000_000_000 })
    vfs.seedDirectory('/neosis/restored-directory', { mode: 0o700, mtimeMs: 1_600_000_000_001 })
    const stats = vfs.statSync('/neosis/restored') as VfsStats
    const directory = vfs.statSync('/neosis/restored-directory') as VfsStats
    expect([stats.mode & 0o777, stats.mtimeMs]).toEqual([0o600, 1_600_000_000_000])
    expect([directory.mode & 0o777, directory.mtimeMs]).toEqual([0o700, 1_600_000_000_001])
  })

  it('advances on every write even while the clock stands still', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/log.jsonl', 'first\n')
    const seeded = modified(vfs, '/neosis/log.jsonl')
    vfs.writeFileSync('/neosis/log.jsonl', 'second\n')
    const written = modified(vfs, '/neosis/log.jsonl')
    vfs.appendFileSync('/neosis/log.jsonl', 'third\n')
    const appended = modified(vfs, '/neosis/log.jsonl')
    vfs.truncateSync('/neosis/log.jsonl', 6)
    const truncated = modified(vfs, '/neosis/log.jsonl')
    expect([written > seeded, appended > written, truncated > appended]).toEqual([true, true, true])
    // One millisecond per revision: the increment is the minimum that separates
    // two tokens, not a coarser bump that would skew a real timestamp.
    expect(truncated - seeded).toBe(3)
  })

  it('takes the clock once the clock has passed the entry', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/log.jsonl', 'first\n')
    clock.mockReturnValue(1_700_000_005_000)
    vfs.writeFileSync('/neosis/log.jsonl', 'second\n')
    expect(modified(vfs, '/neosis/log.jsonl')).toBe(1_700_000_005_000)
  })

  it('extends truncation with zero bytes', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/file', new Uint8Array([1, 2]))
    vfs.truncateSync('/neosis/file', 5)
    expect([...vfs.readFileSync('/neosis/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0])
    const handle = vfs.open('/neosis/file', 'r+')
    await handle.truncate(7)
    expect([...vfs.readFileSync('/neosis/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0, 0, 0])
  })

  it('advances a directory only when its immediate entry set changes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/neosis/workspace')
    const empty = modified(vfs, '/neosis/workspace')
    vfs.writeFileSync('/neosis/workspace/file.txt', 'one')
    const created = modified(vfs, '/neosis/workspace')
    vfs.writeFileSync('/neosis/workspace/file.txt', 'two')
    const rewritten = modified(vfs, '/neosis/workspace')
    vfs.rmSync('/neosis/workspace/file.txt')
    const removed = modified(vfs, '/neosis/workspace')
    expect([created > empty, rewritten === created, removed > rewritten]).toEqual([true, true, true])
  })
})

describe('mutation publication', () => {
  it('publishes only committed runtime changes and keeps image seeding silent', () => {
    const vfs = new MemoryVfs()
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.seed('/neosis/seeded.txt', 'seeded')
    expect(mutations).toEqual([])
    vfs.writeFileSync('/neosis/seeded.txt', 'changed')
    vfs.mkdirSync('/neosis/created')
    vfs.chmodSync('/neosis/created', 0o700)
    vfs.renameSync('/neosis/seeded.txt', '/neosis/renamed.txt')
    vfs.rmSync('/neosis/created', { recursive: true })
    expect(mutations.map(mutation => ({
      kind: mutation.kind,
      path: mutation.path,
      ...mutation.kind === 'write' ? { entryChanged: mutation.entryChanged } : {},
      ...mutation.kind === 'chmod' ? { mode: mutation.mode } : {},
    }))).toEqual([
      { kind: 'write', path: '/neosis/seeded.txt', entryChanged: false },
      { kind: 'mkdir', path: '/neosis/created' },
      { kind: 'chmod', path: '/neosis/created', mode: 0o700 },
      { kind: 'remove', path: '/neosis/seeded.txt' },
      { kind: 'write', path: '/neosis/renamed.txt', entryChanged: true },
      { kind: 'remove', path: '/neosis/created' },
    ])
    const renamed = mutations[4]
    expect(renamed?.kind === 'write' && new TextDecoder().decode(renamed.bytes)).toBe('changed')
    expect(() => { vfs.writeFileSync('/missing/file', 'no') }).toThrow(/ENOENT/)
    expect(mutations).toHaveLength(6)
  })

  it('contains a faulty observer and lets disposal stop later notifications', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/neosis')
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = vfs.subscribe(() => { throw new Error('observer failed') })
    const seen: string[] = []
    const second = vfs.subscribe((mutation) => { seen.push(mutation.path) })
    vfs.writeFileSync('/neosis/one', '1')
    first()
    second()
    vfs.writeFileSync('/neosis/two', '2')
    expect(seen).toEqual(['/neosis/one'])
    expect(reported).toHaveBeenCalledOnce()
  })

  it('feeds the same complete mutations to a durable sink and live subscribers', async () => {
    const recorded: VfsMutation[] = []
    let flushes = 0
    const sink: VfsMutationSink = {
      record: (mutation) => { recorded.push(mutation) },
      flush: async () => { flushes += 1 },
    }
    const vfs = new MemoryVfs({ sink })
    vfs.seedDirectory('/neosis')
    const observed: VfsMutation[] = []
    vfs.subscribe((mutation) => { observed.push(mutation) })
    vfs.writeFileSync('/neosis/log', 'a')
    vfs.appendFileSync('/neosis/log', 'bc')
    await vfs.flush()
    expect(observed).toEqual(recorded)
    expect(observed[0]).toBe(recorded[0])
    expect(recorded[0]).toMatchObject({ kind: 'write', path: '/neosis/log', mode: 0o644, entryChanged: true })
    expect(recorded[1]).toMatchObject({ kind: 'write', path: '/neosis/log', mode: 0o644, entryChanged: false, appendedFrom: 1 })
    expect(recorded[1]?.kind === 'write' && new TextDecoder().decode(recorded[1].bytes)).toBe('abc')
    expect(flushes).toBe(1)
  })

  it('publishes descriptor writes at the file identity current path', () => {
    const mutations: VfsMutation[] = []
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/source', 'old')
    const descriptor = vfs.openFileSync('/neosis/source', 'r+')
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.renameSync('/neosis/source', '/neosis/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('new'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/neosis/destination'])
    expect(vfs.readFileSync('/neosis/destination', 'utf8')).toBe('new')
    vfs.unlinkSync('/neosis/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('detached'))
    expect(mutations).toEqual([])
    expect(new TextDecoder().decode(descriptor.read(0, descriptor.stat().size))).toBe('detached')
  })

  it('reports the path identity through a BigInt file handle stat', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/session.lock', '')
    const handle = vfs.open('/neosis/session.lock', 'w')
    const held = await handle.stat({ bigint: true }) as VfsBigIntStats
    const current = vfs.statSync('/neosis/session.lock', { bigint: true }) as VfsBigIntStats

    expect([held.dev, held.ino]).toEqual([current.dev, current.ino])
    await handle.chmod(0o600)
    expect((vfs.statSync('/neosis/session.lock') as VfsStats).mode & 0o777).toBe(0o600)
    await handle.close()
  })

  it('decomposes a directory rename into replayable destination state', () => {
    const recorded: VfsMutation[] = []
    const vfs = new MemoryVfs({
      sink: { record: (mutation) => { recorded.push(mutation) }, flush: () => Promise.resolve() },
    })
    vfs.seedDirectory('/neosis/staging/nested', { mode: 0o700 })
    vfs.seed('/neosis/staging/nested/file', 'value', { mode: 0o600 })
    vfs.renameSync('/neosis/staging', '/neosis/published')

    expect(recorded.map(mutation => [mutation.kind, mutation.path])).toEqual([
      ['remove', '/neosis/staging'],
      ['mkdir', '/neosis/published'],
      ['mkdir', '/neosis/published/nested'],
      ['write', '/neosis/published/nested/file'],
    ])
    expect(recorded[3]).toMatchObject({ kind: 'write', mode: 0o600, entryChanged: true })
    expect(recorded[3]?.kind === 'write' && new TextDecoder().decode(recorded[3].bytes)).toBe('value')
  })
})

describe('directory rename', () => {
  it('rejects file, non-empty directory, and missing-parent destinations before mutation', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/source/nested/file', 'source')
    vfs.seed('/neosis/file', 'destination')
    vfs.seed('/neosis/non-empty/child', 'destination')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    expect(() => { vfs.renameSync('/neosis/source', '/neosis/file') })
      .toThrow(expect.objectContaining({ code: 'ENOTDIR' }))
    expect(() => { vfs.renameSync('/neosis/source', '/neosis/non-empty') })
      .toThrow(expect.objectContaining({ code: 'ENOTEMPTY' }))
    expect(() => { vfs.renameSync('/neosis/source', '/missing/destination') })
      .toThrow(expect.objectContaining({ code: 'ENOENT' }))

    expect(vfs.readFileSync('/neosis/source/nested/file', 'utf8')).toBe('source')
    expect(vfs.readFileSync('/neosis/file', 'utf8')).toBe('destination')
    expect(vfs.readFileSync('/neosis/non-empty/child', 'utf8')).toBe('destination')
    expect(mutations).toEqual([])
  })

  it('replaces an empty directory with the source subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/neosis/source/nested', { mode: 0o700 })
    vfs.seed('/neosis/source/nested/file', 'source')
    vfs.seedDirectory('/neosis/destination', { mode: 0o711 })

    vfs.renameSync('/neosis/source', '/neosis/destination')

    expect(vfs.existsSync('/neosis/source')).toBe(false)
    expect(vfs.readFileSync('/neosis/destination/nested/file', 'utf8')).toBe('source')
    expect((vfs.statSync('/neosis/destination') as VfsStats).mode & 0o777).toBe(0o755)
    expect((vfs.statSync('/neosis/destination/nested') as VfsStats).mode & 0o777).toBe(0o700)
  })
})

describe('hard links', () => {
  it('shares identity, bytes, and mode until one name is removed', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/session.jsonl', 'committed\n')
    vfs.linkSync('/neosis/session.jsonl', '/neosis/session-latest.jsonl')
    vfs.linkSync('/neosis/session-latest.jsonl', '/neosis/session-archive.jsonl')
    expect(identity(vfs, '/neosis/session-latest.jsonl')).toBe(identity(vfs, '/neosis/session.jsonl'))
    expect(linkCount(vfs, '/neosis/session.jsonl')).toBe(3n)
    expect(vfs.readFileSync('/neosis/session-latest.jsonl', 'utf8')).toBe('committed\n')
    const changedPaths: string[] = []
    vfs.subscribe((mutation) => { changedPaths.push(mutation.path) })
    vfs.appendFileSync('/neosis/session.jsonl', 'appended\n')
    expect(changedPaths).toEqual([
      '/neosis/session.jsonl',
      '/neosis/session-latest.jsonl',
      '/neosis/session-archive.jsonl',
    ])
    expect(vfs.readFileSync('/neosis/session.jsonl', 'utf8')).toBe('committed\nappended\n')
    expect(vfs.readFileSync('/neosis/session-latest.jsonl', 'utf8')).toBe('committed\nappended\n')
    vfs.chmodSync('/neosis/session-latest.jsonl', 0o600)
    expect((vfs.statSync('/neosis/session.jsonl') as VfsStats).mode & 0o777).toBe(0o600)
    vfs.unlinkSync('/neosis/session-latest.jsonl')
    expect(linkCount(vfs, '/neosis/session.jsonl')).toBe(2n)
    vfs.unlinkSync('/neosis/session-archive.jsonl')
    expect(linkCount(vfs, '/neosis/session.jsonl')).toBe(1n)
    expect(vfs.readFileSync('/neosis/session.jsonl', 'utf8')).toBe('committed\nappended\n')
  })

  it('treats rename between names of the same node as a no-op', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/source', 'value')
    vfs.linkSync('/neosis/source', '/neosis/alias')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    vfs.renameSync('/neosis/source', '/neosis/alias')

    expect(vfs.readFileSync('/neosis/source', 'utf8')).toBe('value')
    expect(vfs.readFileSync('/neosis/alias', 'utf8')).toBe('value')
    expect(linkCount(vfs, '/neosis/source')).toBe(2n)
    expect(mutations).toEqual([])
  })

  it('retargets linked names through file replacement and directory moves', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/replacement', 'replacement')
    vfs.seed('/neosis/target', 'old')
    vfs.linkSync('/neosis/target', '/neosis/target-alias')
    const replaced = vfs.openFileSync('/neosis/target', 'r+')
    vfs.renameSync('/neosis/replacement', '/neosis/target')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    replaced.write(0, new TextEncoder().encode('changed'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/neosis/target-alias'])
    expect(vfs.readFileSync('/neosis/target', 'utf8')).toBe('replacement')
    expect(vfs.readFileSync('/neosis/target-alias', 'utf8')).toBe('changed')
    expect(linkCount(vfs, '/neosis/target-alias')).toBe(1n)

    vfs.seed('/neosis/tree/file', 'tree')
    vfs.linkSync('/neosis/tree/file', '/neosis/outside')
    const moved = vfs.openFileSync('/neosis/tree/file', 'r+')
    vfs.renameSync('/neosis/tree', '/neosis/moved')
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('moved'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/neosis/outside', '/neosis/moved/file'])
    expect(linkCount(vfs, '/neosis/moved/file')).toBe(2n)

    vfs.rmSync('/neosis/moved', { recursive: true })
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('kept!'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/neosis/outside'])
    expect(vfs.readFileSync('/neosis/outside', 'utf8')).toBe('kept!')
    expect(linkCount(vfs, '/neosis/outside')).toBe(1n)
  })

  it('rejects renaming a file over an existing directory', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/neosis/file', 'value')
    vfs.seedDirectory('/neosis/directory')
    expect(() => { vfs.renameSync('/neosis/file', '/neosis/directory') }).toThrow(expect.objectContaining({ code: 'EISDIR' }))
    expect(vfs.readFileSync('/neosis/file', 'utf8')).toBe('value')
    expect(vfs.statSync('/neosis/directory').isDirectory()).toBe(true)
  })
})
