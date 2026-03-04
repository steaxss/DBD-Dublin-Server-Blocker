import { RefreshCw, ShieldOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useAppState } from './hooks/useAppState'
import { Titlebar } from './components/Header'
import { RegionGrid } from './components/RegionGrid'
import { ConsolePanel } from './components/ConsolePanel'

export default function App() {
  const {
    regions,
    logs,
    isAdmin,
    globalLoading,
    blockedCount,
    blockRegion,
    unblockRegion,
    blockAll,
    unblockAll,
    refreshIps,
    clearLogs
  } = useAppState()

  const activeCount = regions.length - blockedCount

  return (
    <div className="flex flex-col h-screen bg-[#080810] text-zinc-100 overflow-hidden select-none">

      {/* Titlebar */}
      <Titlebar />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto dot-grid">
        <div className="mx-auto max-w-5xl px-5 pb-5 pt-4">

          {/* Header card */}
          <header className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur px-5 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-violet-400 mb-0.5">
                Firewall Manager
              </div>
              <h1 className="text-[15px] font-bold tracking-tight text-white">
                Dead by Daylight — AWS Server Blocker
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Counters */}
              <div className="flex items-center gap-3 text-xs">
                {blockedCount > 0 && (
                  <span className="flex items-center gap-1.5 font-bold text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    {blockedCount} blocked
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 inline-block" />
                  {activeCount} not blocked
                </span>
                {isAdmin === false && (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    Not admin
                  </span>
                )}
              </div>

              <div className="h-5 w-px bg-white/[0.08]" />

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={refreshIps}
                  disabled={globalLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07] rounded-lg transition-all disabled:opacity-40 border border-white/[0.07]"
                >
                  <RefreshCw className={`w-3 h-3 ${globalLoading ? 'animate-spin' : ''}`} />
                  Refresh IPs
                </button>
                <button
                  onClick={unblockAll}
                  disabled={globalLoading || blockedCount === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.07] rounded-lg transition-all disabled:opacity-40 border border-white/[0.07]"
                >
                  <ShieldOff className="w-3 h-3" />
                  Unblock All
                </button>
                <button
                  onClick={blockAll}
                  disabled={globalLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all disabled:opacity-40 hover:glow-violet"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Block All
                </button>
              </div>
            </div>
          </header>

          {/* Region grid */}
          <RegionGrid
            regions={regions}
            onBlock={blockRegion}
            onUnblock={unblockRegion}
          />

        </div>
      </div>

      {/* Console */}
      <ConsolePanel logs={logs} onClear={clearLogs} />
    </div>
  )
}
