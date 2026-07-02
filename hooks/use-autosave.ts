'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Options<T> {
  value: T
  save: (v: T) => Promise<void>
  delayMs?: number     // debounce
  intervalMs?: number  // periodic tick when dirty
  enabled?: boolean
}

/**
 * Autosave hook — saves `value` whenever it changes (debounced) and every
 * `intervalMs` while there are pending changes. Exposes status for UI feedback.
 */
export function useAutosave<T>({ value, save, delayMs = 800, intervalMs = 10000, enabled = true }: Options<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const dirtyRef = useRef(false)
  const lastValueRef = useRef<T>(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flush = useCallback(async () => {
    if (!enabled) return
    if (!dirtyRef.current) return
    setStatus('saving')
    try {
      await save(lastValueRef.current)
      dirtyRef.current = false
      setStatus('saved')
      setLastSavedAt(Date.now())
    } catch {
      setStatus('error')
    }
  }, [save, enabled])

  // Track value changes
  useEffect(() => {
    // Deep equality would be ideal; use JSON string as a lightweight proxy.
    if (JSON.stringify(lastValueRef.current) === JSON.stringify(value)) return
    lastValueRef.current = value
    dirtyRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!enabled) return
    timeoutRef.current = setTimeout(() => { void flush() }, delayMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), enabled, delayMs])

  // Periodic tick
  useEffect(() => {
    if (!enabled) return
    intervalRef.current = setInterval(() => { void flush() }, intervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [enabled, intervalMs, flush])

  // Cleanup
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return { status, lastSavedAt, flush, dirty: () => dirtyRef.current }
}
