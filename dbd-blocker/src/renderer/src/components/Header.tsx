import { Shield, RefreshCw, ShieldOff, ShieldCheck, AlertTriangle } from 'lucide-react'

interface HeaderProps {
  blockedCount: number
  totalCount: number
  isAdmin: boolean | null
  globalLoading: boolean
  onBlockAll: () => void
  onUnblockAll: () => void
  onRefreshIps: () => void
}

export function Header({
  blockedCount,
  totalCount,
  isAdmin,
  globalLoading,
  onBlockAll,
  onUnblockAll,
  onRefreshIps
}: HeaderProps) {
  const activeCount = totalCount - blockedCount

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
      {/* Left: title + status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-zinc-100 text-sm tracking-wide">DBD Server Blocker</span>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        <div className="flex items-center gap-3 text-xs">
          {blockedCount > 0 ? (
            <span className="flex items-center gap-1.5 text-red-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-slow" />
              {blockedCount} bloquée{blockedCount > 1 ? 's' : ''}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {activeCount} active{activeCount > 1 ? 's' : ''}
          </span>
        </div>

        {isAdmin === false && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Non-admin — les opérations échoueront
            </div>
          </>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefreshIps}
          disabled={globalLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-40"
          title="Rafraîchir les IPs depuis AWS"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
          Refresh IPs
        </button>

        <div className="h-4 w-px bg-zinc-700" />

        <button
          onClick={onUnblockAll}
          disabled={globalLoading || blockedCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-40"
        >
          <ShieldOff className="w-3.5 h-3.5" />
          Tout débloquer
        </button>

        <button
          onClick={onBlockAll}
          disabled={globalLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors font-medium disabled:opacity-40"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Tout bloquer
        </button>
      </div>
    </div>
  )
}
