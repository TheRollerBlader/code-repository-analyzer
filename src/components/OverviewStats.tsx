import React from 'react';
import { Star, GitFork, FileCode, Users, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { RepositoryData } from '../types/repository';
import { formatBytes, formatNumber } from '../utils/colors';

interface OverviewStatsProps {
  data: RepositoryData;
  onHotspotsClick?: () => void;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ data, onHotspotsClick }) => {
  const { metadata, totalSize, totalFiles, totalLinesOfCode, overallBusFactor, churnHotspots, languages } = data;

  const topLanguage = Object.entries(languages).sort((a, b) => b[1].bytes - a[1].bytes)[0]?.[0] || metadata.language;

  const getBusFactorBadge = (bf: number) => {
    if (bf <= 1) {
      return {
        label: 'CRITICAL RISK',
        desc: 'Single developer controls >75% of core code',
        color: 'text-rose-400 bg-rose-950/60 border-rose-800',
        icon: AlertTriangle,
      };
    }
    if (bf === 2) {
      return {
        label: 'ELEVATED RISK',
        desc: '2 key contributors handle majority of subsystems',
        color: 'text-amber-400 bg-amber-950/60 border-amber-800',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'RESILIENT',
      desc: 'Healthy distributed knowledge base',
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
      icon: ShieldCheck,
    };
  };

  const busBadge = getBusFactorBadge(overallBusFactor);
  const BusIcon = busBadge.icon;

  return (
    <div className="space-y-4">
      {/* Top Banner with Repo Details */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{metadata.owner}</span>
                <span className="text-slate-500">/</span>
                <span className="text-cyan-400">{metadata.name}</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {metadata.defaultBranch}
              </span>
              {metadata.license && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                  {metadata.license}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {metadata.description}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-amber-300 text-sm font-semibold shadow-inner">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{formatNumber(metadata.stars)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-blue-300 text-sm font-semibold shadow-inner">
              <GitFork className="w-4 h-4" />
              <span>{formatNumber(metadata.forks)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Bus Factor */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Project Bus Factor
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${busBadge.color}`}>
              {busBadge.label}
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{overallBusFactor}</span>
            <span className="text-xs text-slate-400">min developers</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <BusIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{busBadge.desc}</span>
          </div>
        </div>

        {/* Card 2: Code Volume */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              Code Volume
            </span>
            <span className="text-xs text-cyan-400 font-mono font-medium">{topLanguage}</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{formatBytes(totalSize)}</span>
            <span className="text-xs text-slate-400">analyzed</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across <strong className="text-slate-200">{formatNumber(totalFiles)}</strong> files (~{formatNumber(totalLinesOfCode)} LOC)
          </div>
        </div>

        {/* Card 3: Churn Hotspots */}
        <div
          onClick={onHotspotsClick}
          className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-rose-900/50 hover:bg-slate-850 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500 group-hover:animate-pulse" />
              Technical Debt Hotspots
            </span>
            <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/60">
              High Risk
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 tracking-tight">{churnHotspots.length}</span>
            <span className="text-xs text-slate-400">high-churn files</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Top hotspot: <span className="text-slate-200 font-mono text-[10px]">{churnHotspots[0]?.name || 'N/A'}</span>
          </div>
        </div>

        {/* Card 4: Contributors */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Active Contributors
            </span>
            <span className="text-[10px] text-purple-300 font-semibold bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/60">
              Core Team
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{data.contributors.length}</span>
            <span className="text-xs text-slate-400">primary leads</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Top: <strong className="text-slate-200">{data.contributors[0]?.name || 'Unknown'}</strong> ({formatNumber(data.contributors[0]?.commits || 0)} commits)
          </div>
        </div>
      </div>
    </div>
  );
};
