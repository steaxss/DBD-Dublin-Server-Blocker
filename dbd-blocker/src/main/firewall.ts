import { execFile } from 'child_process'
import { promisify } from 'util'
import { getExePath } from './settings'

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
// PowerShell helper
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
// Rule operations
// ---------------------------------------------------------------------------

export async function ruleExists(regionId: string): Promise<boolean> {
  const name = ruleName(regionId)
  const { stdout } = await ps(
    `Get-NetFirewallRule -DisplayName "${name}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty DisplayName`
  )
  return stdout.includes(name)
}

async function removeRule(regionId: string): Promise<void> {
  const name = ruleName(regionId)
  await ps(`Remove-NetFirewallRule -DisplayName "${name}" -ErrorAction SilentlyContinue`)
}

// ---------------------------------------------------------------------------
// Block a region (2-step creation — mandatory, lesson from original PS scripts)
// ---------------------------------------------------------------------------

export async function blockRegion(
  regionId: string,
  cidrs: string[],
  log: LogEmitter
): Promise<{ ok: boolean; error?: string }> {
  const name = ruleName(regionId)

  // Step 1 — Preventive cleanup
  log('step', `[${regionId}] [1/4] Preventive cleanup...`)
  if (await ruleExists(regionId)) {
    await removeRule(regionId)
    if (await ruleExists(regionId)) {
      const err = 'Cannot remove residual rule'
      log('error', `[${regionId}] ${err}`)
      return { ok: false, error: err }
    }
    log('step', `[${regionId}] [1/4] Residual rule removed`)
  } else {
    log('step', `[${regionId}] [1/4] OK (no residual rule)`)
  }

  // Step 2 — Create base rule without program filter
  log('step', `[${regionId}] [2/4] Creating base rule...`)
  const cidrsStr = cidrs.map((c) => `"${c}"`).join(',')
  const createCmd = [
    `New-NetFirewallRule`,
    `-DisplayName "${name}"`,
    `-Direction Outbound`,
    `-Action Block`,
    `-Protocol Any`,
    `-RemoteAddress @(${cidrsStr})`,
    `-Description "Blocks DBD connections to AWS ${regionId}"`,
    `-Enabled True`,
    `-Profile Any`,
    `-ErrorAction Stop | Out-Null`
  ].join(' ')

  const createResult = await ps(createCmd)
  if (!createResult.ok) {
    await removeRule(regionId)
    const err = createResult.stderr || 'Failed to create rule'
    log('error', `[${regionId}] [2/4] FAILED — ${err}`)
    return { ok: false, error: err }
  }
  log('step', `[${regionId}] [2/4] OK`)

  // Step 3 — Add program filter (separate step, mandatory)
  log('step', `[${regionId}] [3/4] Adding program filter...`)
  const exePath = await getExePath()
  const programCmd = [
    `Get-NetFirewallRule -DisplayName "${name}"`,
    `| Get-NetFirewallApplicationFilter`,
    `| Set-NetFirewallApplicationFilter -Program "${exePath}" -ErrorAction Stop`
  ].join(' ')

  const programResult = await ps(programCmd)
  if (!programResult.ok) {
    await removeRule(regionId)
    const err = programResult.stderr || 'Failed to set program filter'
    log('error', `[${regionId}] [3/4] FAILED — ${err}`)
    return { ok: false, error: err }
  }
  log('step', `[${regionId}] [3/4] OK (DeadByDaylight-Win64-Shipping.exe)`)

  // Step 4 — Verify
  log('step', `[${regionId}] [4/4] Verifying...`)
  if (!(await ruleExists(regionId))) {
    await removeRule(regionId)
    const err = 'Rule not found after creation'
    log('error', `[${regionId}] [4/4] FAILED — ${err}`)
    return { ok: false, error: err }
  }
  log('success', `[${regionId}] [4/4] OK — rule active`)
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
