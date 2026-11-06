import { ShieldCheck, ShieldX, Terminal, AlertTriangle } from 'lucide-react';
import { SCAN_PLAN } from '@/services/mockAgent';

interface Props {
  open: boolean;
  target: string;
  onApprove: () => void;
  onDeny: () => void;
}

/** APPROVAL GATE — nothing active runs until a human clicks Approve. */
export default function ApprovalModal({ open, target, onApprove, onDeny }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-cyan-400/25 bg-[#0E0E28]/95 p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-400/35 bg-orange-400/10">
            <AlertTriangle className="h-4 w-4 text-orange-300" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white">Approve active test?</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">
              I will run exactly these commands against{' '}
              <span className="font-mono text-cyan-200">{target}</span>. Nothing else.
            </p>
          </div>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {SCAN_PLAN.map((tool, i) => (
            <div key={tool.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[11px] text-orange-300">{i + 1}.</span>
                <span className="text-[12.5px] font-medium text-white">{tool.name}</span>
                <span className="ml-auto text-[11px] text-white/40">{tool.purpose}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1.5">
                <Terminal className="h-3 w-3 shrink-0 text-cyan-400/70" />
                <code className="truncate font-mono text-[11px] text-cyan-200/90">{tool.cmd}</code>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/35">
          Passive and configuration checks only. No exploitation, no payloads, no data modification.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDeny}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:border-red-400/40 hover:text-red-200"
          >
            <ShieldX className="h-4 w-4" />
            Deny
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-[13px] font-semibold text-[#04231a] transition-all duration-200 hover:bg-emerald-300"
          >
            <ShieldCheck className="h-4 w-4" />
            Approve &amp; run
          </button>
        </div>
      </div>
    </div>
  );
}
