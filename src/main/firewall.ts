import { execFile } from 'child_process'
import { promisify } from 'util'
import { getExePath, validateExePath } from './settings'

const execFileAsync = promisify(execFile)

export type LogEmitter = (level: string, message: string) => void

const REGION_CITIES: Record<string, string> = {
  'us-east-1':      'Virginia',
  'us-east-2':      'Ohio',
  'us-west-1':      'California',
  'us-west-2':      'Oregon',
  'ca-central-1':   'Montreal',
  'eu-central-1':   'Frankfurt',
  'eu-west-1':      'Dublin',
  'eu-west-2':      'London',
  'ap-south-1':     'Mumbai',
  'ap-east-1':      'HongKong',
  'ap-northeast-1': 'Tokyo',
  'ap-northeast-2': 'Seoul',
  'ap-southeast-1': 'Singapore',
  'ap-southeast-2': 'Sydney',
  'sa-east-1':      'SaoPaulo',
}

export const ruleName = (regionId: string): string => {
  const city = REGION_CITIES[regionId]
  return city ? `Block_DBD_${regionId}_${city}` : `Block_DBD_${regionId}`
}

// ---------------------------------------------------------------------------
// PowerShell helper (still needed for ipc.ts / firewall queries)
// ---------------------------------------------------------------------------

export async function ps(command: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { timeout: 30_000 }
    )
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return {
      ok: false,
      stdout: e.stdout?.trim() ?? '',
      stderr: e.stderr?.trim() ?? e.message ?? String(err)
    }
  }
}

// ---------------------------------------------------------------------------
// Registry path where Windows Firewall stores its rules
// Bypasses the broken Windows Defender Firewall management API (WMI/COM/netsh)
// ---------------------------------------------------------------------------

const REG_KEY = 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\FirewallRules'

// ---------------------------------------------------------------------------
// Rule operations — direct registry read/write via reg.exe + PowerShell
// ---------------------------------------------------------------------------

export async function ruleExists(regionId: string): Promise<boolean> {
  const name = ruleName(regionId)
  try {
    const { stdout } = await execFileAsync(
      'reg', ['query', REG_KEY, '/v', name],
      { timeout: 10_000 }
    )
    return stdout.includes(name)
  } catch {
    return false
  }
}

async function removeRule(regionId: string): Promise<void> {
  const name = ruleName(regionId)
  await execFileAsync(
    'reg', ['delete', REG_KEY, '/v', name, '/f'],
    { timeout: 10_000 }
  ).catch(() => { /* no rule to delete is not an error */ })
}

// ---------------------------------------------------------------------------
// Block a region — write directly to Windows Firewall registry
// ---------------------------------------------------------------------------

