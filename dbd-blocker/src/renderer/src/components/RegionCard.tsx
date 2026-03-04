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
        'relative flex flex-col rounded-lg border p-4 transition-all duration-200',
        isBlocked
          ? 'bg-red-950/40 border-red-800/60 shadow-red-950/20 shadow-lg'
          : isError
          ? 'bg-amber-950/30 border-amber-800/50'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      ].join(' ')}
    >
      {/* Top row: flag + name + status dot */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{region.flag}</span>
          <div>
            <div className="text-sm font-semibold text-zinc-100">{region.name}</div>
            <div className="text-xs text-zinc-500">{region.country}</div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-0.5">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          ) : isBlocked ? (
            <span className="w-2 h-2 rounded-full bg-red-400 block animate-pulse-slow" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
          )}
        </div>
      </div>

      {/* Region ID + CIDR count */}
      <div className="flex items-center gap-2 mb-4">
        <code className="text-xs text-zinc-500 font-mono">{region.id}</code>
        {region.cidrCount > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Server className="w-3 h-3" />
              {region.cidrCount} CIDRs
            </span>
          </>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-4">
        {isBlocked ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-900/60 text-red-300 border border-red-800/50">
            <Shield className="w-3 h-3" />
            BLOQUÉ
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-800/50">
            <AlertCircle className="w-3 h-3" />
            ERREUR
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-emerald-400 border border-emerald-900/50">
            ● ACTIF
          </span>
        )}
      </div>

      {/* Error message */}
      {isError && region.error && (
        <p className="text-xs text-amber-400/80 mb-3 leading-relaxed">{region.error}</p>
      )}

      {/* Action button */}
      <button
        onClick={isBlocked ? onUnblock : onBlock}
        disabled={isLoading}
        className={[
          'mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-all duration-150',
          isLoading
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : isBlocked
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            : 'bg-red-700 hover:bg-red-600 text-white'
        ].join(' ')}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            En cours...
          </>
        ) : isBlocked ? (
          <>
            <ShieldOff className="w-3 h-3" />
            Débloquer
          </>
        ) : (
          <>
            <Shield className="w-3 h-3" />
            Bloquer
          </>
        )}
      </button>
    </div>
  )
}
