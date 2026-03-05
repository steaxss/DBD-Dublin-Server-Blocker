import { Shield, ShieldOff, Loader2, AlertCircle, Lock, Unlock, Target, Wifi } from 'lucide-react'
import { FlagIcon } from './FlagIcon'
import type { RegionState } from '../types'

interface RegionCardProps {
  region: RegionState
  isPermanent: boolean
  isExclusive: boolean
  isSelectingExclusive: boolean
  onBlock: () => void
  onUnblock: () => void
  onMarkPermanent: () => void
  onUnmarkPermanent: () => void
  onSelectExclusive: () => void
  onPing: () => void
}

export function RegionCard({
  region,
  isPermanent,
  isExclusive,
  isSelectingExclusive,
  onBlock,
  onUnblock,
  onMarkPermanent,
  onUnmarkPermanent,
  onSelectExclusive,
  onPing,
}: RegionCardProps) {
  const isBlocked = region.status === 'blocked'
  const isLoading = region.status === 'loading'
  const isError   = region.status === 'error'

  function pingColor() {
    if (region.pingMs === undefined) return 'rgba(255,255,255,0.25)'
    if (region.pingMs === null) return '#F44336'
    if (region.pingMs < 80) return '#44FF41'
    if (region.pingMs < 150) return '#FF9800'
    return '#F44336'
  }

  function pingLabel() {
    if (region.pingLoading) return '...'
    if (region.pingMs === undefined) return 'Ping'
    if (region.pingMs === null) return 'T/O'
    return `${region.pingMs}ms`
  }

  // Card style
  const cardStyle = isSelectingExclusive
    ? {
        background:    'rgba(255, 255, 255, 0.02)',
        outline:       '1px solid rgba(255, 255, 255, 0.07)',
        outlineOffset: '-1px',
        boxShadow:     '0 4px 16px rgba(0,0,0,0.3)',
        opacity: 0.45,
        filter: 'saturate(0.3)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }
    : isExclusive
    ? {
        background:    'rgba(181, 121, 255, 0.08)',
        outline:       '1px solid rgba(181, 121, 255, 0.35)',
        outlineOffset: '-1px',
        boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
      }
    : isBlocked
    ? {
        background:    isPermanent ? 'rgba(255, 152, 0, 0.06)' : 'rgba(244, 67, 54, 0.08)',
        outline:       isPermanent ? '1px solid rgba(255, 152, 0, 0.35)' : '1px solid rgba(244, 67, 54, 0.35)',
        outlineOffset: '-1px',
        boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
      }
    : isError
    ? {
        background:    'rgba(255, 152, 0, 0.08)',
        outline:       '1px solid rgba(255, 152, 0, 0.3)',
        outlineOffset: '-1px',
        boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
      }
    : {
        background:    'rgba(255, 255, 255, 0.03)',
        outline:       '1px solid rgba(255, 255, 255, 0.10)',
        outlineOffset: '-1px',
        boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
      }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl p-4 backdrop-blur-sm ${!isSelectingExclusive ? 'transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100' : ''}`}
      style={cardStyle}
      onClick={isSelectingExclusive ? (e) => { e.stopPropagation(); onSelectExclusive() } : undefined}
      onMouseEnter={isSelectingExclusive ? (e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.filter = 'saturate(1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.background = 'rgba(181, 121, 255, 0.11)'
        e.currentTarget.style.outline = '1.5px solid rgba(181, 121, 255, 0.6)'
      } : undefined}
      onMouseLeave={isSelectingExclusive ? (e) => {
        e.currentTarget.style.opacity = '0.45'
        e.currentTarget.style.filter = 'saturate(0.3)'
        e.currentTarget.style.transform = ''
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
        e.currentTarget.style.outline = '1px solid rgba(255, 255, 255, 0.07)'
      } : undefined}
    >
      {/* Exclusive badge */}
      {isExclusive && !isSelectingExclusive && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: 'rgba(181,121,255,0.25)', color: '#B579FF', border: '1px solid rgba(181,121,255,0.4)' }}
        >
          Exclusive Mode
        </div>
      )}

      {/* Top row: flag + status dot */}
      <div className="flex items-center justify-between mb-3">
        <FlagIcon
          code={region.countryCode}
          style={{ width: 32, height: 'auto', borderRadius: 3, display: 'block' }}
          fallback={region.flag}
        />

        <div className="flex items-center gap-1.5">
          {/* Permanent badge */}
          {isPermanent && isBlocked && !isSelectingExclusive && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }}
            >
              PERM
            </span>
          )}

          {isSelectingExclusive ? (
            <Target className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
          ) : isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
          ) : isBlocked ? (
            <span
              className="w-2.5 h-2.5 rounded-full block animate-pulse"
              style={{ background: '#44FF41', boxShadow: '0 0 10px rgba(68,255,65,0.9)' }}
            />
          ) : isError ? (
            <AlertCircle className="w-3.5 h-3.5" style={{ color: '#FF9800' }} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-white/10 block" />
          )}
        </div>
      </div>

      {/* Region ID */}
      <div className="text-[12px] font-bold text-white/30 tracking-[0.12em] mb-1.5 uppercase">
        {region.id}
      </div>

      {/* Region name */}
      <div className="text-[19px] font-bold mb-1 gradient-title leading-tight tracking-[0.03em] uppercase">
        {region.name}
      </div>

      {/* Country */}
      <div className="text-[13px] text-white/45 font-semibold mb-3 uppercase tracking-wider">
        {region.country}
      </div>

      {/* CIDR count */}
      {region.cidrCount > 0 && (
        <div className="text-[12px] text-white/20 mb-3">
          {region.cidrCount} IP ranges
        </div>
      )}

      {isError && region.error && (
        <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'rgba(255,152,0,0.85)' }}>
          {region.error}
        </p>
      )}

      {/* ── Bottom action area ── */}
      <div className="mt-auto">
        {isSelectingExclusive ? (
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            <Target className="w-3.5 h-3.5" />
            <span className="text-[12px] font-bold uppercase tracking-widest">Select</span>
          </div>
        ) : isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/30">
              Loading
            </span>
          </div>
        ) : (
          /* Normal segmented toggle: OPEN | BLOCK */
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={isBlocked ? onUnblock : undefined}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-bold uppercase tracking-widest ${!isBlocked ? 'seg-open-active' : 'seg-open-inactive'}`}
            >
              <ShieldOff className="w-4 h-4" />
              Open
            </button>

            <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            <button
              onClick={!isBlocked ? onBlock : undefined}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-bold uppercase tracking-widest ${isBlocked ? 'seg-block-active' : 'seg-block-inactive'}`}
            >
              <Shield className="w-4 h-4" />
              Block
            </button>
          </div>
        )}

        {/* Permanent control */}
        {isBlocked && !isLoading && !isSelectingExclusive && (
          isPermanent ? (
            <button
              onClick={onUnmarkPermanent}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200"
              style={{ background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)', color: '#FF9800' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,152,0,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,152,0,0.08)')}
            >
              <Unlock className="w-3 h-3" />
              Remove Permanent
            </button>
          ) : (
            <button
              onClick={onMarkPermanent}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,152,0,0.08)'
                e.currentTarget.style.color = '#FF9800'
                e.currentTarget.style.borderColor = 'rgba(255,152,0,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <Lock className="w-3 h-3" />
              Make Permanent
            </button>
          )
        )}

        {/* Ping button */}
        {!isSelectingExclusive && (
          <button
            onClick={onPing}
            disabled={region.pingLoading}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: pingColor(),
            }}
          >
            <Wifi className="w-3.5 h-3.5" />
            {pingLabel()}
          </button>
        )}
      </div>
    </div>
  )
}