export async function blockRegion(
  regionId: string,
  cidrs: string[],
  log: LogEmitter
): Promise<{ ok: boolean; error?: string }> {
  const name = ruleName(regionId)

  // Step 1 — Preventive cleanup
  log('step', `[${regionId}] [1/3] Preventive cleanup...`)
  if (await ruleExists(regionId)) {
    await removeRule(regionId)
    if (await ruleExists(regionId)) {
      const err = 'Cannot remove residual rule'
      log('error', `[${regionId}] [1/3] ${err}`)
      return { ok: false, error: err }
    }
    log('step', `[${regionId}] [1/3] Residual rule removed`)
  } else {
    log('step', `[${regionId}] [1/3] OK (no residual rule)`)
  }

  // Step 2 — Write rule directly to Windows Firewall registry
  //   Bypasses the broken WDF management API (WMI/COM/netsh all return 0x2)
  //   MpsSvc monitors the FirewallRules registry key and enforces changes automatically
  log('step', `[${regionId}] [2/3] Creating firewall rule...`)

  const exePath = await getExePath()
  const exeCheck = validateExePath(exePath)
  if (!exeCheck.ok) {
    log('error', `[${regionId}] [2/3] FAILED — DBD exe not found: ${exeCheck.error}`)
    log('warning', `[${regionId}] Configure the correct DBD path in Settings (⚙)`)
    return { ok: false, error: 'DBD executable not found — open Settings and set the correct path' }
  }

  // Build Windows Firewall registry rule string (v2.33 format)
  // Per MS-GPFAS spec: each RA4= entry holds ONE value (range or subnet).
  // Multiple CIDRs = multiple RA4= tokens, NOT comma-separated in one token.
  // /32 hosts are not valid as subnet prefix (spec requires < 32) — use range format instead.
  const raEntries = cidrs.map(cidr => {
    if (cidr.endsWith('/32')) {
      const ip = cidr.slice(0, -3)
      return `RA4=${ip}-${ip}`
    }
    return `RA4=${cidr}`
  }).join('|')

  const ruleValue =
    `v2.33|Action=Block|Active=TRUE|Dir=Out|` +
    `${raEntries}|` +
    `App=${exePath}|` +
    `Name=${name}|Desc=|EmbedCtxt=${name}|`

  log('step', `[${regionId}] [2/3] Writing ${cidrs.length} CIDRs to registry...`)

  // Use reg.exe add directly — bypasses PS escaping and Set-ItemProperty subtleties
  let createOk = false
  let createErr = ''
  try {
    await execFileAsync(
      'reg', ['add', REG_KEY, '/v', name, '/t', 'REG_SZ', '/d', ruleValue, '/f'],
      { timeout: 30_000 }
    )
    createOk = true
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    const out = ((e.stdout ?? '') + (e.stderr ?? '')).trim()
    createErr = out || String(err)
  }

  if (!createOk) {
    await removeRule(regionId)
    log('error', `[${regionId}] [2/3] FAILED — ${createErr}`)
    return { ok: false, error: createErr || 'Registry write failed' }
  }
  log('step', `[${regionId}] [2/3] OK`)

  // Step 3 — Verify registry entry exists
  log('step', `[${regionId}] [3/3] Verifying...`)
  if (!(await ruleExists(regionId))) {
    await removeRule(regionId)
    const err = 'Rule not found in registry after creation'
    log('error', `[${regionId}] [3/3] FAILED — ${err}`)
    return { ok: false, error: err }
  }
  log('success', `[${regionId}] [3/3] OK — rule active`)
  log('success', `[${regionId}] BLOCKED (${cidrs.length} CIDRs)`)

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Unblock a region
// ---------------------------------------------------------------------------

export async function unblockRegion(
  regionId: string,
  log: LogEmitter
): Promise<{ ok: boolean; error?: string }> {
  log('step', `[${regionId}] [1/2] Removing rule...`)

  for (let attempt = 0; attempt < 3; attempt++) {
    await removeRule(regionId)
    if (!(await ruleExists(regionId))) break
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000))
  }

  if (await ruleExists(regionId)) {
    const err = `Failed after 3 attempts — remove manually: ${ruleName(regionId)}`
    log('error', `[${regionId}] [1/2] FAILED — ${err}`)
    return { ok: false, error: err }
  }

  log('step', `[${regionId}] [1/2] OK`)
  log('step', `[${regionId}] [2/2] Verification — no active rule`)
  log('success', `[${regionId}] UNBLOCKED`)

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Unblock all (called on app quit)
// ---------------------------------------------------------------------------

export async function unblockAll(regionIds: string[], log: LogEmitter): Promise<void> {
  log('info', 'Cleanup — removing all rules...')
  for (const id of regionIds) {
    if (await ruleExists(id)) {
      await removeRule(id)
      log('step', `[${id}] removed`)
    }
  }
  log('info', 'Cleanup complete')
}

// ---------------------------------------------------------------------------
// Read current firewall state (on startup)
// ---------------------------------------------------------------------------

export async function getBlockedRegions(regionIds: string[]): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {}
  for (const id of regionIds) {
    status[id] = await ruleExists(id)
  }
  return status
}
