import { useEffect, useState } from 'react'
import { RefreshCw, ShieldOff, ShieldCheck, AlertTriangle, Shield } from 'lucide-react'

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
  const [isMaximized, setIsMaximized] = useState(false)
  const activeCount = totalCount - blockedCount

  useEffect(() => {
    window.api.win.isMaximized().then(setIsMaximized)
  }, [])

  const handleMaximize = () => {
    window.api.win.maximize()
    setIsMaximized((v) => !v)
  }

  return (
    <div className="flex flex-col shrink-0">
      {/* ── Discord-style Titlebar ── */}
      <div className="titlebar-drag flex items-center justify-between h-[34px] min-h-[34px] bg-[#111114] border-b border-white/[0.06] select-none pl-3 pr-0">
        {/* Left: icon + title */}
        <div className="flex items-center gap-2 text-[11.5px] font-medium tracking-wide text-zinc-400 truncate">
          <Shield className="w-3.5 h-3.5 shrink-0 text-violet-400" />
          <span className="text-zinc-300 font-semibold">DBD Server Blocker</span>
          <span className="text-zinc-600">—</span>
          <span className="text-zinc-500">v1.0.0</span>
          <span className="text-zinc-600">—</span>
          <span className="text-zinc-500">by Steaxs</span>
        </div>

        {/* Right: window controls */}
        <div className="flex items-center h-full">
          {/* Minimize */}
          <button
            onClick={() => window.api.win.minimize()}
            className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
            aria-label="Minimize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="5.5" width="10" height="1" rx="0.5" fill="currentColor" />
            </svg>
          </button>

          {/* Maximize / Restore */}
          <button
            onClick={handleMaximize}
            className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2.5" y="3.5" width="6" height="6" rx="0.6" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M3.5 3.5V2.2a.6.6 0 0 1 .6-.6h5.2a.6.6 0 0 1 .6.6v5.2a.6.6 0 0 1-.6.6H8.5" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="1.5" width="9" height="9" rx="0.6" stroke="currentColor" strokeWidth="1.1" fill="none" />
              </svg>
            )}
          </button>

          {/* Close (hides to tray) */}
          <button
            onClick={() => window.api.win.close()}
            className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-400 hover:bg-[#e81123] hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        {/* Left: status */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-400/90">
              Server Blocker
            </div>
            <h1 className="text-base font-semibold tracking-tight leading-tight text-zinc-100">
              Dead by Daylight — AWS Regions
            </h1>
          </div>

          <div className="h-8 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-3 text-xs">
            {blockedCount > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {blockedCount} blocked
              </span>
            )}
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {activeCount} active
            </span>
            {isAdmin === false && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Not admin — firewall operations will fail
              </span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshIps}
            disabled={globalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] rounded-md transition-colors disabled:opacity-40 border border-white/[0.06]"
            title="Refresh IP ranges from AWS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
            Refresh IPs
          </button>

          <button
            onClick={onUnblockAll}
            disabled={globalLoading || blockedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.08] rounded-md transition-colors disabled:opacity-40 border border-white/[0.06]"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Unblock All
          </button>

          <button
            onClick={onBlockAll}
            disabled={globalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors font-medium disabled:opacity-40"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Block All
          </button>
        </div>
      </div>
    </div>
  )
}
