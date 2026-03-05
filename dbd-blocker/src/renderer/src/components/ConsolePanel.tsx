import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { LogEntry } from '../types'

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
}

const LEVEL_COLOR: Record<string, string> = {
  info:    'rgba(255,255,255,0.45)',
  success: '#44FF41',
  warning: '#FF9800',
  error:   '#F44336',
  step:    'rgba(255,255,255,0.2)',
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
    <div
      className="shrink-0 flex flex-col border-t border-white/[0.06] relative z-10"
      style={{ height: '160px', background: 'rgba(10, 10, 10, 0.98)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="gradient-title text-[10px] font-bold uppercase tracking-[0.14em]">
            Console
          </span>
          {logs.length > 0 && (
            <span className="text-[9px] text-white/20 font-mono">{logs.length}</span>
          )}
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors uppercase tracking-wider font-semibold"
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
          <p className="text-[10px] text-white/15 pt-0.5">No output</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex items-baseline gap-3 text-[10px] leading-[1.9]">
              <span className="text-white/20 tabular-nums shrink-0">{entry.timestamp}</span>
              <span
                className="font-bold shrink-0 w-7"
                style={{ color: LEVEL_COLOR[entry.level] ?? 'rgba(255,255,255,0.4)' }}
              >
                {LEVEL_TAG[entry.level] ?? '?'}
              </span>
              <span
                className="break-all"
                style={{ color: LEVEL_COLOR[entry.level] ?? 'rgba(255,255,255,0.4)' }}
              >
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
