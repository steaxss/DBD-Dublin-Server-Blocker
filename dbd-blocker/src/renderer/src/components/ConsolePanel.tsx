import { useEffect, useRef } from 'react'
import { Terminal, Trash2 } from 'lucide-react'
import type { LogEntry } from '../types'

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
}

const LEVEL_STYLES: Record<string, string> = {
  info:    'text-zinc-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
  step:    'text-zinc-600'
}

const LEVEL_PREFIX: Record<string, string> = {
  info:    'INFO ',
  success: 'OK   ',
  warning: 'WARN ',
  error:   'ERR  ',
  step:    '  ›  '
}

export function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  return (
    <div
      className="shrink-0 border-t border-white/[0.06] bg-[#0d0d10] flex flex-col"
      style={{ height: '200px' }}
    >
      {/* Console header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">
          <Terminal className="w-3 h-3" />
          Console
          <span className="text-zinc-700 normal-case tracking-normal font-normal">
            · {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5"
      >
        {logs.length === 0 ? (
          <p className="text-zinc-700 italic">No logs yet...</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex gap-3 leading-[1.6]">
              <span className="text-zinc-700 shrink-0 select-none">{entry.timestamp}</span>
              <span className={`shrink-0 select-none font-medium ${LEVEL_STYLES[entry.level] ?? 'text-zinc-400'}`}>
                {LEVEL_PREFIX[entry.level] ?? '     '}
              </span>
              <span className={`${LEVEL_STYLES[entry.level] ?? 'text-zinc-400'} break-all`}>
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
