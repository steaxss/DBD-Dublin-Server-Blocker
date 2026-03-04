import { Shield, ShieldOff, Loader2, AlertCircle, Server } from 'lucide-react'
import type { RegionState } from '../types'

interface RegionCardProps {
  region: RegionState
  onBlock: () => void
  onUnblock: () => void
}

export function RegionCard({ region, onBlock, onUnblock }: RegionCardProps) {
  const isBlocked = region.status === 'blocked'
  const isLoading = region.status === 'loading'
  const isError = region.status === 'error'

  return (
    <div
      className={[
        'relative flex flex-col rounded-xl border p-4 transition-all duration-200 backdrop-blur',
        isBlocked
          ? 'bg-red-500/10 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.1)]'
          : isError
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{region.flag}</span>
          <div>
            <div className="text-sm font-semibold text-zinc-100">{region.name}</div>
            <div className="text-[11px] text-zinc-500">{region.country}</div>
          </div>
        </div>

        {/* Status dot */}
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin mt-0.5" />
        ) : isBlocked ? (
          <span className="w-2 h-2 rounded-full bg-red-400 block mt-1 animate-pulse" />
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 block mt-1" />
        )}
      </div>

      {/* Region ID + CIDR count */}
      <div className="flex items-center gap-2 mb-3">
        <code className="text-[10px] text-zinc-600 font-mono">{region.id}</code>
        {region.cidrCount > 0 && (
          <>
            <span className="text-zinc-700 text-[10px]">·</span>
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600">
              <Server className="w-2.5 h-2.5" />
              {region.cidrCount}
            </span>
          </>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-3">
        {isBlocked ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-red-500/20 text-red-300 border border-red-500/30">
            <Shield className="w-2.5 h-2.5" />
            Blocked
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
            Error
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-500/20">
            ● Active
          </span>
        )}
      </div>

      {/* Error message */}
      {isError && region.error && (
        <p className="text-[10px] text-amber-400/80 mb-3 leading-relaxed">{region.error}</p>
      )}

      {/* Action button */}
      <button
        onClick={isBlocked ? onUnblock : onBlock}
        disabled={isLoading}
        className={[
          'mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all duration-150',
          isLoading
            ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/10'
            : isBlocked
            ? 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/15'
            : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
        ].join(' ')}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </>
        ) : isBlocked ? (
          <>
            <ShieldOff className="w-3 h-3" />
            Unblock
          </>
        ) : (
          <>
            <Shield className="w-3 h-3" />
            Block
          </>
        )}
      </button>
    </div>
  )
}
