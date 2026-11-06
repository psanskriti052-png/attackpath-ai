import { Sparkles } from 'lucide-react';

const REPLIES = ['Explain the top risk simply', 'What should I fix first?', 'Show attack path'];

export default function QuickReplies({ onPick, disabled }: { onPick: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/30">
        <Sparkles className="h-3 w-3" />
        Ask
      </span>
      {REPLIES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onPick(r)}
          className="rounded-full border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-1.5 text-[11.5px] text-cyan-100/90 transition-all duration-200 hover:border-cyan-300/60 hover:bg-cyan-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {r}
        </button>
      ))}
    </div>
  );
}
