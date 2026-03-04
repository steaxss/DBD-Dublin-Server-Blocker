import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.win.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div className="titlebar-drag flex items-center justify-between h-[34px] min-h-[34px] bg-[#111114] border-b border-white/[0.06] select-none shrink-0 pl-3 pr-0">
      {/* Left */}
      <div className="flex items-center gap-2 text-[11.5px] font-medium tracking-wide text-zinc-400 truncate">
        <Shield className="w-3.5 h-3.5 shrink-0 text-violet-400" />
        <span className="text-zinc-300 font-semibold">DBD Server Blocker</span>
        <span className="text-zinc-700">—</span>
        <span className="text-zinc-600">v1.0.0</span>
        <span className="text-zinc-700">—</span>
        <span className="text-zinc-600">by Steaxs</span>
      </div>

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          onClick={() => window.api.win.minimize()}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
          aria-label="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="5.5" width="10" height="1" rx="0.5" fill="currentColor" />
          </svg>
        </button>

        <button
          onClick={() => { window.api.win.maximize(); setIsMaximized(v => !v) }}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
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

        <button
          onClick={() => window.api.win.close()}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-500 hover:bg-[#e81123] hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
