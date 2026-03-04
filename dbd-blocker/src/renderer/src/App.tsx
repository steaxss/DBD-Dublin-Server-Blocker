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
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">

      {/* ── Titlebar ── */}
      <Titlebar />

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 pb-5 pt-4">

          {/* Status / action header card */}
          <header className="mb-4 rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,.30)] px-5 py-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-400/90">
                Firewall Manager
              </div>
              <h1 className="text-[15px] font-semibold tracking-tight leading-tight text-zinc-100">
                Dead by Daylight — AWS Server Blocker
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Status */}
              <div className="flex items-center gap-3 text-xs">
                {blockedCount > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                    {blockedCount} blocked
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />
                  {activeCount} not blocked
                </span>
                {isAdmin === false && (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
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
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] rounded-lg transition-colors disabled:opacity-40 border border-white/[0.07]"
                >
                  <RefreshCw className={`w-3 h-3 ${globalLoading ? 'animate-spin' : ''}`} />
                  Refresh IPs
                </button>
                <button
                  onClick={unblockAll}
                  disabled={globalLoading || blockedCount === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.08] rounded-lg transition-colors disabled:opacity-40 border border-white/[0.07]"
                >
                  <ShieldOff className="w-3 h-3" />
                  Unblock All
                </button>
                <button
                  onClick={blockAll}
                  disabled={globalLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-40"
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

      {/* ── Console (fixed bottom) ── */}
      <ConsolePanel logs={logs} onClear={clearLogs} />
    </div>
  )
}
