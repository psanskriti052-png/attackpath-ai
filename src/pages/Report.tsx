import { Download, ShieldCheck, FileText } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useScan } from '@/context/ScanContext';
import { downloadReport } from '@/lib/reportPdf';
import { SEVERITY_BADGE } from '@/lib/severity';
import { cn } from '@/lib/utils';

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[10px] text-cyan-700">{n}</span>
        <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2 text-[12px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function Report() {
  const { scan } = useScan();
  if (!scan) return <EmptyState message="No assessment to report on yet. Run the assistant first." />;

  const ranked = [...scan.findings].sort((a, b) => b.cvss - a.cvss);
  const phases: { key: 'now' | 'soon' | 'monitor'; label: string; note: string }[] = [
    { key: 'now', label: 'Fix now', note: '0–7 days' },
    { key: 'soon', label: 'Fix soon', note: '7–30 days' },
    { key: 'monitor', label: 'Monitor', note: '30+ days' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Deliverable</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">Report</h1>
          <p className="mt-1 text-[12.5px] text-white/45">Everything the agent produced, ready to share.</p>
        </div>
        <button
          type="button"
          onClick={() => downloadReport(scan)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-[13px] font-semibold text-[#04222a] transition-colors hover:bg-cyan-300"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* Paper preview */}
      <div className="overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl ring-1 ring-white/10">
        <div className="bg-[#0B0B1E] px-6 py-6 text-white md:px-10">
          <div className="flex items-center gap-2 text-cyan-300">
            <ShieldCheck className="h-[18px] w-[18px]" />
            <span className="text-[13px] font-semibold tracking-tight">AttackPath AI</span>
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight md:text-[22px]">
            Authorized Security Assessment
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-cyan-100/70">
            <span>target: {scan.target}</span>
            <span>date: {new Date(scan.date).toLocaleDateString()}</span>
            <span>risk: {scan.riskScore.toFixed(1)}/10 · grade {scan.grade}</span>
          </div>
          <p className="mt-3 inline-flex rounded-md bg-cyan-400/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider text-cyan-200/80">
            simulated prototype — no real scanning performed
          </p>
        </div>

        <div className="space-y-7 px-6 py-7 md:px-10 md:py-9">
          <Section n="01" title="Executive summary">
            <p>
              This assessment combined port discovery, web configuration checks and an OWASP baseline scan
              against <span className="font-mono text-slate-800">{scan.target}</span>. The overall risk score is{' '}
              <strong className="text-slate-900">{scan.riskScore.toFixed(1)} / 10</strong> (grade {scan.grade}) across{' '}
              {scan.findings.length} findings.
            </p>
            <p>
              The highest-risk issue is <strong className="text-slate-900">{ranked[0].title}</strong> (CVSS{' '}
              {ranked[0].cvss}). Combined with an internet-reachable database port, it gives a direct route from the
              public internet to stored data. Two fixes — parameterizing the login query and restricting database
              network access — remove the primary attack path.
            </p>
          </Section>

          <Section n="02" title="Scope and authorization">
            <p>
              Target <span className="font-mono text-slate-800">{scan.target}</span> appears on the authorized lab
              whitelist. The operator confirmed ownership or written permission, and explicitly approved the exact
              command set before the active phase began. All activity is passive or configuration-level: no exploitation,
              no payloads, no data modification.
            </p>
          </Section>

          <Section n="03" title="Methodology and tools">
            <ul className="space-y-1.5">
              {scan.tools.map((t) => (
                <li key={t.name} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[11px] text-slate-900">{t.name}</span>
                  <span className="text-slate-500">{t.purpose}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section n="04" title="Findings, ranked by risk">
            <div className="space-y-2.5">
              {ranked.map((f, i) => (
                <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10.5px] text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[12.5px] font-medium text-slate-900">{f.title}</span>
                    <span className={cn('rounded border px-1.5 py-0.5 text-[9.5px] font-medium', SEVERITY_BADGE[f.severity])}>
                      {f.severity}
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-500">CVSS {f.cvss.toFixed(1)}</span>
                    <span className="ml-auto font-mono text-[10px] text-indigo-700">{f.attack.id}</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">{f.summary}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    <span className="font-medium text-slate-700">Fix: </span>
                    {f.fixSteps[0]}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    {f.component} · {f.tool} · {f.attack.name}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section n="05" title="Attack paths">
            <div className="space-y-2">
              {[...scan.paths].sort((a, b) => b.risk - a.risk).map((p, i) => (
                <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] text-slate-400">path {i + 1}</span>
                    <span className="font-mono text-[10.5px] text-orange-700">risk {p.risk}/10</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-slate-700">{p.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    <span className="font-medium text-emerald-700">Break the chain at: </span>
                    {p.breakAt} — {p.breakFix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section n="06" title="Remediation roadmap">
            <div className="grid gap-3 sm:grid-cols-3">
              {phases.map(({ key, label, note }) => {
                const items = scan.findings.filter((f) => f.phase === key);
                return (
                  <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11.5px] font-semibold text-slate-900">{label}</span>
                      <span className="font-mono text-[9.5px] text-slate-400">{note}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {items.map((f) => (
                        <li key={f.id} className="text-[10.5px] leading-snug text-slate-600">
                          • {f.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>

          <div className="flex items-center gap-2 border-t border-slate-200 pt-4 font-mono text-[9.5px] text-slate-400">
            <FileText className="h-3 w-3" />
            AttackPath AI · simulated demo output · not a substitute for a real penetration test
          </div>
        </div>
      </div>
    </div>
  );
}
