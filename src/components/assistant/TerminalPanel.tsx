import { useEffect, useRef } from 'react';
import { Terminal, Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOOL_ORDER } from '@/services/mockAgent';
import type { AgentLogLine, ToolRunStatus } from '@/services/mockAgent';

interface Props {
  logs: AgentLogLine[];
  toolStates: Record<string, { status: ToolRunStatus; progress: number }>;
  running: boolean;
}

const STATUS_LABEL: Record<ToolRunStatus, string> = {
  queued: 'queued',
  running: 'running',
  done: 'done',
};

export default function TerminalPanel({ logs, toolStates, running }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs.length]);

  return (
    <div className="animate-fade-up space-y-3">
      {/* Tool chips with progress */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TOOL_ORDER.map((tool) => {
          const state = toolStates[tool] ?? { status: 'queued' as ToolRunStatus, progress: 0 };
          return (
            <div
              key={tool}
              className={cn(
                'rounded-xl border px-2.5 py-2 transition-all duration-300',
                state.status === 'running' && 'border-cyan-400/45 bg-cyan-400/[0.08]',
                state.status === 'done' && 'border-emerald-400/30 bg-emerald-400/[0.06]',
                state.status === 'queued' && 'border-white/10 bg-white/[0.02]'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    state.status === 'running'
                      ? 'text-cyan-200'
                      : state.status === 'done'
                      ? 'text-emerald-200'
                      : 'text-white/40'
                  )}
                >
                  {tool}
                </span>
                {state.status === 'done' ? (
                  <Check className="h-3 w-3 text-emerald-300" />
                ) : state.status === 'running' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-300" />
                ) : (
                  <Circle className="h-2.5 w-2.5 text-white/20" />
                )}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    state.status === 'done' ? 'bg-emerald-400' : 'bg-cyan-400'
                  )}
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wider text-white/30">
                {STATUS_LABEL[state.status]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal log */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/35">
            <Terminal className="h-3 w-3" />
            agent activity stream
          </span>
          {running && (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-cyan-300/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              live
            </span>
          )}
        </div>

        <div className="max-h-56 min-h-[132px] overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-[1.75]">
          {logs.map((l, i) => (
            <div key={i} className="animate-fade-in whitespace-pre-wrap break-words">
              <span className="text-white/25">[{String(i + 1).padStart(2, '0')}]</span>{' '}
              <span
                className={cn(
                  'font-medium',
                  l.module === 'Correlator' && 'text-cyan-300',
                  l.module === 'Path Builder' && 'text-indigo-300',
                  l.module === 'Report Maker' && 'text-emerald-300',
                  l.module === 'Planner' && 'text-yellow-200/90',
                  !['Correlator', 'Path Builder', 'Report Maker', 'Planner'].includes(l.module) &&
                    'text-white/45'
                )}
              >
                [{l.module}]
              </span>{' '}
              <span className="text-cyan-100/80">{l.line}</span>
            </div>
          ))}
          {running && <span className="inline-block h-3 w-1.5 animate-blink bg-cyan-300 align-middle" />}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
