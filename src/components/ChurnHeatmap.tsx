import React, { useState, useMemo } from 'react';
import { RepoNode } from '../types/repository';
import { formatBytes, getLanguageColor } from '../utils/colors';
import { Flame, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ZAxis, Cell } from 'recharts';

interface ChurnHeatmapProps {
  files: RepoNode[];
  onSelectNode: (node: RepoNode) => void;
}

export const ChurnHeatmap: React.FC<ChurnHeatmapProps> = ({ files, onSelectNode }) => {
  const [filterLang, setFilterLang] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'churn' | 'loc' | 'commits'>('churn');

  // Extract distinct languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.language) set.add(f.language);
    });
    return ['all', ...Array.from(set)];
  }, [files]);

  // Filter & sort files
  const processedFiles = useMemo(() => {
    let list = files.filter(f => f.type === 'blob');
    if (filterLang !== 'all') {
      list = list.filter(f => f.language === filterLang);
    }

    list.sort((a, b) => {
      if (sortBy === 'churn') return (b.churnScore || 0) - (a.churnScore || 0);
      if (sortBy === 'loc') return (b.linesOfCode || 0) - (a.linesOfCode || 0);
      return (b.commits || 0) - (a.commits || 0);
    });

    return list;
  }, [files, filterLang, sortBy]);

  // Scatter data for Churn vs LOC Quadrant
  const scatterData = useMemo(() => {
    return processedFiles.slice(0, 45).map(f => ({
      name: f.name,
      path: f.path,
      loc: f.linesOfCode || Math.round((f.size || 1000) / 35),
      churn: f.churnScore || 50,
      commits: f.commits || 1,
      size: f.size || 1000,
      language: f.language || 'Other',
      raw: f,
    }));
  }, [processedFiles]);

  const maxChurn = Math.max(...processedFiles.map(f => f.churnScore || 0), 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Code Churn & Hotspot Heatmap</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
              Technical Debt Quadrant
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Files in the top-right quadrant (High Churn + High Complexity) represent primary technical debt and bug risk hotspots.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={filterLang}
              onChange={e => setFilterLang(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-mono"
            >
              {languages.map(l => (
                <option key={l} value={l} className="bg-slate-900 text-slate-200">
                  {l === 'all' ? 'All Languages' : l}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-mono"
            >
              <option value="churn" className="bg-slate-900 text-slate-200">Sort by Churn</option>
              <option value="loc" className="bg-slate-900 text-slate-200">Sort by LOC</option>
              <option value="commits" className="bg-slate-900 text-slate-200">Sort by Commits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Churn vs LOC Risk Scatter Plot */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            Hotspot Matrix: Churn Index vs Lines of Code
          </span>
          <span className="text-[11px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 font-mono">
            Top-Right = Refactoring Priority
          </span>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <XAxis
                type="number"
                dataKey="loc"
                name="Lines of Code"
                unit=" LOC"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="churn"
                name="Churn Index"
                unit="/100"
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <ZAxis type="number" dataKey="size" range={[60, 400]} name="File Size" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="font-bold text-white mb-1">{d.name}</p>
                        <p className="text-slate-400 truncate max-w-xs">{d.path}</p>
                        <div className="mt-1 text-slate-300">
                          <div>Churn Index: <strong className="text-rose-400">{d.churn} / 100</strong></div>
                          <div>Lines of Code: <strong>{d.loc}</strong></div>
                          <div>Commits: <strong>{d.commits}</strong></div>
                          <div>Language: <span style={{ color: getLanguageColor(d.language) }}>{d.language}</span></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Files"
                data={scatterData}
                onClick={(entry: any) => entry?.raw && onSelectNode(entry.raw)}
                className="cursor-pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.churn > 85 ? '#f43f5e' : entry.churn > 65 ? '#fb923c' : '#38bdf8'}
                    fillOpacity={0.85}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap Ranking Table */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">File Path</th>
                <th className="py-2 px-3">Language</th>
                <th className="py-2 px-3">Size</th>
                <th className="py-2 px-3">Est. LOC</th>
                <th className="py-2 px-3">Commits</th>
                <th className="py-2 px-3">Churn Velocity</th>
                <th className="py-2 px-3">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {processedFiles.slice(0, 15).map(file => {
                const churn = file.churnScore || 0;
                const isCritical = churn >= 90;
                const isWarning = churn >= 75 && churn < 90;

                return (
                  <tr
                    key={file.path}
                    onClick={() => onSelectNode(file)}
                    className="hover:bg-slate-850/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-2 px-3 font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-2 truncate max-w-xs">
                      {isCritical && <Flame className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                      <span className="truncate">{file.path}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: getLanguageColor(file.language || 'Other') }}
                      />
                      {file.language}
                    </td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{formatBytes(file.size || 0)}</td>
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{file.linesOfCode || '-'}</td>
                    <td className="py-2 px-3 text-slate-200 font-bold whitespace-nowrap">{file.commits || 1}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {/* Churn mini heat bar */}
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, (churn / maxChurn) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-6 text-right">{churn}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {isCritical ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          Critical Debt
                        </span>
                      ) : isWarning ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                          Elevated
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
