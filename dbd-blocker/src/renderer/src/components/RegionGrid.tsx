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
    <div className="space-y-6">
      {regionsByContinent.map(({ continent, regions: contRegions }) => {
        const blockedCount = contRegions.filter(r => regionMap.get(r.id)?.status === 'blocked').length

        return (
          <section key={continent}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em]">
                {continent}
              </span>
              {blockedCount > 0 && (
                <span className="text-[11px] font-medium text-[#ff453a]">
                  {blockedCount} blocked
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
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
