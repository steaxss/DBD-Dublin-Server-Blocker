import { useEffect, useState } from 'react'

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.win.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div className="titlebar-drag flex items-center justify-between h-[38px] min-h-[38px] select-none shrink-0 px-4 vibrancy border-b border-white/[0.06]">
      {/* App title */}
      <span className="text-[13px] font-semibold text-white/80 tracking-[-0.01em]">
        DBD Server Blocker
      </span>

      {/* Window controls */}
      <div className="flex items-center gap-1.5">
        {/* Minimize */}
        <button
          onClick={() => window.api.win.minimize()}
          className="win-btn group w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffaa00] flex items-center justify-center transition-colors"
        >
          <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="6" height="1" viewBox="0 0 6 1" fill="#7d5a00">
            <rect width="6" height="1" rx="0.5" />
          </svg>
        </button>
        {/* Maximize */}
        <button
          onClick={() => { window.api.win.maximize(); setIsMaximized(v => !v) }}
          className="win-btn group w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#1aaa2e] flex items-center justify-center transition-colors"
        >
          {isMaximized ? (
            <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="6" height="6" viewBox="0 0 6 6" fill="#0a4a14">
              <path d="M1 5L5 1M2 1H5V4" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="6" height="6" viewBox="0 0 6 6" fill="#0a4a14">
              <path d="M1 5L5 1M1 2V5H4" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>
        {/* Close */}
        <button
          onClick={() => window.api.win.close()}
          className="win-btn group w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#e04040] flex items-center justify-center transition-colors"
        >
          <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path d="M1 1l4 4M5 1L1 5" stroke="#6e0a07" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
