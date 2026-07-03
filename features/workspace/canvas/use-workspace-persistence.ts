'use client'

/**
 * Sprint 6A — Workspace persistence hook.
 *
 * Owns the auto-save timer (15s), manual save, and initial hydration from the
 * project's `requirements.workspace` JSONB slot. This is intentionally the
 * *only* place we ever touch the ProjectRepository from the canvas module.
 */

import * as React from 'react'
import { toast } from 'sonner'
import type { Project } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { ProjectRepository } from '@/repositories/project-repository'
import { useWorkspaceStore } from './store'
import { AUTOSAVE_INTERVAL_MS } from './constants'

export type WorkspaceSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseWorkspacePersistenceReturn {
  status: WorkspaceSaveStatus
  lastSavedAt: string | null
  dirty: boolean
  saveNow: () => Promise<void>
}

export function useWorkspacePersistence(project: Project): UseWorkspacePersistenceReturn {
  const { session } = useAuth()

  const dirty = useWorkspaceStore((s) => s.dirty)
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt)
  const hydrate = useWorkspaceStore((s) => s.hydrate)
  const markSaved = useWorkspaceStore((s) => s.markSaved)
  const toJSON = useWorkspaceStore((s) => s.toJSON)

  const [status, setStatus] = React.useState<WorkspaceSaveStatus>('idle')
  const inFlight = React.useRef(false)
  const hydratedFor = React.useRef<string | null>(null)

  /* -------- initial hydration ------------------------------------------ */
  React.useEffect(() => {
    if (hydratedFor.current === project.id) return
    hydratedFor.current = project.id
    const raw = (project.requirements as { workspace?: unknown } | undefined)?.workspace
    hydrate(raw)
  }, [project.id, project.requirements, hydrate])

  /* -------- save (shared by autosave + manual) ------------------------- */
  const performSave = React.useCallback(async (): Promise<void> => {
    const orgId = session?.organization?.id
    const uid = session?.user?.id
    if (!orgId || !uid) return
    if (inFlight.current) return
    inFlight.current = true
    setStatus('saving')
    try {
      const repo = new ProjectRepository(orgId, uid)
      const payload = toJSON()
      const patch = {
        requirements: {
          ...(project.requirements ?? {}),
          workspace: payload as unknown as Record<string, unknown>,
        },
      }
      await repo.update(project.id, patch)
      markSaved(payload.updatedAt)
      setStatus('saved')
    } catch (e) {
      setStatus('error')
      // eslint-disable-next-line no-console
      console.error('[workspace] save failed', e)
      toast.error('Could not save workspace layout')
    } finally {
      inFlight.current = false
    }
  }, [markSaved, project.id, project.requirements, session, toJSON])

  /* -------- 15s autosave loop ----------------------------------------- */
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (useWorkspaceStore.getState().dirty && !inFlight.current) {
        void performSave()
      }
    }, AUTOSAVE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [performSave])

  /* -------- flush on tab-hide / unmount -------------------------------- */
  React.useEffect(() => {
    const flush = () => {
      if (useWorkspaceStore.getState().dirty && !inFlight.current) {
        void performSave()
      }
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [performSave])

  return {
    status,
    lastSavedAt,
    dirty,
    saveNow: performSave,
  }
}
