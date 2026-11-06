import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Download } from 'lucide-react';
import type { ScanResult } from '@/services/mockAgent';
import { downloadReport } from '@/lib/reportPdf';

/** Result actions rendered inside the agent's summary bubble. */
export default function SummaryActions({ scan }: { scan: ScanResult }) {
  const navigate = useNavigate();

  const items = [
    { label: 'View Dashboard', icon: LayoutDashboard, run: () => navigate('/dashboard') },
    { label: 'View Attack Paths', icon: GitBranch, run: () => navigate('/attack-paths') },
    { label: 'Download Report', icon: Download, run: () => downloadReport(scan) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ label, icon: Icon, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-2 text-[12px] font-medium text-cyan-100 transition-all duration-200 hover:border-cyan-300/60 hover:bg-cyan-400/[0.16]"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
