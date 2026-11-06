import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

interface Props {
  target: string;
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
  onContinue: () => void;
}

/** SCOPE GUARD — the human must confirm ownership before anything else happens. */
export default function ScopeCard({ target, confirmed, onConfirm, onContinue }: Props) {
  return (
    <div className="animate-fade-up rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.05] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-cyan-300" />
        <span className="eyebrow">Scope guard</span>
      </div>

      <p className="mb-3 text-[13px] leading-relaxed text-white/70">
        <span className="font-mono text-cyan-200">{target}</span> is on the authorized lab whitelist.
        Confirm your authority before I touch it.
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-cyan-400/30">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cyan-400"
        />
        <span className="text-[12.5px] leading-relaxed text-white/80">
          I confirm I own or have written permission to test this target
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed}
        onClick={onContinue}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-[13px] font-semibold text-[#06222a] transition-all duration-200 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
      >
        <ShieldCheck className="h-4 w-4" />
        Verify scope &amp; continue
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
