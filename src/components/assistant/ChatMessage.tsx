import type { ReactNode } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessageModel } from '@/context/ScanContext';

export default function ChatMessage({ message, children }: { message: ChatMessageModel; children?: ReactNode }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex animate-fade-up justify-end gap-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-indigo-400/25 bg-indigo-500/15 px-4 py-2.5">
          <p className="font-mono text-[13px] leading-relaxed text-indigo-100">{message.text}</p>
        </div>
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
          <User className="h-3.5 w-3.5 text-white/60" />
        </div>
      </div>
    );
  }

  const danger = message.tone === 'danger';
  const success = message.tone === 'success';

  return (
    <div className="flex animate-fade-up gap-2.5">
      <div
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
          danger
            ? 'border-red-400/40 bg-red-500/10'
            : success
            ? 'border-emerald-400/40 bg-emerald-500/10'
            : 'border-cyan-400/30 bg-cyan-400/10'
        )}
      >
        <ShieldCheck
          className={cn(
            'h-3.5 w-3.5',
            danger ? 'text-red-300' : success ? 'text-emerald-300' : 'text-cyan-300'
          )}
        />
      </div>
      <div className="min-w-0 max-w-[88%] space-y-3">
        <div
          className={cn(
            'rounded-2xl rounded-tl-md border px-4 py-3',
            danger
              ? 'border-red-400/30 bg-red-500/[0.08]'
              : success
              ? 'border-emerald-400/25 bg-emerald-500/[0.07]'
              : 'border-white/10 bg-white/[0.05]'
          )}
        >
          <p
            className={cn(
              'whitespace-pre-line text-[13.5px] leading-relaxed',
              danger ? 'text-red-100' : success ? 'text-emerald-50' : 'text-cyan-50/90'
            )}
          >
            {message.text}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
