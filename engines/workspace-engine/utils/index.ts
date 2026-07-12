/**
 * Sprint 6B — Workspace Engine · utils
 */

import { v4 as uuid } from 'uuid'
import type { GroupId, LayerId, ObjectId, GroupObject } from '../types'

export const newObjectId    = (): ObjectId    => `o_${uuid()}`
export const newLayerId     = (): LayerId     => `l_${uuid()}`
export const newGroupId     = (): GroupId     => `g_${uuid()}`
export const newWorkspaceId = (): string      => `w_${uuid()}`
export const newCommandId   = (): string      => `c_${uuid()}`
export const newEventId     = (): string      => `e_${uuid()}`

/** Object shape needed by these utilities. */
interface DuplicableObject {
  id: string
  x: number
  y: number
  groupId?: string | null
}

/** Duplicate objects with fresh ids; groups are re-linked, positions offset. */
export function duplicateObjects<T extends DuplicableObject>(
  source: T[],
  offsetMm: number = 40,
): { clones: T[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>()
  const groupMap = new Map<string, string>()

  // First pass — assign new ids.
  for (const o of source) idMap.set(o.id, newObjectId())
  for (const o of source) if (o.groupId && !groupMap.has(o.groupId)) groupMap.set(o.groupId, newGroupId())

  const clones: T[] = source.map((o) => {
    const clone = {
      ...o,
      id: idMap.get(o.id)!,
      x: o.x + offsetMm,
      y: o.y + offsetMm,
      groupId: o.groupId ? (groupMap.get(o.groupId) ?? null) : null,
    } as T
    // If it's a group object, re-link childIds.
    const maybeGroup = clone as unknown as GroupObject
    if (maybeGroup.kind === 'group' && Array.isArray(maybeGroup.childIds)) {
      maybeGroup.childIds = maybeGroup.childIds.map((cid) => idMap.get(cid) ?? cid)
    }
    return clone
  })

  return { clones, idMap }
}

export function groupObjects<T extends DuplicableObject>(objects: T[], ids: Set<string>): T[] {
  if (ids.size < 2) return objects
  const gid = newGroupId()
  return objects.map((o): T => ids.has(o.id) ? { ...o, groupId: gid } : o)
}

export function ungroupObjects<T extends DuplicableObject>(objects: T[], ids: Set<string>): T[] {
  const affected = new Set(
    objects.filter((o) => ids.has(o.id) && o.groupId).map((o) => o.groupId as string),
  )
  if (affected.size === 0) return objects
  return objects.map((o): T => (o.groupId && affected.has(o.groupId)) ? { ...o, groupId: null } : o)
}

export function expandGroupSelection<T extends DuplicableObject>(objects: T[], ids: string[]): string[] {
  const idSet = new Set(ids)
  const groups = new Set(
    objects.filter((o) => idSet.has(o.id) && o.groupId).map((o) => o.groupId as string),
  )
  if (groups.size === 0) return ids
  const result = new Set(ids)
  for (const o of objects) if (o.groupId && groups.has(o.groupId)) result.add(o.id)
  return Array.from(result)
}
