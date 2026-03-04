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
  step:    'text-zinc-500'
}

const LEVEL_PREFIX: Record<string, string> = {
  info:    'INFO ',
  success: 'OK   ',
  warning: 'WARN ',
  error:   'ERR  ',
  step:    '›    '
}

export function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Auto-scroll only if user is near the bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const threshold = 60
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 flex flex-col" style={{ height: '220px' }}>
      {/* Console header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-medium">Console</span>
          <span className="text-zinc-700">·</span>
          <span>{logs.length} entrée{logs.length > 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5"
      >
        {logs.length === 0 ? (
          <p className="text-zinc-700 italic">Aucun log...</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex gap-3 leading-5">
              <span className="text-zinc-700 shrink-0 select-none">{entry.timestamp}</span>
              <span className={`shrink-0 select-none ${LEVEL_STYLES[entry.level] ?? 'text-zinc-400'}`}>
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
