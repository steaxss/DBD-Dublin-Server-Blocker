import { app } from 'electron'
import { join } from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import https from 'https'

const AWS_URL = 'https://ip-ranges.amazonaws.com/ip-ranges.json'

function getCacheDir(): string {
  return join(app.getPath('userData'), 'ips')
}

function getCachePath(regionId: string): string {
  return join(getCacheDir(), `${regionId}.json`)
}

async function ensureCacheDir(): Promise<void> {
  const dir = getCacheDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
  })
}

export async function fetchRegionCidrs(regionId: string): Promise<string[]> {
  const data = (await fetchJson(AWS_URL)) as {
    prefixes: Array<{ ip_prefix: string; region: string; service: string }>
  }

  const cidrs = data.prefixes
    .filter(
      (entry) =>
        entry.region === regionId &&
        entry.ip_prefix &&
        !entry.ip_prefix.includes(':') && // IPv4 only
        entry.service === 'EC2'           // EC2 only — GameLift runs on EC2; S3/CF/Route53 not needed
    )
    .map((entry) => entry.ip_prefix)

  return [...new Set(cidrs)].sort()
}

export async function getCachedCidrs(regionId: string): Promise<string[] | null> {
  const path = getCachePath(regionId)
  if (!existsSync(path)) return null
  try {
    const raw = await readFile(path, 'utf-8')
    const { cidrs } = JSON.parse(raw)
    return Array.isArray(cidrs) ? cidrs : null
  } catch {
    return null
  }
}

export async function cacheCidrs(regionId: string, cidrs: string[]): Promise<void> {
  await ensureCacheDir()
  await writeFile(
    getCachePath(regionId),
    JSON.stringify({ regionId, cidrs, cachedAt: new Date().toISOString() }),
    'utf-8'
  )
}

export async function getCidrs(regionId: string, forceRefresh = false): Promise<string[]> {
  if (!forceRefresh) {
    const cached = await getCachedCidrs(regionId)
    if (cached && cached.length > 0) return cached
  }
  const cidrs = await fetchRegionCidrs(regionId)
  await cacheCidrs(regionId, cidrs)
  return cidrs
}

export async function fetchAndDiffCidrs(
  regionId: string
): Promise<{ cidrs: string[]; added: number; removed: number }> {
  const old = await getCachedCidrs(regionId)
  const oldSet = new Set(old ?? [])
  const cidrs = await fetchRegionCidrs(regionId)
  await cacheCidrs(regionId, cidrs)
  const newSet = new Set(cidrs)
  const added = cidrs.filter((c) => !oldSet.has(c)).length
  const removed = (old ?? []).filter((c) => !newSet.has(c)).length
  return { cidrs, added, removed }
}

export async function getCidrCounts(
  regionIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const id of regionIds) {
    const cached = await getCachedCidrs(id)
    counts[id] = cached?.length ?? 0
  }
  return counts
}
