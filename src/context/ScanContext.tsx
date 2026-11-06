import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScanResult } from '@/services/mockAgent';
import { getSeedScan } from '@/services/mockAgent';

/** Where the assistant conversation currently sits. */
export type FlowPhase = 'greet' | 'scope' | 'approval' | 'scanning' | 'denied' | 'done';

export interface ChatMessageModel {
  id: string;
  role: 'agent' | 'user';
  text: string;
  tone?: 'danger' | 'success';
  /** Only the closing summary message carries the result action buttons. */
  withActions?: boolean;
}

interface ScanContextValue {
  scan: ScanResult | null;
  setScan: (scan: ScanResult | null) => void;
  step: number;
  setStep: (step: number) => void;
  activeModule: string | null;
  setActiveModule: (id: string | null) => void;
  phase: FlowPhase;
  setPhase: (phase: FlowPhase) => void;
  messages: ChatMessageModel[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageModel[]>>;
}

const ScanContext = createContext<ScanContextValue | null>(null);

/** Holds the simulated assessment across screens (assistant → dashboard → report). */
export function ScanProvider({ children }: { children: ReactNode }) {
  const [scan, setScan] = useState<ScanResult | null>(getSeedScan());
  const [step, setStep] = useState(1);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [phase, setPhase] = useState<FlowPhase>('greet');
  const [messages, setMessages] = useState<ChatMessageModel[]>([
    {
      id: 'greeting',
      role: 'agent',
      text: "Hi, I'm AttackPath AI. Enter an authorized website or server to assess.",
    },
  ]);

  return (
    <ScanContext.Provider
      value={{
        scan,
        setScan,
        step,
        setStep,
        activeModule,
        setActiveModule,
        phase,
        setPhase,
        messages,
        setMessages,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside ScanProvider');
  return ctx;
}
