import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.win.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div className="titlebar-drag flex items-center justify-between h-[32px] min-h-[32px] bg-[#09090f] border-b border-white/[0.05] select-none shrink-0 pl-3 pr-0">
      <div className="flex items-center gap-2 text-[11px] text-zinc-600 truncate">
        <Shield className="w-3 h-3 shrink-0 text-red-500" />
        <span className="text-zinc-400 font-semibold tracking-wide">DBD Server Blocker</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-700">v1.0.0</span>
      </div>

      <div className="flex items-center h-full">
        <button onClick={() => window.api.win.minimize()}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="5.5" width="10" height="1" rx="0.5" fill="currentColor" />
          </svg>
        </button>
        <button onClick={() => { window.api.win.maximize(); setIsMaximized(v => !v) }}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors">
          {isMaximized ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="2.5" y="3.5" width="6" height="6" rx="0.6" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M3.5 3.5V2.2a.6.6 0 0 1 .6-.6h5.2a.6.6 0 0 1 .6.6v5.2a.6.6 0 0 1-.6.6H8.5" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="1.5" width="9" height="9" rx="0.6" stroke="currentColor" strokeWidth="1.1" fill="none" />
            </svg>
          )}
        </button>
        <button onClick={() => window.api.win.close()}
          className="win-btn h-full w-[46px] flex items-center justify-center text-zinc-600 hover:bg-[#c42b1c] hover:text-white transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
