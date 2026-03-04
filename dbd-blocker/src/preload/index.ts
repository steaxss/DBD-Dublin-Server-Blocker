import { contextBridge, ipcRenderer } from 'electron'
import type { LogEntry } from '../renderer/src/types'

contextBridge.exposeInMainWorld('api', {
  // Window controls
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized')
  },

  // Firewall
  blockRegion: (regionId: string) => ipcRenderer.invoke('block-region', regionId),
  unblockRegion: (regionId: string) => ipcRenderer.invoke('unblock-region', regionId),
  blockAll: () => ipcRenderer.invoke('block-all'),
  unblockAll: () => ipcRenderer.invoke('unblock-all'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  getCidrCounts: () => ipcRenderer.invoke('get-cidr-counts'),
  refreshIps: (force: boolean) => ipcRenderer.invoke('refresh-ips', force),
  isAdmin: () => ipcRenderer.invoke('is-admin'),

  // Events: main → renderer
  onLog: (callback: (entry: LogEntry) => void) => {
    const handler = (_: unknown, entry: LogEntry) => callback(entry)
    ipcRenderer.on('log', handler)
    return () => ipcRenderer.removeListener('log', handler)
  },
  onStatusChange: (callback: (regionId: string, blocked: boolean) => void) => {
    const handler = (_: unknown, regionId: string, blocked: boolean) =>
      callback(regionId, blocked)
    ipcRenderer.on('status-change', handler)
    return () => ipcRenderer.removeListener('status-change', handler)
  },
  onCidrCount: (callback: (regionId: string, count: number) => void) => {
    const handler = (_: unknown, regionId: string, count: number) =>
      callback(regionId, count)
    ipcRenderer.on('cidr-count', handler)
    return () => ipcRenderer.removeListener('cidr-count', handler)
  },
  onUnblockAllDone: (callback: () => void) => {
    ipcRenderer.on('unblock-all-done', callback)
    return () => ipcRenderer.removeListener('unblock-all-done', callback)
  },
  sendBlockedCount: (count: number) => ipcRenderer.send('blocked-count-update', count)
})
