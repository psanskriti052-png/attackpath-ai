import { jsPDF } from 'jspdf';
import type { ScanResult } from '@/services/mockAgent';

/**
 * Client-side PDF export of the simulated assessment.
 * Maps to a future GET /api/scans/{id}/report.pdf on the FastAPI backend.
 */
export function downloadReport(scan: ScanResult) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(40);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += 6;
    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(1.4);
    doc.line(margin, y, margin + 34, y);
    y += 14;
  };

  const body = (text: string, size = 9.5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    lines.forEach((line) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 12.5;
    });
    y += 4;
  };

  // ---- Cover / header
  doc.setFillColor(11, 11, 30);
  doc.rect(0, 0, pageWidth, 128, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AttackPath AI', margin, 52);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Security Assessment Report', margin, 74);
  doc.setTextColor(186, 230, 253);
  doc.setFontSize(9);
  doc.text(`Target: ${scan.target}`, margin, 94);
  doc.text(`Date: ${new Date(scan.date).toLocaleString()}`, margin, 108);
  doc.text('SIMULATED PROTOTYPE — no real scanning was performed', pageWidth - margin, 108, { align: 'right' });

  y = 158;

  // ---- Summary block
  heading('Overview');
  body(
    `Overall risk score: ${scan.riskScore.toFixed(1)} / 10 (grade ${scan.grade}). ` +
      `Findings: ${scan.findings.length} across ${new Set(scan.findings.map((f) => f.tool)).size} tools. ` +
      `Attack paths identified: ${scan.paths.length}. Human approval was recorded before any active test.`
  );

  heading('1. Executive summary');
  body(
    `This assessment combined port discovery, web configuration checks and an OWASP baseline scan against ${scan.target}. ` +
      `The highest-risk issue is "${scan.findings[0].title}" (CVSS ${scan.findings[0].cvss}), which combined with an internet-reachable database port gives a direct route from the public internet to stored data. ` +
      `Two fixes — parameterizing the login query and restricting database network access — remove the primary path.`
  );

  heading('2. Scope and authorization');
  body(
    `Target: ${scan.target}. Listed on the authorized lab whitelist. The operator confirmed ownership or written permission, ` +
      `and explicitly approved the exact command set before the active phase. Passive and configuration checks only; no exploitation payloads were used.`
  );

  heading('3. Methodology and tools');
  scan.tools.forEach((t) => body(`• ${t.name} — ${t.purpose}`, 9.5));

  heading('4. Findings (ranked by risk)');
  [...scan.findings]
    .sort((a, b) => b.cvss - a.cvss)
    .forEach((f, i) => {
      ensureSpace(70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${f.title}`, margin, y);
      y += 13;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${f.severity} · CVSS ${f.cvss} · ${f.component} · ${f.tool} · MITRE ${f.attack.id}`,
        margin,
        y
      );
      y += 12;
      body(f.summary, 9);
      body(`Fix: ${f.fixSteps[0]}`, 9);
    });

  heading('5. Attack paths');
  scan.paths.forEach((p, i) => {
    body(`${i + 1}. ${p.name} — risk ${p.risk}/10`, 9.5);
    body(`   Break the chain at: ${p.breakAt}. ${p.breakFix}`, 9);
  });

  heading('6. Remediation roadmap');
  const phases: { key: 'now' | 'soon' | 'monitor'; label: string }[] = [
    { key: 'now', label: 'Fix now (0–7 days)' },
    { key: 'soon', label: 'Fix soon (7–30 days)' },
    { key: 'monitor', label: 'Monitor (30+ days)' },
  ];
  phases.forEach(({ key, label }) => {
    const items = scan.findings.filter((f) => f.phase === key);
    if (!items.length) return;
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(label, margin, y);
    y += 13;
    items.forEach((f) => body(`• ${f.title} — ${f.fixSteps[0]}`, 9));
  });

  // ---- Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('AttackPath AI · simulated demo output · not a substitute for a real penetration test', margin, pageHeight - 24);
    doc.text(`${p} / ${pages}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
  }

  doc.save(`attackpath-report-${scan.target.replace(/[^a-z0-9.-]/gi, '_')}.pdf`);
}
