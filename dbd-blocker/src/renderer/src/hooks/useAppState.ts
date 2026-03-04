import { useState, useEffect, useCallback, useRef } from 'react'
import { REGIONS } from '../regions'
import type { RegionState, LogEntry } from '../types'

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useAppState() {
  const [regions, setRegions] = useState<RegionState[]>(
    REGIONS.map((r) => ({ ...r, status: 'active', cidrCount: 0 }))
  )
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [globalLoading, setGlobalLoading] = useState(false)

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: makeId(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      level,
      message
    }
    setLogs((prev) => {
      const next = [...prev, entry]
      return next.length > 500 ? next.slice(-500) : next
    })
  }, [])

  const setRegionStatus = useCallback((regionId: string, updates: Partial<RegionState>) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === regionId ? { ...r, ...updates } : r))
    )
  }, [])

  const syncBlockedCount = useCallback((regionsList: RegionState[]) => {
    const count = regionsList.filter((r) => r.status === 'blocked').length
    window.api.sendBlockedCount(count)
  }, [])

  // On mount: check admin, load status + CIDR counts
  useEffect(() => {
    async function init() {
      const admin = await window.api.isAdmin()
      setIsAdmin(admin)

      if (!admin) {
        addLog('error', 'Not running as administrator — firewall operations will fail. Please restart as admin.')
      } else {
        addLog('info', 'App started (administrator: OK)')
      }

      // Load firewall status
      const status = await window.api.getStatus()
      const counts = await window.api.getCidrCounts()

      setRegions((prev) => {
        const next = prev.map((r) => ({
          ...r,
          status: status[r.id] ? ('blocked' as const) : ('active' as const),
          cidrCount: counts[r.id] ?? 0
        }))
        syncBlockedCount(next)
        return next
      })

      // Log which are already blocked
      const blocked = Object.entries(status)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (blocked.length > 0) {
        addLog('warning', `Rules already active at startup: ${blocked.join(', ')}`)
      }

      // Fetch IPs for regions with no cache
      const noCachIds = REGIONS.filter((r) => !counts[r.id]).map((r) => r.id)
      if (noCachIds.length > 0) {
        addLog('info', `Fetching missing IP ranges (${noCachIds.length} regions)...`)
        await window.api.refreshIps(false)
        const newCounts = await window.api.getCidrCounts()
        setRegions((prev) =>
          prev.map((r) => ({ ...r, cidrCount: newCounts[r.id] ?? r.cidrCount }))
        )
      }
    }
    init()
  }, [addLog, syncBlockedCount])

  // Listen to events from main process
  useEffect(() => {
    const unsubLog = window.api.onLog((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry]
        return next.length > 500 ? next.slice(-500) : next
      })
    })

    const unsubStatus = window.api.onStatusChange((regionId, blocked) => {
      setRegions((prev) => {
        const next = prev.map((r) =>
          r.id === regionId
            ? { ...r, status: blocked ? ('blocked' as const) : ('active' as const) }
            : r
        )
        syncBlockedCount(next)
        return next
      })
    })

    const unsubCidr = (window.api as any).onCidrCount?.((regionId: string, count: number) => {
      setRegions((prev) => prev.map((r) => (r.id === regionId ? { ...r, cidrCount: count } : r)))
    })

    const unsubUnblockAll = (window.api as any).onUnblockAllDone?.(() => {
      setRegions((prev) => {
        const next = prev.map((r) => ({ ...r, status: 'active' as const }))
        syncBlockedCount(next)
        return next
      })
      addLog('success', 'All regions unblocked from tray')
    })

    return () => {
      unsubLog?.()
      unsubStatus?.()
      unsubCidr?.()
      unsubUnblockAll?.()
    }
  }, [addLog, syncBlockedCount])

  // Actions
  const blockRegion = useCallback(async (regionId: string) => {
    setRegionStatus(regionId, { status: 'loading', error: undefined })
    const result = await window.api.blockRegion(regionId)
    if (result.ok) {
      setRegions((prev) => {
        const next = prev.map((r) =>
          r.id === regionId ? { ...r, status: 'blocked' as const } : r
        )
        syncBlockedCount(next)
        return next
      })
    } else {
      setRegionStatus(regionId, { status: 'error', error: result.error })
    }
  }, [setRegionStatus, syncBlockedCount])

  const unblockRegion = useCallback(async (regionId: string) => {
    setRegionStatus(regionId, { status: 'loading', error: undefined })
    const result = await window.api.unblockRegion(regionId)
    if (result.ok) {
      setRegions((prev) => {
        const next = prev.map((r) =>
          r.id === regionId ? { ...r, status: 'active' as const } : r
        )
        syncBlockedCount(next)
        return next
      })
    } else {
      setRegionStatus(regionId, { status: 'error', error: result.error })
    }
  }, [setRegionStatus, syncBlockedCount])

  const blockAll = useCallback(async () => {
    setGlobalLoading(true)
    setRegions((prev) => prev.map((r) => ({ ...r, status: 'loading' as const })))
    await window.api.blockAll()
    setGlobalLoading(false)
  }, [])

  const unblockAll = useCallback(async () => {
    setGlobalLoading(true)
    setRegions((prev) => prev.map((r) => ({ ...r, status: 'loading' as const })))
    await window.api.unblockAll()
    setGlobalLoading(false)
  }, [])

  const refreshIps = useCallback(async () => {
    addLog('info', 'Refresh IPs forcé...')
    await window.api.refreshIps(true)
    const counts = await window.api.getCidrCounts()
    setRegions((prev) => prev.map((r) => ({ ...r, cidrCount: counts[r.id] ?? r.cidrCount })))
  }, [addLog])

  const clearLogs = useCallback(() => setLogs([]), [])

  const blockedCount = regions.filter((r) => r.status === 'blocked').length

  return {
    regions,
    logs,
    isAdmin,
    globalLoading,
    blockedCount,
    blockRegion,
    unblockRegion,
    blockAll,
    unblockAll,
    refreshIps,
    clearLogs
  }
}
