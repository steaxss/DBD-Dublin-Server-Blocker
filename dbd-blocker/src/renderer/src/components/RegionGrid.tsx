import { regionsByContinent } from '../regions'
import { RegionCard } from './RegionCard'
import type { RegionState } from '../types'

interface RegionGridProps {
  regions: RegionState[]
  onBlock: (regionId: string) => void
  onUnblock: (regionId: string) => void
}

export function RegionGrid({ regions, onBlock, onUnblock }: RegionGridProps) {
  const regionMap = new Map(regions.map((r) => [r.id, r]))

  return (
    <div className="space-y-3">
      {regionsByContinent.map(({ continent, regions: contRegions }) => {
        const blockedInContinent = contRegions.filter(r => regionMap.get(r.id)?.status === 'blocked').length

        return (
          <section
            key={continent}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
          >
            {/* Section header */}
            <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {continent}
              </span>
              <span className={`text-[10px] font-semibold tabular-nums ${blockedInContinent > 0 ? 'text-red-500/70' : 'text-zinc-700'}`}>
                {blockedInContinent}/{contRegions.length} blocked
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {contRegions.map((r) => {
                const state = regionMap.get(r.id)
                if (!state) return null
                return (
                  <RegionCard
                    key={r.id}
                    region={state}
                    onBlock={() => onBlock(r.id)}
                    onUnblock={() => onUnblock(r.id)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
