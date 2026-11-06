import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Play, ShieldAlert, Loader2 } from 'lucide-react';
import Stepper from '@/components/Stepper';
import ChatMessage from '@/components/assistant/ChatMessage';
import ScopeCard from '@/components/assistant/ScopeCard';
import ApprovalModal from '@/components/assistant/ApprovalModal';
import TerminalPanel from '@/components/assistant/TerminalPanel';
import type { AgentLogLine, ToolRunStatus } from '@/services/mockAgent';
import QuickReplies from '@/components/assistant/QuickReplies';
import SummaryActions from '@/components/assistant/SummaryActions';
import { useScan } from '@/context/ScanContext';
import type { FlowPhase } from '@/context/ScanContext';
import {
  ALLOWED_TARGETS,
  LOG_SCRIPT,
  TOOL_ORDER,
  askAgent,
  delay,
  startScan,
  validateScope,
} from '@/services/mockAgent';

const MODULE_MAP: Record<string, string> = {
  Planner: 'planner',
  Nmap: 'parser',
  Nikto: 'parser',
  ZAP: 'parser',
  OpenVAS: 'parser',
  Parser: 'parser',
  Correlator: 'correlator',
  'Path Builder': 'path',
  'Report Maker': 'report',
};

let msgId = 0;
const nextId = () => `m${Date.now()}_${(msgId += 1)}`;

