export interface Region {
  id: string
  name: string
  country: string
  continent: string
  flag: string
  countryCode: string
  lat: number
  lng: number
}

export type RegionStatus = 'active' | 'blocked' | 'loading' | 'error'

export interface RegionState extends Region {
  status: RegionStatus
  cidrCount: number
  error?: string
  pingMs?: number | null
  pingIp?: string
  pingLoading?: boolean
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'step'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

export interface InitStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

export interface ExeValidationResult {
  ok: boolean
  error?: string
  warning?: string
}

export interface PingResult {
  ok: boolean
  ip: string | null
  ms: number | null
  error?: string
}

export interface UdpRegion {
  regionId: string
  ip: string
}

export interface ActiveConnectionsResult {
  running: boolean
  udpRegions: UdpRegion[]
}

export interface ElectronAPI {
  win: {
    minimize:    () => void
    maximize:    () => void
    close:       () => void
    isMaximized: () => Promise<boolean>
  }
  // Firewall
  blockRegion:   (regionId: string) => Promise<{ ok: boolean; error?: string }>
  unblockRegion: (regionId: string) => Promise<{ ok: boolean; error?: string }>
  blockAll:      () => Promise<void>
  unblockAll:    () => Promise<void>
  blockExcept:   (keepRegionId: string) => Promise<void>
  getStatus:     () => Promise<Record<string, boolean>>
  getCidrCounts: () => Promise<Record<string, number>>
  refreshIps:    (force: boolean) => Promise<void>
  isAdmin:       () => Promise<boolean>
  checkExePath:  () => Promise<ExeValidationResult>
  // Settings: exe path
  getExePath:  () => Promise<string>
  setExePath:  (path: string) => Promise<ExeValidationResult>
  browseExe:   () => Promise<string | null>
  // Settings: permanent regions
  getPermanentRegions: () => Promise<string[]>
  markPermanent:       (regionId: string) => Promise<void>
  unmarkPermanent:     (regionId: string) => Promise<void>
  // Tray sync
  sendBlockedCount: (count: number) => void
  // Ping
  pingRegion: (regionId: string) => Promise<PingResult>
  // Active connections
  getActiveConnections: () => Promise<ActiveConnectionsResult>
  resetUdpMonitor:      () => Promise<void>
  // Events
  onLog:            (callback: (entry: LogEntry) => void) => () => void
  onStatusChange:   (callback: (regionId: string, blocked: boolean) => void) => () => void
  onCidrCount:      (callback: (regionId: string, count: number) => void) => () => void
  onUnblockAllDone: (callback: () => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
