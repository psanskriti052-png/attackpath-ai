import { useState } from 'react';
import { Download, ShieldCheck, Layers, GitBranch, CalendarDays } from 'lucide-react';
import RiskGauge from '@/components/dashboard/RiskGauge';
import SeverityDonut from '@/components/dashboard/SeverityDonut';
import ToolBarChart from '@/components/dashboard/ToolBarChart';
import FindingsTable from '@/components/dashboard/FindingsTable';
import FindingDrawer from '@/components/dashboard/FindingDrawer';
import EmptyState from '@/components/EmptyState';
import { useScan } from '@/context/ScanContext';
import { downloadReport } from '@/lib/reportPdf';
import type { Finding } from '@/services/mockAgent';

export default function Dashboard() {
  const { scan } = useScan();
  const [selected, setSelected] = useState<Finding | null>(null);

  if (!scan) return <EmptyState message="No assessment loaded yet. Run the assistant once and results appear here." />;

  const stats = [
    { label: 'Findings', value: scan.findings.length, icon: ShieldCheck },
    { label: 'Attack paths', value: scan.paths.length, icon: GitBranch },
    { label: 'Tools used', value: new Set(scan.findings.map((f) => f.tool)).size, icon: Layers },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Assessment results</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
            Dashboard
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] font-normal text-emerald-300">
              {scan.status}
            </span>
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-white/40">
            <span className="text-cyan-200/80">{scan.target}</span>
            <span className="text-white/20">·</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {new Date(scan.date).toLocaleDateString()} {new Date(scan.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadReport(scan)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] px-4 py-2.5 text-[13px] font-medium text-cyan-100 transition-colors hover:bg-cyan-400/[0.16]"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-4 md:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-white">Overall risk score</h3>
              <p className="mt-0.5 text-[11px] text-white/40">Weighted across CVSS and exploitability</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/25">0 – 10</span>
          </div>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <RiskGauge score={scan.riskScore} grade={scan.grade} />
            <div className="w-full space-y-2 sm:w-auto sm:min-w-[140px]">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5">
                  <Icon className="h-3.5 w-3.5 text-cyan-300/70" />
                  <span className="text-[11px] text-white/45">{label}</span>
                  <span className="ml-auto font-mono text-[12px] text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-[13px] font-semibold text-white">Severity mix</h3>
          <p className="mb-1 text-[11px] text-white/40">By finding count</p>
          <SeverityDonut findings={scan.findings} />
        </div>

        <div className="glass-card p-4">
          <h3 className="text-[13px] font-semibold text-white">Findings by tool</h3>
          <p className="mb-1 text-[11px] text-white/40">What each scanner contributed</p>
          <ToolBarChart findings={scan.findings} />
        </div>
      </div>

      <FindingsTable findings={scan.findings} onSelect={setSelected} />
      <FindingDrawer finding={selected} onClose={() => setSelected(null)} />

      <p className="pb-2 text-center font-mono text-[10px] text-white/25">
        Simulated results · no traffic left this browser
      </p>
    </div>
  );
}
