import type { Severity } from '@/services/mockAgent';

export const SEVERITY_ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

export const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};


/** Tailwind badge styles — literal strings so the build keeps them. */
export const SEVERITY_BADGE: Record<Severity, string> = {
  Critical: 'bg-red-500/15 text-red-300 border-red-500/40',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  Medium: 'bg-yellow-400/15 text-yellow-200 border-yellow-400/40',
  Low: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
};

export const SEVERITY_HEX: Record<Severity, string> = {
  Critical: '#EF4444',
  High: '#FB923C',
  Medium: '#FACC15',
  Low: '#3B82F6',
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  Critical: 'text-red-400',
  High: 'text-orange-400',
  Medium: 'text-yellow-300',
  Low: 'text-blue-400',
};

export const NODE_HEX: Record<string, string> = {
  entry: '#22D3EE',
  impact: '#A78BFA',
  ...SEVERITY_HEX,
};

export function gradeFor(score: number) {
  if (score >= 9) return 'F';
  if (score >= 7.5) return 'D';
  if (score >= 6) return 'C';
  if (score >= 4) return 'B';
  if (score >= 2) return 'A';
  return 'A+';
}
