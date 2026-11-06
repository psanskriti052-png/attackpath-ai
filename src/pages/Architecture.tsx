import {
  User,
  ShieldCheck,
  BrainCircuit,
  Radar,
  FileText,
  ArrowRight,
  Check,
  Clock,
  Server,
  Puzzle,
  Users,
} from 'lucide-react';
import { useScan } from '@/context/ScanContext';
import { AGENT_MODULES } from '@/services/mockAgent';
import { cn } from '@/lib/utils';

const STAGES = [
  { label: 'User / UI', icon: User, note: 'Target entry, chat, approval' },
  { label: 'Scope Guard', icon: ShieldCheck, note: 'Whitelist + written permission' },
  { label: 'AI Agent', icon: BrainCircuit, note: 'Plans tools and reasons over output' },
  { label: 'Scanners', icon: Radar, note: 'Nmap · Nikto · ZAP · OpenVAS' },
  { label: 'Report', icon: FileText, note: 'Findings, paths, roadmap' },
];

const FUTURE = [
  { title: 'Scheduled assessments', desc: 'Continuous re-checks on a cron cadence.', icon: Clock },
  { title: 'Fix verification (re-scan)', desc: 'Re-test only what was remediated and diff the result.', icon: Check },
  { title: 'Wider integrations', desc: 'Jira, Slack and SIEM hand-off for every finding.', icon: Puzzle },
  { title: 'Team dashboards', desc: 'Shared risk trends across many assets and owners.', icon: Users },
];

export default function Architecture() {
  const { activeModule } = useScan();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="eyebrow">How it works</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">Architecture</h1>
        <p className="mt-1 text-[12.5px] text-white/45">
          A thin UI over an AI agent that plans, correlates and reports — with a human in the loop.
        </p>
      </div>

      {/* Pipeline */}
      <div className="glass-card p-4 md:p-5">
        <h2 className="mb-3 text-[12.5px] font-semibold text-white">Request pipeline</h2>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {STAGES.map(({ label, icon: Icon, note }, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-cyan-400/30">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <span className="text-[12px] font-medium text-white">{label}</span>
                  <span className="ml-auto font-mono text-[9.5px] text-white/20">0{i + 1}</span>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-snug text-white/40">{note}</p>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-cyan-300/40 lg:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-[11px] text-emerald-100/80">
            The Approval Gate sits between the agent and the scanners — no active test without a human click.
          </span>
        </div>
      </div>

      {/* Agent modules */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[13.5px] font-semibold text-white">Agent modules</h2>
          <span className="font-mono text-[10px] text-white/30">
            {activeModule ? 'live highlight during a scan' : 'idle'}
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_MODULES.map((m, i) => {
            const isActive = activeModule === m.id;
            return (
              <div
                key={m.id}
                className={cn(
                  'rounded-2xl border p-3.5 transition-all duration-300',
                  isActive
                    ? 'animate-glow-pulse border-cyan-400/60 bg-cyan-400/[0.1]'
                    : 'border-white/10 bg-white/[0.03]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('font-mono text-[10px]', isActive ? 'text-orange-300' : 'text-white/30')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn('text-[12.5px] font-medium', isActive ? 'text-cyan-100' : 'text-white/85')}>
                    {m.name}
                  </span>
                  {isActive && (
                    <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-cyan-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                      active
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Future scope */}
      <div>
        <h2 className="mb-2 text-[13.5px] font-semibold text-white">Future scope</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {FUTURE.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3.5">
              <span className="absolute right-2 top-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-indigo-300">
                Coming soon
              </span>
              <Icon className="h-4 w-4 text-white/40" />
              <p className="mt-2 text-[12px] font-medium text-white/80">{title}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-white/35">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backend note */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-300/80" />
          <h2 className="text-[12.5px] font-semibold text-white">Planned backend</h2>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/45">
          This prototype runs entirely in the browser: <span className="font-mono text-cyan-200/80">services/mockAgent.ts</span>{' '}
          returns fixed results after artificial delays. The planned Python FastAPI service replaces it function-for-function —
          <span className="font-mono text-white/60"> POST /scans</span>,{' '}
          <span className="font-mono text-white/60">GET /scans/&#123;id&#125;/logs</span> (SSE),{' '}
          <span className="font-mono text-white/60">/findings</span>,{' '}
          <span className="font-mono text-white/60">/paths</span> and{' '}
          <span className="font-mono text-white/60">POST /agent/chat</span> — with results persisted in PostgreSQL.
        </p>
      </div>
    </div>
  );
}
