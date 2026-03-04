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
        'relative flex flex-col rounded-xl border p-3.5 transition-all duration-200',
        isBlocked
          ? 'bg-red-500/[0.08] border-red-500/25 shadow-[0_4px_16px_rgba(239,68,68,0.08)]'
          : isError
          ? 'bg-amber-500/[0.08] border-amber-500/25'
          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]'
      ].join(' ')}
    >
      {/* Flag + name + status dot */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{region.flag}</span>
          <div>
            <div className="text-[13px] font-semibold text-zinc-100 leading-tight">{region.name}</div>
            <div className="text-[10px] text-zinc-500">{region.country}</div>
          </div>
        </div>
        <div className="mt-0.5 shrink-0">
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />
          ) : isBlocked ? (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 block animate-pulse" />
          ) : isError ? (
            <AlertCircle className="w-3 h-3 text-amber-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 block" />
          )}
        </div>
      </div>

      {/* Region ID + CIDR count */}
      <div className="flex items-center gap-1.5 mb-3">
        <code className="text-[10px] text-zinc-600 font-mono">{region.id}</code>
        {region.cidrCount > 0 && (
          <>
            <span className="text-zinc-800">·</span>
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-700">
              <Server className="w-2.5 h-2.5" />
              {region.cidrCount}
            </span>
          </>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-3">
        {isBlocked ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-300/90 border border-red-500/20">
            <Shield className="w-2.5 h-2.5" /> Blocked
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300/90 border border-amber-500/20">
            <AlertCircle className="w-2.5 h-2.5" /> Error
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 border border-white/[0.07]">
            ● Not Blocked
          </span>
        )}
      </div>

      {isError && region.error && (
        <p className="text-[10px] text-amber-400/70 mb-2.5 leading-relaxed">{region.error}</p>
      )}

      {/* Action button */}
      <button
        onClick={isBlocked ? onUnblock : onBlock}
        disabled={isLoading}
        className={[
          'mt-auto w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
          isLoading
            ? 'bg-white/[0.04] text-zinc-700 cursor-not-allowed border border-white/[0.06]'
            : isBlocked
            ? 'bg-white/[0.08] hover:bg-white/[0.13] text-zinc-300 border border-white/[0.12]'
            : 'bg-red-500/[0.12] hover:bg-red-500/[0.22] text-red-300/90 border border-red-500/20'
        ].join(' ')}
      >
        {isLoading ? (
          <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing...</>
        ) : isBlocked ? (
          <><ShieldOff className="w-2.5 h-2.5" /> Unblock</>
        ) : (
          <><Shield className="w-2.5 h-2.5" /> Block</>
        )}
      </button>
    </div>
  )
}
