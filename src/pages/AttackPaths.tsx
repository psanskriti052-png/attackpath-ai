import { useMemo, useState } from 'react';
import { Scissors, Crosshair, ArrowRight, Info } from 'lucide-react';
import AttackGraph from '@/components/attack/AttackGraph';
import EmptyState from '@/components/EmptyState';
import { useScan } from '@/context/ScanContext';
import { SEVERITY_BADGE, SEVERITY_TEXT } from '@/lib/severity';
import { cn } from '@/lib/utils';
import type { AttackPathLink, AttackPathNode } from '@/services/mockAgent';

/** Enumerate every entry → impact chain through the directed link list. */
function buildChains(nodes: AttackPathNode[], links: AttackPathLink[]): string[][] {
  const adj = new Map<string, string[]>();
  links.forEach((l) => adj.set(l.from, [...(adj.get(l.from) ?? []), l.to]));
  const ends = new Set(nodes.filter((n) => n.severity === 'impact').map((n) => n.id));
  const chains: string[][] = [];
  const walk = (id: string, path: string[]) => {
    if (ends.has(id)) {
      chains.push(path);
      return;
    }
    (adj.get(id) ?? []).forEach((next) => {
      if (!path.includes(next)) walk(next, [...path, next]);
    });
  };
  nodes.filter((n) => n.severity === 'entry').forEach((n) => walk(n.id, [n.id]));
  return chains;
}

export default function AttackPaths() {
  const { scan } = useScan();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);

  const chains = useMemo(() => (scan ? buildChains(scan.nodes, scan.links) : []), [scan]);

  if (!scan) return <EmptyState message="No assessment loaded yet. Run the assistant once and the path graph appears here." />;

  const nodeLabel = (id: string) => scan.nodes.find((n) => n.id === id)?.label ?? id;
  const idForLabel = (label: string) => scan.nodes.find((n) => n.label === label)?.id;

  const highlighted = useMemo(() => {
    if (activePath) {
      const p = scan.paths.find((x) => x.id === activePath);
      if (p) return p.steps.map((s) => idForLabel(s)).filter(Boolean) as string[];
      return [];
    }
    if (selectedNode) {
      const union = new Set<string>();
      chains.filter((c) => c.includes(selectedNode)).forEach((c) => c.forEach((id) => union.add(id)));
      return [...union];
    }
    return [];
  }, [activePath, selectedNode, chains, scan.paths]);

  const selected = selectedNode ? scan.nodes.find((n) => n.id === selectedNode) : null;
  const selectedFinding = selected?.findingId ? scan.findings.find((f) => f.id === selected.findingId) : null;
  const topPath = [...scan.paths].sort((a, b) => b.risk - a.risk)[0];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <p className="eyebrow">Correlation</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">Attack Paths</h1>
        <p className="mt-1 text-[12.5px] text-white/45">
          How individual findings chain together from the public internet to your data.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Graph */}
        <div className="glass-card p-3 md:p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-white/45">
              <Crosshair className="h-3.5 w-3.5 text-cyan-300/70" />
              {selected ? `Path through “${selected.label}”` : 'Click any node to trace its path'}
            </span>
            {(selectedNode || activePath) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  setActivePath(null);
                }}
                className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-white/45 hover:text-white"
              >
                clear
              </button>
            )}
          </div>
          <AttackGraph
            nodes={scan.nodes}
            links={scan.links}
            highlighted={highlighted}
            onSelectNode={(id) => {
              setActivePath(null);
              setSelectedNode(id);
            }}
          />

          {selected && (
            <div className="mt-3 animate-fade-up rounded-xl border border-cyan-400/25 bg-cyan-400/[0.05] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] font-medium text-white">{selected.label}</span>
                <span className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/50">
                  {selected.severity}
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-cyan-200/70">
                  {chains.filter((c) => c.includes(selected.id)).length} chain(s) pass through here
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/60">{selected.detail}</p>
              {selectedFinding && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2">
                  <span className={cn('rounded border px-1.5 py-0.5 text-[10px]', SEVERITY_BADGE[selectedFinding.severity])}>
                    {selectedFinding.severity}
                  </span>
                  <span className="text-[11.5px] text-white/75">{selectedFinding.title}</span>
                  <span className={cn('font-mono text-[10.5px]', SEVERITY_TEXT[selectedFinding.severity])}>
                    CVSS {selectedFinding.cvss.toFixed(1)}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-indigo-300/80">{selectedFinding.attack.id}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ranked paths + break-the-chain */}
        <div className="space-y-3">
          <div className="glass-card p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12.5px] font-semibold text-white">Ranked paths</h3>
              <span className="font-mono text-[10px] text-white/30">{scan.paths.length} chains</span>
            </div>
            <div className="space-y-2">
              {[...scan.paths]
                .sort((a, b) => b.risk - a.risk)
                .map((p, i) => {
                  const isActive = activePath === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedNode(null);
                        setActivePath(isActive ? null : p.id);
                      }}
                      className={cn(
                        'w-full rounded-xl border p-2.5 text-left transition-all duration-200',
                        isActive
                          ? 'border-cyan-400/50 bg-cyan-400/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-orange-300">#{i + 1}</span>
                        <span className="font-mono text-[11px] text-white/80">risk {p.risk}</span>
                        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wider text-white/25">
                          {p.steps.length} steps
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-white/55">{p.name}</p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"
                          style={{ width: `${p.risk * 10}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Break the chain here
              </span>
            </div>
            <p className="text-[12.5px] font-medium leading-snug text-emerald-50">{topPath.breakAt}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-emerald-100/70">{topPath.breakFix}</p>
            <div className="mt-2.5 flex items-center gap-1.5 border-t border-emerald-400/20 pt-2 font-mono text-[10px] text-emerald-300/70">
              <Info className="h-3 w-3" />
              One fix removes {Math.round(topPath.risk * 8)}% of the modelled risk
            </div>
          </div>

          <div className="glass-card p-3.5">
            <h3 className="mb-1.5 text-[12.5px] font-semibold text-white">Chain detail</h3>
            <div className="flex flex-wrap items-center gap-1">
              {(activePath ? scan.paths.find((p) => p.id === activePath)!.steps : topPath.steps).map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-white/65">
                    {nodeLabel(idForLabel(s) ?? '') || s}
                  </span>
                  {i < (activePath ? scan.paths.find((p) => p.id === activePath)!.steps : topPath.steps).length - 1 && (
                    <ArrowRight className="h-3 w-3 text-cyan-300/50" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
