import { useState, useEffect, useCallback, useRef } from 'react'
import { Wifi, RefreshCw, Shield, ShieldOff, AlertTriangle, Activity, Server } from 'lucide-react'
import { FlagIcon } from './FlagIcon'
import { REGIONS } from '../regions'
import type { ActiveConnection, ActiveConnectionsResult } from '../types'

const POLL_INTERVAL_MS = 2500

interface ActiveConnectionsProps {
  onBlock:   (regionId: string) => void
  onUnblock: (regionId: string) => void
  permanentRegions: string[]
  blockedRegions: string[]
}

export function ActiveConnections({ onBlock, onUnblock, permanentRegions, blockedRegions }: ActiveConnectionsProps) {
  const [result, setResult]       = useState<ActiveConnectionsResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await (window.api as any).getActiveConnections()
      setResult(data)
      setLastUpdate(new Date())
    } catch {
      // silently ignore
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isPolling) {
      poll()
      pollingRef.current = setInterval(poll, POLL_INTERVAL_MS)
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [isPolling, poll])

  const regionConns = result?.connections.filter(c => c.regionId !== null) ?? []
  const unknownConns = result?.connections.filter(c => c.regionId === null) ?? []

  // Deduplicate by regionId for game server view
  const detectedRegions = [...new Map(regionConns.map(c => [c.regionId, c])).values()]

  const regionInfo = (id: string) => REGIONS.find(r => r.id === id)

  function pingColor(ms: number | undefined | null) {
    if (!ms) return 'rgba(255,255,255,0.25)'
    if (ms < 80) return '#44FF41'
    if (ms < 150) return '#FF9800'
    return '#F44336'
  }

  return (
    <div className="flex h-full">

      {/* ── Main panel ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Status banner */}
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: result?.running
              ? 'rgba(68,255,65,0.05)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${result?.running ? 'rgba(68,255,65,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {/* DBD status dot */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: result?.running ? 'rgba(68,255,65,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${result?.running ? 'rgba(68,255,65,0.25)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {result?.running ? (
              <Activity className="w-5 h-5" style={{ color: '#44FF41' }} />
            ) : (
              <Server className="w-5 h-5 text-white/25" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              {result?.running && (
                <span className="w-2 h-2 rounded-full animate-pulse block" style={{ background: '#44FF41', boxShadow: '0 0 6px rgba(68,255,65,0.8)' }} />
              )}
              <span className="text-[13px] font-bold text-white/80">
                {result === null ? 'Waiting…' : result.running ? 'Dead by Daylight is running' : 'Dead by Daylight is not running'}
              </span>
            </div>
            <div className="text-[11px] text-white/35">
              {result?.running
                ? `${result.connections.length} active TCP connection${result.connections.length !== 1 ? 's' : ''} detected`
                : 'Launch the game to start monitoring'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPolling(v => !v)}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-px"
              style={{
                background: isPolling ? 'rgba(68,255,65,0.08)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isPolling ? 'rgba(68,255,65,0.2)' : 'rgba(255,255,255,0.1)'}`,
                color: isPolling ? '#44FF41' : 'rgba(255,255,255,0.35)',
              }}
            >
              {isPolling ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={poll}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:-translate-y-px disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Detected AWS regions */}
        {result?.running && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-3">
              AWS Regions Detected
            </div>

            {detectedRegions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Wifi className="w-8 h-8 text-white/10 mb-3" />
                <div className="text-[12px] font-semibold text-white/25 mb-1">No AWS servers detected</div>
                <div className="text-[11px] text-white/15">Join a lobby to see your game server</div>
              </div>
            ) : (
              <div className="space-y-2">
                {detectedRegions.map(conn => {
                  const region = regionInfo(conn.regionId!)
                  const isBlocked = blockedRegions.includes(conn.regionId!)
                  const isPerm = permanentRegions.includes(conn.regionId!)
                  const otherConns = regionConns.filter(c => c.regionId === conn.regionId && c.port !== conn.port)

                  return (
                    <div
                      key={conn.regionId}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{
                        background: isBlocked ? 'rgba(244,67,54,0.06)' : 'rgba(68,255,65,0.05)',
                        border: `1px solid ${isBlocked ? 'rgba(244,67,54,0.25)' : 'rgba(68,255,65,0.18)'}`,
                      }}
                    >
                      {/* Flag */}
                      {region && (
                        <FlagIcon
                          code={region.countryCode}
                          style={{ width: 36, height: 'auto', borderRadius: 4, display: 'block', flexShrink: 0 }}
                          fallback={region?.flag ?? ''}
                        />
                      )}

                      {/* Region info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-bold text-white/85 truncate">
                            {region?.name ?? conn.regionId}
                          </span>
                          {region && (
                            <span className="text-[10px] text-white/35 font-medium">{region.country}</span>
                          )}
                          {isPerm && isBlocked && (
                            <span className="text-[8px] font-bold px-1.5 py-px rounded" style={{ background: 'rgba(255,152,0,0.12)', color: '#FF9800' }}>PERM</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-white/30">{conn.regionId}</span>
                          <span className="text-[10px] font-mono text-white/20">{conn.ip}:{conn.port}</span>
                          {otherConns.length > 0 && (
                            <span className="text-[10px] text-white/20">+{otherConns.length} more</span>
                          )}
                        </div>
                      </div>

                      {/* Status + action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                          style={{
                            background: isBlocked ? 'rgba(244,67,54,0.12)' : 'rgba(68,255,65,0.1)',
                            color: isBlocked ? '#F44336' : '#44FF41',
                          }}
                        >
                          {isBlocked ? 'Blocked' : 'Open'}
                        </div>
                        {isBlocked ? (
                          <button
                            onClick={() => onUnblock(conn.regionId!)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:-translate-y-px"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
                          >
                            <ShieldOff className="w-3 h-3" />
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => onBlock(conn.regionId!)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:-translate-y-px"
                            style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#F44336' }}
                          >
                            <Shield className="w-3 h-3" />
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Unknown / non-AWS connections */}
        {result?.running && unknownConns.length > 0 && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/20 mb-3">
              Other connections ({unknownConns.length})
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {unknownConns.slice(0, 12).map((conn, i) => (
                <div
                  key={`${conn.ip}:${conn.port}`}
                  className="flex items-center gap-3 px-4 py-2"
                  style={{ borderBottom: i < Math.min(unknownConns.length, 12) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/15 shrink-0" />
                  <span className="text-[11px] font-mono text-white/30 flex-1">{conn.ip}</span>
                  <span className="text-[10px] font-mono text-white/20">:{conn.port}</span>
                  <span className="text-[9px] text-white/15 uppercase">{conn.protocol}</span>
                </div>
              ))}
              {unknownConns.length > 12 && (
                <div className="px-4 py-2 text-[10px] text-white/20">+{unknownConns.length - 12} more</div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── Right info panel ── */}
      <div
        className="w-[240px] shrink-0 flex flex-col p-4 gap-4"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,12,12,0.98)' }}
      >
        {/* Info */}
        <div>
          <div className="gradient-title text-[10px] font-bold uppercase tracking-[0.14em] mb-3">How it works</div>
          <div className="space-y-2.5">
            {[
              { icon: Activity, text: 'Monitors TCP connections from the DBD process every 2.5s' },
              { icon: Server, text: 'Matches IPs against cached AWS IP ranges to identify regions' },
              { icon: Shield, text: 'Block or unblock the detected server directly' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex gap-2.5">
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/25" />
                <span className="text-[11px] text-white/35 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.18)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#FF9800' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF9800' }}>Note</span>
          </div>
          <p className="text-[10px] text-white/35 leading-relaxed">
            DBD uses UDP for gameplay. TCP connections shown here are matchmaking and backend — the actual game server IP may differ slightly.
          </p>
        </div>

        {/* Last update */}
        {lastUpdate && (
          <div className="mt-auto text-[10px] font-mono text-white/20 text-center">
            Updated {lastUpdate.toLocaleTimeString('fr-FR', { hour12: false })}
          </div>
        )}
      </div>
    </div>
  )
}
