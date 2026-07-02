'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { useAuth } from '@/hooks/use-auth'
import { ProjectRepository } from '@/repositories/project-repository'

/**
 * Autosave hook for the workspace. Debounces state and writes
 * `commercialInput` into `projects.requirements.commercial` (JSONB). The DB
 * schema is unchanged: we only mutate the existing requirements object.
 */
export function useWorkspaceAutosave() {
  const { project, commercialInput } = useWorkspace()
  const { session } = useAuth()

  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerialised = React.useRef<string>(JSON.stringify(commercialInput))

  React.useEffect(() => {
    const now = JSON.stringify(commercialInput)
    if (now === lastSerialised.current) return
    lastSerialised.current = now

    if (timer.current) clearTimeout(timer.current)
    setStatus('saving')
    timer.current = setTimeout(async () => {
      const orgId = session?.organization?.id
      const uid = session?.user?.id
      if (!orgId || !uid) { setStatus('idle'); return }
      try {
        const repo = new ProjectRepository(orgId, uid)
        const patch = {
          requirements: {
            ...(project.requirements ?? {}),
            commercial: commercialInput as unknown as Record<string, unknown>,
          },
        }
        await repo.update(project.id, patch)
        setStatus('saved')
        setLastSavedAt(new Date())
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('workspace autosave failed', e)
        setStatus('error')
      }
    }, 1200)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [commercialInput, project, session])

  return { status, lastSavedAt }
}
