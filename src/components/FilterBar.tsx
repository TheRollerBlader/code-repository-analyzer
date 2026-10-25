import React from 'react';
import { Search, PieChart, LayoutGrid, Network, Flame, Users, X } from 'lucide-react';

export type VisualTab = 'sunburst' | 'treemap' | 'dependencies' | 'churn' | 'busfactor';

interface FilterBarProps {
  activeTab: VisualTab;
  onTabChange: (tab: VisualTab) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedExt: string;
  onExtChange: (ext: string) => void;
  availableExts: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  selectedExt,
  onExtChange,
  availableExts,
}) => {
  const tabs = [
    { id: 'sunburst', label: 'Sunburst', icon: PieChart },
    { id: 'treemap', label: 'Treemap', icon: LayoutGrid },
    { id: 'dependencies', label: 'Dependencies', icon: Network },
    { id: 'churn', label: 'Churn Heatmap', icon: Flame },
    { id: 'busfactor', label: 'Bus Factor', icon: Users },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 shadow-lg">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as VisualTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Inputs */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter files / paths..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Extension Filter */}
        <select
          value={selectedExt}
          onChange={e => onExtChange(e.target.value)}
          className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="all">All Exts</option>
          {availableExts.map(ext => (
            <option key={ext} value={ext}>
              .{ext}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
