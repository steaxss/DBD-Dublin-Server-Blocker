import { useAppState } from './hooks/useAppState'
import { Header } from './components/Header'
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

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      <Header
        blockedCount={blockedCount}
        totalCount={regions.length}
        isAdmin={isAdmin}
        globalLoading={globalLoading}
        onBlockAll={blockAll}
        onUnblockAll={unblockAll}
        onRefreshIps={refreshIps}
      />

      <RegionGrid
        regions={regions}
        onBlock={blockRegion}
        onUnblock={unblockRegion}
      />

      <ConsolePanel logs={logs} onClear={clearLogs} />
    </div>
  )
}
