import React from 'react';
import { Contributor, DirectoryBusFactor } from '../types/repository';
import { formatNumber } from '../utils/colors';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ContributorBusFactorProps {
  contributors: Contributor[];
  directoryBusFactors: DirectoryBusFactor[];
  overallBusFactor: number;
}

export const ContributorBusFactor: React.FC<ContributorBusFactorProps> = ({
  contributors,
  directoryBusFactors,
  overallBusFactor,
}) => {
  // Chart data for top contributors
  const chartData = contributors.slice(0, 8).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 10) + '...' : c.name,
    fullName: c.name,
    commits: c.commits,
    additions: Math.round(c.additions / 100), // in hundreds for readability
    deletions: Math.round(c.deletions / 100),
  }));

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/70 border-rose-800';
      case 'warning':
        return 'text-amber-400 bg-amber-950/70 border-amber-800';
      default:
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Contributor Distribution & Directory Bus Factor</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
            Resilience & Knowledge Silos
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Directory-level knowledge concentration calculated via Herfindahl-Hirschman Index ($HHI$) and Shannon Information Entropy ($H$).
        </p>
      </div>

      {/* Contributor Activity Recharts Bar Chart */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Top Contributor Commit & Code Volume
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Additions/Deletions scaled in ×100 lines
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="font-bold text-white mb-1">{d.fullName}</p>
                        <div className="text-cyan-400">Commits: <strong>{formatNumber(d.commits)}</strong></div>
                        <div className="text-emerald-400">Additions: <strong>+{formatNumber(d.additions * 100)} LOC</strong></div>
                        <div className="text-rose-400">Deletions: <strong>-{formatNumber(d.deletions * 100)} LOC</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={val => <span className="text-slate-300">{val}</span>}
              />
              <Bar dataKey="commits" name="Commits" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="additions" name="Additions (×100)" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deletions" name="Deletions (×100)" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Directory-Level Bus Factor Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Directory-Level Knowledge Silo Assessment
          </h3>
          <span className="text-xs text-slate-400">
            Overall Bus Factor: <strong className="text-white font-mono">{overallBusFactor}</strong>
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Directory / Subsystem</th>
                  <th className="py-2.5 px-3 text-center">Bus Factor</th>
                  <th className="py-2.5 px-3">Risk Status</th>
                  <th className="py-2.5 px-3">Primary Owner (% commits)</th>
                  <th className="py-2.5 px-3">Shannon Entropy ($H$)</th>
                  <th className="py-2.5 px-3">HHI Concentration</th>
                  <th className="py-2.5 px-3">Mitigation Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {directoryBusFactors.map(dir => (
                  <tr key={dir.path} className="hover:bg-slate-850/70 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-200">
                      <code>{dir.path}</code>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-base text-white">
                      {dir.busFactor}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(dir.riskLevel)}`}>
                        {dir.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-slate-100 font-semibold">{dir.primaryOwner}</span>{' '}
                      <span className="text-slate-400">({dir.primaryOwnerPercentage}%)</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                      {dir.shannonEntropy}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={dir.hhiScore > 3500 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        {dir.hhiScore}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-[11px]">
                      {dir.riskLevel === 'critical' ? (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Pair Program Immediately
                        </span>
                      ) : dir.riskLevel === 'warning' ? (
                        <span className="text-amber-400 font-medium">
                          Cross-train Secondary
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Redundancy Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Algorithmic Formula Callout */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Mathematical Bus Factor Model</p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The directory bus factor represents the minimal number of engineers whose sudden departure leaves more than 75% of the codebase without institutional memory. It combines the <strong>Herfindahl-Hirschman Index</strong> <code className="text-cyan-300">HHI = &Sigma; (s_i &times; 100)&sup2;</code> with <strong>Shannon Information Entropy</strong> <code className="text-cyan-300">H = -&Sigma; p_i log&sub2;(p_i)</code> to normalize commit dispersion.
          </p>
        </div>
      </div>
    </div>
  );
};
