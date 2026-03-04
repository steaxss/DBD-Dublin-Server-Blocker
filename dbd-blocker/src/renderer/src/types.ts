export interface Region {
  id: string
  name: string
  country: string
  continent: string
  flag: string
}

export type RegionStatus = 'active' | 'blocked' | 'loading' | 'error'

export interface RegionState extends Region {
  status: RegionStatus
  cidrCount: number
  error?: string
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'step'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

export interface ElectronAPI {
  blockRegion: (regionId: string) => Promise<{ ok: boolean; error?: string }>
  unblockRegion: (regionId: string) => Promise<{ ok: boolean; error?: string }>
  blockAll: () => Promise<void>
  unblockAll: () => Promise<void>
  getStatus: () => Promise<Record<string, boolean>>
  getCidrCounts: () => Promise<Record<string, number>>
  refreshIps: (force: boolean) => Promise<void>
  onLog: (callback: (entry: LogEntry) => void) => () => void
  onStatusChange: (callback: (regionId: string, blocked: boolean) => void) => () => void
  isAdmin: () => Promise<boolean>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
