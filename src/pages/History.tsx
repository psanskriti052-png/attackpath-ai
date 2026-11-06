import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Database, ChevronRight } from 'lucide-react';
import { useScan } from '@/context/ScanContext';
import { getHistory, getScanById } from '@/services/mockAgent';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  Completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Blocked: 'border-red-400/30 bg-red-400/10 text-red-300',
  Stopped: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
};

export default function History() {
  const navigate = useNavigate();
  const { setScan } = useScan();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const rows = getHistory();

  const open = async (id: string) => {
    setLoadingId(id);
    const result = await getScanById(id);
    setScan(result);
    setLoadingId(null);
    navigate('/dashboard');
  };

  const dateOf = (iso: string) =>
    `${new Date(iso).toLocaleDateString()} · ${new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <p className="eyebrow">Stored assessments</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">History</h1>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-[11.5px] text-white/40">
          <Database className="h-3 w-3" />
          simulated PostgreSQL · scans table · {rows.length} rows
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-[12px]">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Target</th>
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Risk score</th>
                <th className="px-3 py-2.5 text-left font-medium">Findings</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => open(r.id)}
                  className="group cursor-pointer border-t border-white/[0.05] transition-colors hover:bg-cyan-400/[0.05]"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11.5px] text-cyan-100/85">{r.target}</span>
                      <span className="font-mono text-[9.5px] text-white/20">{r.id}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-white/45">{dateOf(r.date)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono text-[12px]',
                          r.riskScore >= 8 ? 'text-red-400' : r.riskScore >= 6 ? 'text-orange-400' : r.riskScore > 0 ? 'text-yellow-300' : 'text-white/30'
                        )}
                      >
                        {r.riskScore ? r.riskScore.toFixed(1) : '—'}
                      </span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500"
                          style={{ width: `${r.riskScore * 10}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-white/60">{r.findings}</td>
                  <td className="px-3 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px]', STATUS_STYLE[r.status])}>
                      {loadingId === r.id && <Loader2 className="h-3 w-3 animate-spin" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="pr-3">
                    <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-cyan-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-white/[0.05] md:hidden">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => open(r.id)}
              className="flex w-full items-center gap-3 p-3.5 text-left active:bg-white/[0.04]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-cyan-100/85">{r.target}</p>
                <p className="mt-1 text-[10.5px] text-white/40">{dateOf(r.date)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn('rounded border px-1.5 py-0.5 text-[9.5px]', STATUS_STYLE[r.status])}>{r.status}</span>
                  <span className="font-mono text-[10px] text-white/40">{r.findings} findings</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[15px] text-white/80">{r.riskScore ? r.riskScore.toFixed(1) : '—'}</div>
                <div className="text-[9px] uppercase tracking-wider text-white/25">risk</div>
              </div>
              {loadingId === r.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/20" />
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center font-mono text-[10px] text-white/25">
        Click any row to reload that assessment into the dashboard
      </p>
    </div>
  );
}
