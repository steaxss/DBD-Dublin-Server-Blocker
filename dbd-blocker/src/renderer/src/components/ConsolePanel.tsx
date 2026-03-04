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
  info:    'INFO',
  success: 'OK  ',
  warning: 'WARN',
  error:   'ERR ',
  step:    ' › '
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
      className="shrink-0 border-t border-white/[0.05] bg-[#08080e] flex flex-col"
      style={{ height: '180px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-violet-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Console</span>
          <span className="text-[10px] text-zinc-700">· {logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Logs */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5"
      >
        {logs.length === 0 ? (
          <p className="text-zinc-700 italic pt-1">No logs yet...</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex gap-3 leading-[1.7]">
              <span className="text-zinc-700 shrink-0 select-none tabular-nums">{entry.timestamp}</span>
              <span className={`shrink-0 select-none font-bold w-8 ${LEVEL_STYLES[entry.level] ?? 'text-zinc-400'}`}>
                {LEVEL_PREFIX[entry.level] ?? '    '}
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
