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
    <div className="flex flex-col h-screen bg-[#1c1c1e] text-white overflow-hidden select-none">

      {/* Titlebar */}
      <Titlebar />

      {/* Toolbar */}
      <div className="shrink-0 vibrancy border-b border-white/[0.06] px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Status chips */}
        <div className="flex items-center gap-2">
          {blockedCount > 0 && (
            <div className="flex items-center gap-1.5 bg-[#ff453a]/15 text-[#ff453a] rounded-full px-3 py-1 text-[12px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-pulse block" />
              {blockedCount} blocked
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-white/[0.06] text-white/50 rounded-full px-3 py-1 text-[12px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 block" />
            {activeCount} live
          </div>
          {isAdmin === false && (
            <div className="flex items-center gap-1 bg-[#ff9f0a]/15 text-[#ff9f0a] rounded-full px-3 py-1 text-[12px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              No admin
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={refreshIps}
            disabled={globalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.11] text-white/70 hover:text-white text-[12px] font-medium tracking-[-0.01em] transition-all disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
            Refresh IPs
          </button>
          <button
            onClick={unblockAll}
            disabled={globalLoading || blockedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.11] text-white/70 hover:text-white text-[12px] font-medium tracking-[-0.01em] transition-all disabled:opacity-30"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Unblock All
          </button>
          <button
            onClick={blockAll}
            disabled={globalLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#ff453a] hover:bg-[#ff6961] text-white text-[12px] font-semibold tracking-[-0.01em] transition-all disabled:opacity-30 active:scale-[0.97]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Block All
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-[#1c1c1e]">
        <div className="mx-auto max-w-5xl px-5 py-5">
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
