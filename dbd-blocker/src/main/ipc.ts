import { ipcMain, BrowserWindow, dialog } from 'electron'
import {
  blockRegion,
  unblockRegion,
  getBlockedRegions,
  ruleExists,
  ps
} from './firewall'
import { getCidrs, getCidrCounts, getCachedCidrs } from './ips'
import { REGION_IDS } from './index'
import {
  getExePath,
  setExePath,
  validateExePath,
  getPermanentRegions,
  markPermanent,
  unmarkPermanent
} from './settings'

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

  // ── Firewall: block one region ─────────────────────────────────────────────
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

  // ── Firewall: unblock one region ───────────────────────────────────────────
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

  // ── Firewall: block all ────────────────────────────────────────────────────
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

  // ── Firewall: unblock all (respects permanent regions) ────────────────────
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

  // ── Exclusive mode: block all except one region ───────────────────────────
  ipcMain.handle('block-except', async (_, keepRegionId: string) => {
    log('info', `Exclusive mode: keeping only ${keepRegionId} open...`)
    for (const regionId of REGION_IDS) {
      try {
        if (regionId === keepRegionId) {
          // Ensure this region is unblocked
          if (await ruleExists(regionId)) {
            await unblockRegion(regionId, log)
            sendStatus(win, regionId, false)
          }
        } else {
          const cidrs = await getCidrs(regionId)
          if (cidrs.length === 0) {
            log('warning', `${regionId}: skipped (no CIDRs)`)
            continue
          }
          const result = await blockRegion(regionId, cidrs, log)
          sendStatus(win, regionId, result.ok)
        }
      } catch (err) {
        log('error', `[${regionId}] Exception: ${String(err)}`)
      }
    }
    log('success', `Exclusive mode active — only ${keepRegionId} is reachable`)
  })

  // ── Startup queries ────────────────────────────────────────────────────────
  ipcMain.handle('get-status', async () => getBlockedRegions(REGION_IDS))
  ipcMain.handle('get-cidr-counts', async () => getCidrCounts(REGION_IDS))

  // ── Refresh IPs ────────────────────────────────────────────────────────────
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

  // ── Validate current exe path (without saving) ────────────────────────────
  ipcMain.handle('check-exe-path', async () => {
    const path = await getExePath()
    return validateExePath(path)
  })

  // ── Admin check ────────────────────────────────────────────────────────────
  ipcMain.handle('is-admin', async () => {
    try {
      const { execFileSync } = await import('child_process')
      execFileSync('net', ['session'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })

  // ── Settings: exe path ─────────────────────────────────────────────────────
  ipcMain.handle('get-exe-path', async () => getExePath())

  ipcMain.handle('set-exe-path', async (_, path: string) => {
    const validation = validateExePath(path)
    if (!validation.ok) return validation
    await setExePath(path)
    log('info', `DBD executable path updated: ${path}`)
    return validation
  })

  ipcMain.handle('browse-exe', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Dead by Daylight Executable',
      defaultPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dead by Daylight',
      filters: [{ name: 'Executable', extensions: ['exe'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  // ── Ping a region via GameLift HTTPS endpoint (same method as deadbyqueue.com) ──
  ipcMain.handle('ping-region', async (_, regionId: string) => {
    // GameLift/AWS ping hosts — identical to what deadbyqueue.com uses
    const PING_HOSTS: Record<string, string> = {
      'us-east-1':      'gamelift.us-east-1.amazonaws.com',
      'us-east-2':      'gamelift.us-east-2.amazonaws.com',
      'us-west-1':      'gamelift.us-west-1.amazonaws.com',
      'us-west-2':      'gamelift.us-west-2.amazonaws.com',
      'ca-central-1':   'gamelift.ca-central-1.amazonaws.com',
      'eu-central-1':   'gamelift.eu-central-1.amazonaws.com',
      'eu-west-1':      'gamelift.eu-west-1.amazonaws.com',
      'eu-west-2':      'gamelift.eu-west-2.amazonaws.com',
      'ap-south-1':     'gamelift.ap-south-1.amazonaws.com',
      'ap-east-1':      'dynamodb.ap-east-1.amazonaws.com',   // GameLift not available in HK
      'ap-northeast-1': 'gamelift.ap-northeast-1.amazonaws.com',
      'ap-northeast-2': 'gamelift.ap-northeast-2.amazonaws.com',
      'ap-southeast-1': 'gamelift.ap-southeast-1.amazonaws.com',
      'ap-southeast-2': 'gamelift.ap-southeast-2.amazonaws.com',
      'sa-east-1':      'gamelift.sa-east-1.amazonaws.com',
    }

    const host = PING_HOSTS[regionId]
    if (!host) return { ok: false, ip: null, ms: null, error: 'Unknown region' }

    const { default: https } = await import('https')

    // Run 4 pings, return median (same approach as deadbyqueue)
    async function singlePing(): Promise<number | null> {
      return new Promise((resolve) => {
        const start = Date.now()
        const req = https.request({
          hostname: host,
          port: 443,
          path: '/ping',
          method: 'HEAD',
          timeout: 5000,
          rejectUnauthorized: false,
        }, (res) => {
          res.resume()
          resolve(Date.now() - start)
        })
        req.on('error', () => resolve(null))
        req.on('timeout', () => { req.destroy(); resolve(null) })
        req.end()
      })
    }

    // Warm up connection (first request often slow due to TCP/TLS handshake)
    await singlePing()

    // 6 real samples after warmup
    const samples: number[] = []
    for (let i = 0; i < 6; i++) {
      const ms = await singlePing()
      if (ms !== null) samples.push(ms)
    }

    if (samples.length === 0) return { ok: true, ip: host, ms: null }

    // Trimmed mean: discard highest and lowest, average the rest
    samples.sort((a, b) => a - b)
    const trimmed = samples.length > 2 ? samples.slice(1, -1) : samples
    const avg = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length)
    return { ok: true, ip: host, ms: avg }
  })

  // ── Get active DBD connections ─────────────────────────────────────────────
  ipcMain.handle('get-active-connections', async () => {
    // 1. Find DBD PID
    const pidRes = await ps(
      `(Get-Process -Name 'DeadByDaylight-Win64-Shipping' -ErrorAction SilentlyContinue).Id`
    )
    const pid = parseInt(pidRes.stdout.trim(), 10)
    if (!pid || isNaN(pid)) return { running: false, connections: [] }

    // 2. Get TCP established connections
    const tcpRes = await ps(
      `Get-NetTCPConnection -OwningProcess ${pid} -State Established -ErrorAction SilentlyContinue ` +
      `| Where-Object { $_.RemoteAddress -notmatch '^(127\\.|::1|0\\.0\\.0\\.0)' } ` +
      `| Select-Object @{N='ip';E={$_.RemoteAddress}},@{N='port';E={$_.RemotePort}} ` +
      `| ConvertTo-Json -Compress -ErrorAction SilentlyContinue`
    )

    let rawConns: Array<{ ip: string; port: number }> = []
    try {
      const parsed = JSON.parse(tcpRes.stdout.trim())
      rawConns = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
    } catch { /* no connections or parse error */ }

    // 3. Load all cached CIDRs and build region lookup
    const regionIds = [
      'us-east-1','us-east-2','us-west-1','us-west-2','ca-central-1',
      'eu-central-1','eu-west-1','eu-west-2',
      'ap-south-1','ap-east-1','ap-northeast-1','ap-northeast-2',
      'ap-southeast-1','ap-southeast-2','sa-east-1',
    ]
    const regionCidrs: Array<{ regionId: string; cidrs: string[] }> = []
    for (const regionId of regionIds) {
      const cidrs = await getCachedCidrs(regionId)
      if (cidrs) regionCidrs.push({ regionId, cidrs })
    }

    function ipToInt(ip: string): number {
      return ip.split('.').reduce((acc, oct) => ((acc << 8) | parseInt(oct, 10)) >>> 0, 0)
    }
    function ipInCidr(ip: string, cidr: string): boolean {
      const [network, bits] = cidr.split('/')
      const prefix = parseInt(bits, 10)
      if (prefix === 0) return true
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0
      return (ipToInt(ip) & mask) === (ipToInt(network) & mask)
    }
    function findRegion(ip: string): string | null {
      for (const { regionId, cidrs } of regionCidrs) {
        for (const cidr of cidrs) {
          if (ipInCidr(ip, cidr)) return regionId
        }
      }
      return null
    }

    // 4. Annotate connections with region
    const seen = new Set<string>()
    const connections = rawConns
      .filter(c => {
        const key = `${c.ip}:${c.port}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(c => ({
        ip: c.ip,
        port: c.port,
        protocol: 'TCP' as const,
        regionId: findRegion(c.ip),
      }))

    return { running: true, connections }
  })

  // ── Settings: permanent regions ────────────────────────────────────────────
  ipcMain.handle('get-permanent-regions', async () => getPermanentRegions())

  ipcMain.handle('mark-permanent', async (_, regionId: string) => {
    await markPermanent(regionId)
    log('warning', `[${regionId}] Marked as permanent — rule will persist after app close`)
  })

  ipcMain.handle('unmark-permanent', async (_, regionId: string) => {
    await unmarkPermanent(regionId)
    log('info', `[${regionId}] Permanent flag removed — rule will be cleared on app close`)
  })
}
