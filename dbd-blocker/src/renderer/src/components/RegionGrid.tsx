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
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      {regionsByContinent.map(({ continent, regions: contRegions }) => (
        <section key={continent}>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-3">
            {continent}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
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
      ))}
    </div>
  )
}
