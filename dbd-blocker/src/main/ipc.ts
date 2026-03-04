import { ipcMain, BrowserWindow } from 'electron'
import {
  blockRegion,
  unblockRegion,
  getBlockedRegions,
  ruleExists
} from './firewall'
import { getCidrs, getCidrCounts } from './ips'
import { REGION_IDS } from './index'

export type LogEmitter = (level: string, message: string) => void

function makeLogEmitter(win: BrowserWindow): LogEmitter {
  return (level: string, message: string) => {
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      level,
      message
    }
    if (!win.isDestroyed()) {
      win.webContents.send('log', entry)
    }
  }
}

function sendStatus(win: BrowserWindow, regionId: string, blocked: boolean): void {
  if (!win.isDestroyed()) {
    win.webContents.send('status-change', regionId, blocked)
  }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  const log = makeLogEmitter(win)

  // Block a single region
  ipcMain.handle('block-region', async (_, regionId: string) => {
    try {
      log('info', `Blocking ${regionId}...`)
      const cidrs = await getCidrs(regionId)
      if (cidrs.length === 0) {
        log('warning', `${regionId}: no CIDRs available — run Refresh IPs first`)
        return { ok: false, error: 'No CIDRs available. Run Refresh IPs first.' }
      }
      const result = await blockRegion(regionId, cidrs, log)
      sendStatus(win, regionId, result.ok)
      return result
    } catch (err) {
      const error = String(err)
      log('error', `[${regionId}] Exception: ${error}`)
      return { ok: false, error }
    }
  })

  // Unblock a single region
  ipcMain.handle('unblock-region', async (_, regionId: string) => {
    try {
      log('info', `Unblocking ${regionId}...`)
      const result = await unblockRegion(regionId, log)
      sendStatus(win, regionId, false)
      return result
    } catch (err) {
      const error = String(err)
      log('error', `[${regionId}] Exception: ${error}`)
      return { ok: false, error }
    }
  })

  // Block all
  ipcMain.handle('block-all', async () => {
    log('info', 'Blocking all regions...')
    for (const regionId of REGION_IDS) {
      try {
        const cidrs = await getCidrs(regionId)
        if (cidrs.length === 0) {
          log('warning', `${regionId}: skipped (no CIDRs)`)
          continue
        }
        const result = await blockRegion(regionId, cidrs, log)
        sendStatus(win, regionId, result.ok)
      } catch (err) {
        log('error', `[${regionId}] Exception: ${String(err)}`)
      }
    }
    log('success', 'Block All complete')
  })

  // Unblock all
  ipcMain.handle('unblock-all', async () => {
    log('info', 'Unblocking all regions...')
    for (const regionId of REGION_IDS) {
      try {
        if (await ruleExists(regionId)) {
          const result = await unblockRegion(regionId, log)
          sendStatus(win, regionId, !result.ok)
        }
      } catch (err) {
        log('error', `[${regionId}] Exception: ${String(err)}`)
      }
    }
    log('success', 'Unblock All complete')
  })

  // Get current status (on startup)
  ipcMain.handle('get-status', async () => {
    return getBlockedRegions(REGION_IDS)
  })

  // Get CIDR counts
  ipcMain.handle('get-cidr-counts', async () => {
    return getCidrCounts(REGION_IDS)
  })

  // Refresh IPs
  ipcMain.handle('refresh-ips', async (_, force: boolean) => {
    log('info', `Fetching AWS IP ranges${force ? ' (forced)' : ''}...`)
    for (const regionId of REGION_IDS) {
      try {
        const cidrs = await getCidrs(regionId, force)
        log('step', `${regionId}: ${cidrs.length} CIDRs`)
        win.webContents.send('cidr-count', regionId, cidrs.length)
      } catch (err) {
        log('error', `${regionId}: failed — ${String(err)}`)
      }
    }
    log('success', 'IP refresh complete')
  })

  // Admin check
  ipcMain.handle('is-admin', async () => {
    try {
      const { execFileSync } = await import('child_process')
      execFileSync('net', ['session'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })
}
