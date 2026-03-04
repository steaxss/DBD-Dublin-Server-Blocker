import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const DBD_EXE =
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dead by Daylight\\DeadByDaylight\\Binaries\\Win64\\DeadByDaylight-Win64-Shipping.exe'

export type LogEmitter = (level: string, message: string) => void

export const ruleName = (regionId: string): string => `Block_DBD_${regionId}`

// ---------------------------------------------------------------------------
// PowerShell helper
// ---------------------------------------------------------------------------

async function ps(command: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
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
// Block a region (2-step creation — mandatory, lesson from original scripts)
// ---------------------------------------------------------------------------

export async function blockRegion(
  regionId: string,
  cidrs: string[],
  log: LogEmitter
): Promise<{ ok: boolean; error?: string }> {
  const name = ruleName(regionId)

  // Step 1 — Preventive cleanup
  log('step', `[${regionId}] [1/4] Nettoyage préventif...`)
  if (await ruleExists(regionId)) {
    await removeRule(regionId)
    if (await ruleExists(regionId)) {
      const err = 'Impossible de supprimer la règle résiduelle'
      log('error', `[${regionId}] ${err}`)
      return { ok: false, error: err }
    }
    log('step', `[${regionId}] [1/4] Règle résiduelle supprimée`)
  } else {
    log('step', `[${regionId}] [1/4] OK (aucune règle résiduelle)`)
  }

  // Step 2 — Create base rule without program filter
  log('step', `[${regionId}] [2/4] Création de la règle de base...`)
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
    const err = createResult.stderr || 'Échec de création de la règle'
    log('error', `[${regionId}] [2/4] ÉCHEC — ${err}`)
    return { ok: false, error: err }
  }
  log('step', `[${regionId}] [2/4] OK`)

  // Step 3 — Add program filter (separate step, mandatory)
  log('step', `[${regionId}] [3/4] Ajout du filtre programme...`)
  const programCmd = [
    `Get-NetFirewallRule -DisplayName "${name}"`,
    `| Get-NetFirewallApplicationFilter`,
    `| Set-NetFirewallApplicationFilter -Program "${DBD_EXE}" -ErrorAction Stop`
  ].join(' ')

  const programResult = await ps(programCmd)
  if (!programResult.ok) {
    await removeRule(regionId)
    const err = programResult.stderr || 'Échec du filtre programme'
    log('error', `[${regionId}] [3/4] ÉCHEC — ${err}`)
    return { ok: false, error: err }
  }
  log('step', `[${regionId}] [3/4] OK (DeadByDaylight-Win64-Shipping.exe)`)

  // Step 4 — Verify
  log('step', `[${regionId}] [4/4] Vérification...`)
  if (!(await ruleExists(regionId))) {
    await removeRule(regionId)
    const err = 'Règle introuvable après création'
    log('error', `[${regionId}] [4/4] ÉCHEC — ${err}`)
    return { ok: false, error: err }
  }
  log('success', `[${regionId}] [4/4] OK — règle active`)
  log('success', `[${regionId}] BLOQUÉ (${cidrs.length} CIDRs)`)

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Unblock a region
// ---------------------------------------------------------------------------

export async function unblockRegion(
  regionId: string,
  log: LogEmitter
): Promise<{ ok: boolean; error?: string }> {
  log('step', `[${regionId}] [1/2] Suppression de la règle...`)

  for (let attempt = 0; attempt < 3; attempt++) {
    await removeRule(regionId)
    if (!(await ruleExists(regionId))) break
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000))
  }

  if (await ruleExists(regionId)) {
    const err = `Échec après 3 tentatives — supprimez manuellement : ${ruleName(regionId)}`
    log('error', `[${regionId}] [1/2] ÉCHEC — ${err}`)
    return { ok: false, error: err }
  }

  log('step', `[${regionId}] [1/2] OK`)
  log('step', `[${regionId}] [2/2] Vérification — aucune règle active`)
  log('success', `[${regionId}] DÉBLOQUÉ`)

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Unblock all (called on app quit)
// ---------------------------------------------------------------------------

export async function unblockAll(regionIds: string[], log: LogEmitter): Promise<void> {
  log('info', 'Nettoyage — suppression de toutes les règles...')
  for (const id of regionIds) {
    if (await ruleExists(id)) {
      await removeRule(id)
      log('step', `[${id}] supprimé`)
    }
  }
  log('info', 'Nettoyage terminé')
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
