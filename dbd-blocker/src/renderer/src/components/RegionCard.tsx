import { Shield, ShieldOff, Loader2, AlertCircle } from 'lucide-react'
import type { RegionState } from '../types'

interface RegionCardProps {
  region: RegionState
  onBlock: () => void
  onUnblock: () => void
}

export function RegionCard({ region, onBlock, onUnblock }: RegionCardProps) {
  const isBlocked  = region.status === 'blocked'
  const isLoading  = region.status === 'loading'
  const isError    = region.status === 'error'

  return (
    <div className={[
      'relative flex flex-col rounded-xl p-3.5 transition-all duration-200',
      isBlocked
        ? 'bg-[#2c1010]'
        : isError
        ? 'bg-[#2c1e0a]'
        : 'bg-[#2c2c2e] hover:bg-[#333335]',
    ].join(' ')}>

      {/* Top row: flag + status dot */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl leading-none">{region.flag}</span>

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
        ) : isBlocked ? (
          <span
            className="w-2 h-2 rounded-full bg-[#32d74b] block animate-pulse"
            style={{ boxShadow: '0 0 8px rgba(50, 215, 75, 0.8)' }}
          />
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-[#ff9f0a]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-white/10 block" />
        )}
      </div>

      {/* Region ID */}
      <div className="text-[11px] font-medium text-white/40 tracking-wide mb-0.5 font-mono">
        {region.id}
      </div>

      {/* Region name */}
      <div className="text-[15px] font-semibold text-white tracking-[-0.02em] leading-tight mb-0.5">
        {region.name}
      </div>

      {/* Country */}
      <div className="text-[12px] text-white/40 font-normal mb-3">
        {region.country}
      </div>

      {/* CIDR count */}
      {region.cidrCount > 0 && (
        <div className="text-[11px] text-white/25 mb-3 font-mono">
          {region.cidrCount} ranges
        </div>
      )}

      {isError && region.error && (
        <p className="text-[11px] text-[#ff9f0a]/80 mb-3 leading-relaxed">{region.error}</p>
      )}

      {/* Status label */}
      <div className="mb-3 text-[11px] font-medium">
        {isBlocked ? (
          <span className="text-[#ff453a]">Blocked</span>
        ) : !isError && !isLoading ? (
          <span className="text-white/25">Not blocked</span>
        ) : null}
      </div>

      {/* Button */}
      <button
        onClick={isBlocked ? onUnblock : onBlock}
        disabled={isLoading}
        className={[
          'mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold tracking-[-0.01em] transition-all duration-150',
          isLoading
            ? 'bg-white/5 text-white/20 cursor-not-allowed'
            : isBlocked
            ? 'bg-white/[0.08] text-[#ff453a] hover:bg-[#ff453a]/15'
            : 'bg-[#ff453a] text-white hover:bg-[#ff6961] active:scale-[0.97]',
        ].join(' ')}
      >
        {isLoading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading</>
        ) : isBlocked ? (
          <><ShieldOff className="w-3.5 h-3.5" /> Unblock</>
        ) : (
          <><Shield className="w-3.5 h-3.5" /> Block</>
        )}
      </button>
    </div>
  )
}
