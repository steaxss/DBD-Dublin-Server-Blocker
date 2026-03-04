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
  const isNotBlocked = !isBlocked && !isLoading && !isError

  return (
    <div className={[
      'relative flex flex-col rounded-2xl border p-4 transition-all duration-300 overflow-hidden',
      isBlocked
        ? 'bg-[#1c0a0a] border-red-500/40 glow-red'
        : isError
        ? 'bg-[#1a120a] border-amber-500/40'
        : 'bg-[#111118] border-[#1e1e30] hover:border-violet-500/30 hover:bg-[#14141f]',
    ].join(' ')}>

      {/* Glow blob for blocked */}
      {isBlocked && (
        <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-red-500/20 blur-2xl" />
      )}

      {/* Flag + name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{region.flag}</span>
          <div>
            <div className="text-sm font-bold text-white leading-tight">{region.name}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{region.country}</div>
          </div>
        </div>

        {/* Status indicator */}
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-zinc-600 animate-spin mt-0.5" />
        ) : isBlocked ? (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 block mt-1" />
        )}
      </div>

      {/* Region ID */}
      <code className="text-[10px] font-mono text-zinc-600 mb-3 block">{region.id}</code>

      {/* Status badge */}
      <div className="mb-4">
        {isBlocked ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <Shield className="w-3 h-3" /> Blocked
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-500 border border-[#1e1e30]">
            Not Blocked
          </span>
        )}
      </div>

      {isError && region.error && (
        <p className="text-[10px] text-amber-400/70 mb-3 leading-relaxed">{region.error}</p>
      )}

      {/* CIDR count */}
      {region.cidrCount > 0 && (
        <div className="text-[10px] text-zinc-700 mb-3">{region.cidrCount} IP ranges</div>
      )}

      {/* Button */}
      <button
        onClick={isBlocked ? onUnblock : onBlock}
        disabled={isLoading}
        className={[
          'mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200',
          isLoading
            ? 'bg-[#1a1a28] text-zinc-700 cursor-not-allowed'
            : isBlocked
            ? 'bg-[#2a1010] hover:bg-[#3a1515] text-red-300 border border-red-500/20 hover:border-red-500/40'
            : 'bg-violet-600 hover:bg-violet-500 text-white hover:glow-violet',
        ].join(' ')}
      >
        {isLoading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
        ) : isBlocked ? (
          <><ShieldOff className="w-3.5 h-3.5" /> Unblock</>
        ) : (
          <><Shield className="w-3.5 h-3.5" /> Block</>
        )}
      </button>
    </div>
  )
}