export default function Assistant() {
  const { scan, setScan, step, setStep, setActiveModule, phase, setPhase, messages, setMessages } =
    useScan();
  const [input, setInput] = useState('');
  const [target, setTarget] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [logs, setLogs] = useState<AgentLogLine[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Resuming after navigating away mid-flow: never leave the chat in a dead state.
  useEffect(() => {
    if (phase === 'scanning') setPhase(scan ? 'done' : 'greet');
    else if (phase === 'approval') setApprovalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, logs.length, phase, thinking]);

  const pushAgent = (text: string, tone?: 'danger' | 'success') =>
    setMessages((prev) => [...prev, { id: nextId(), role: 'agent', text, tone }]);

  const pushUser = (text: string) =>
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);

  const toolStates = useMemo(() => {
    const last = logs[logs.length - 1];
    return TOOL_ORDER.reduce<Record<string, { status: ToolRunStatus; progress: number }>>((acc, tool) => {
      const mine = logs.filter((l) => l.tool === tool);
      if (!mine.length) acc[tool] = { status: 'queued', progress: 0 };
      else if (last?.tool === tool)
        acc[tool] = { status: 'running', progress: Math.min(88, 35 + mine.length * 26) };
      else acc[tool] = { status: 'done', progress: 100 };
      return acc;
    }, {});
  }, [logs]);

  /* ---------------------------------------------------------------- */
  /* Target intake + scope guard                                       */
  /* ---------------------------------------------------------------- */
  const submitTarget = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setInput('');
    pushUser(value);

    const verdict = validateScope(value);
    if (!verdict.allowed) {
      pushAgent(
        `Out of scope: target not authorized.\n\n"${value}" is not on the authorized lab whitelist, so I won't send a single packet to it. Authorized targets are: ${ALLOWED_TARGETS.join(', ')}.`,
        'danger'
      );
      setPhase('greet');
      return;
    }

    setTarget(verdict.target);
    setConfirmed(false);
    setPhase('scope');
    setStep(2);
    pushAgent(
      `Scope check passed — ${verdict.target} is on the authorized whitelist. Tick the authorization box below and I'll show you exactly what I intend to run before anything executes.`,
      'success'
    );
  };

  const verifyScope = () => {
    setStep(3);
    setActiveModule('gate');
    setApprovalOpen(true);
    setPhase('approval');
  };

  /* ---------------------------------------------------------------- */
  /* Active phase — simulated scan streaming                           */
  /* ---------------------------------------------------------------- */
  const runScan = async () => {
    setApprovalOpen(false);
    setPhase('scanning');
    setLogs([]);
    setStep(3);
    pushAgent(`Approved. Starting the passive assessment of ${target}. I'll narrate each module as it works.`);
    await delay(400);

    for (const entry of LOG_SCRIPT) {
      if (!alive.current) return;
      await delay(360);
      if (!alive.current) return;
      setLogs((prev) => [...prev, entry]);
      setActiveModule(MODULE_MAP[entry.module] ?? 'planner');
      if (entry.module === 'Path Builder') setStep(4);
    }

    const result = await startScan(target);
    if (!alive.current) return;
    setScan(result);
    setLogs(LOG_SCRIPT);
    setActiveModule(null);
    setStep(5);
    setPhase('done');

    const count = (s: string) => result.findings.filter((f) => f.severity === s).length;
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'agent',
        tone: 'success',
        withActions: true,
        text: `Scan complete. I found ${result.findings.length} findings — ${count('Critical')} critical, ${count('High')} high, ${count('Medium')} medium and ${count('Low')} low. Overall risk ${result.riskScore.toFixed(
          1
        )}/10, grade ${result.grade}.\n\nThe shortest route to your data is: Internet → SQL injection → MySQL on port 3306 → data exposure. Fixing the SQL injection alone collapses that whole chain. Everything below comes straight from the tool output — nothing inferred.`,
      },
    ]);
  };

  const deny = () => {
    setApprovalOpen(false);
    setActiveModule(null);
    setPhase('denied');
    pushAgent(
      'Understood — I stopped. No packets were sent and nothing was scanned. I can revise the plan (for example, passive header checks only), or you can come back when you have written authorization.',
      'danger'
    );
  };

  /* ---------------------------------------------------------------- */
  /* One-click demo walkthrough                                        */
  /* ---------------------------------------------------------------- */
  const runDemo = async () => {
    setScan(null);
    setLogs([]);
    setPhase('scope');
    setTarget('testphp.vulnweb.com');
    setConfirmed(true);
    setStep(2);
    setActiveModule(null);
    setThinking(true);
    setMessages([
      { id: nextId(), role: 'user', text: 'testphp.vulnweb.com' },
    ]);
    await delay(650);
    if (!alive.current) return;
    setThinking(false);
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'agent',
        text: 'Scope check passed — testphp.vulnweb.com is on the authorized whitelist. I have pre-filled the authorization confirmation for this walkthrough. Here is exactly what I intend to run.',
        tone: 'success',
      },
    ]);
    setStep(3);
    setActiveModule('gate');
    setPhase('approval');
    await delay(450);
    if (!alive.current) return;
    setApprovalOpen(true);
  };

  /* ---------------------------------------------------------------- */
  /* Chat questions grounded in the mock findings                      */
  /* ---------------------------------------------------------------- */
  const ask = async (question: string) => {
    if (!scan) return;
    pushUser(question);
    setThinking(true);
    const answer = await askAgent(question, scan);
    if (!alive.current) return;
    setThinking(false);
    pushAgent(answer);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'scanning' || thinking) return;
    if (phase === 'done' || phase === 'denied') {
      if (input.trim()) {
        const q = input.trim();
        setInput('');
        ask(q);
      }
      return;
    }
    submitTarget(input);
  };

  const inputDisabled = phase === 'scanning' || thinking || phase === 'approval';
  const placeholder =
    phase === 'done' || phase === 'denied'
      ? 'Ask me about these findings…'
      : 'Enter an authorized target, e.g. testphp.vulnweb.com';

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Assessment agent</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">Assistant</h1>
        </div>
        <button
          type="button"
          onClick={runDemo}
          disabled={phase === 'scanning'}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-[13px] font-semibold text-[#04222a] transition-all duration-200 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          <Play className="h-4 w-4" />
          Run demo scan
        </button>
      </div>

      <Stepper current={step} />

      {/* Chat surface */}
      <div className="glass-card flex h-[calc(100vh-19rem)] min-h-[520px] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m}>
              {m.role === 'agent' && scan && m.withActions && <SummaryActions scan={scan} />}
            </ChatMessage>
          ))}

          {phase === 'scope' && (
            <ScopeCard
              target={target}
              confirmed={confirmed}
              onConfirm={setConfirmed}
              onContinue={verifyScope}
            />
          )}

          {(phase === 'scanning' || logs.length > 0) && (
            <TerminalPanel logs={logs} toolStates={toolStates} running={phase === 'scanning'} />
          )}

          {thinking && (
            <div className="flex items-center gap-2 pl-9 text-[12px] text-cyan-300/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="font-mono">agent is thinking…</span>
            </div>
          )}

          {phase === 'done' && (
            <div className="pl-9">
              <QuickReplies onPick={ask} disabled={thinking} />
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="border-t border-white/[0.07] p-3 md:p-4">
          {phase === 'greet' && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-white/30">Authorized</span>
              {ALLOWED_TARGETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => submitTarget(t)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10.5px] text-white/60 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 focus-within:border-cyan-400/40">
            <ShieldAlert className="h-4 w-4 shrink-0 text-white/25" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={inputDisabled}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-[12.5px] text-white placeholder:text-white/30 focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={inputDisabled || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-[#04222a] transition-colors hover:bg-cyan-300 disabled:bg-white/10 disabled:text-white/30"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      <ApprovalModal open={approvalOpen} target={target} onApprove={runScan} onDeny={deny} />
    </div>
  );
}
