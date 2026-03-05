import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { LogEntry } from '../types'

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
}

const LEVEL_COLOR: Record<string, string> = {
  info:    'text-white/50',
  success: 'text-[#32d74b]',
  warning: 'text-[#ff9f0a]',
  error:   'text-[#ff453a]',
  step:    'text-white/25',
}

const LEVEL_TAG: Record<string, string> = {
  info:    'INFO',
  success: 'OK',
  warning: 'WARN',
  error:   'ERR',
  step:    '›',
}

export function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const bottomRef    = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stickRef     = useRef(true)

  useEffect(() => {
    if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  return (
    <div className="shrink-0 bg-[#141416] border-t border-white/[0.06] flex flex-col" style={{ height: '168px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-white/50">Console</span>
          {logs.length > 0 && (
            <span className="text-[11px] text-white/20 font-mono">{logs.length}</span>
          )}
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[12px] text-white/25 hover:text-white/60 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Logs */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-5 py-2.5 space-y-0.5 font-mono"
      >
        {logs.length === 0 ? (
          <p className="text-[11px] text-white/15 pt-0.5">No output</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex items-baseline gap-3 text-[11px] leading-[1.8]">
              <span className="text-white/20 tabular-nums shrink-0">{entry.timestamp}</span>
              <span className={`font-semibold shrink-0 w-7 ${LEVEL_COLOR[entry.level] ?? 'text-white/40'}`}>
                {LEVEL_TAG[entry.level] ?? '?'}
              </span>
              <span className={`break-all ${LEVEL_COLOR[entry.level] ?? 'text-white/40'}`}>
                {entry.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
