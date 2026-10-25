import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RepositoryData, RepoNode } from './types/repository';
import { fetchRepositoryData } from './services/githubApi';
import { createReactSample, SAMPLE_REPOS } from './data/sampleRepositories';
import { Navbar } from './components/Navbar';
import { OverviewStats } from './components/OverviewStats';
import { FilterBar, VisualTab } from './components/FilterBar';
import { LanguageSunburst } from './components/LanguageSunburst';
import { FileTreemap } from './components/FileTreemap';
import { DependencyGraph } from './components/DependencyGraph';
import { ChurnHeatmap } from './components/ChurnHeatmap';
import { ContributorBusFactor } from './components/ContributorBusFactor';
import { FileDetailDrawer } from './components/FileDetailDrawer';
import { ExportModal } from './components/ExportModal';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export function App() {
  const [currentRepo, setCurrentRepo] = useState<string>('facebook/react');
  const [data, setData] = useState<RepositoryData>(() => createReactSample());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VisualTab>('sunburst');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedExt, setSelectedExt] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<RepoNode | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Load repo handler
  const loadRepository = useCallback(async (repoSlug: string, forceSample = false) => {
    setIsLoading(true);
    setErrorMsg(null);

    const parts = repoSlug.split('/');
    if (parts.length !== 2) {
      setErrorMsg('Invalid repository format. Please specify as "owner/repo" (e.g. facebook/react).');
      setIsLoading(false);
      return;
    }

    const [owner, repo] = parts;
    const result = await fetchRepositoryData(owner, repo, { forceSample });

    setData(result.data);
    setCurrentRepo(result.data.metadata.fullName);
    setIsLoading(false);

    if (result.error && !result.isFallback) {
      setErrorMsg(result.error);
    }
  }, []);

  // Filtered files for search & extension
  const filteredFiles = useMemo(() => {
    let list = data.flatFiles;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
    }
    if (selectedExt !== 'all') {
      list = list.filter(f => f.extension?.toLowerCase() === selectedExt.toLowerCase());
    }
    return list;
  }, [data.flatFiles, searchTerm, selectedExt]);

  // Available extensions in current repo
  const availableExts = useMemo(() => {
    const set = new Set<string>();
    data.flatFiles.forEach(f => {
      if (f.extension) set.add(f.extension.toLowerCase());
    });
    return Array.from(set).sort();
  }, [data.flatFiles]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentRepo={currentRepo}
        onSearch={repo => loadRepository(repo)}
        onSelectPreset={repo => loadRepository(repo, true)}
        onExport={() => setShowExportModal(true)}
        isLoading={isLoading}
        isCached={data.isCached}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-4 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-white font-mono text-xs px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Overview Stats Top Bar */}
        <OverviewStats
          data={data}
          onHotspotsClick={() => setActiveTab('churn')}
        />

        {/* Filter & View Switcher Bar */}
        <FilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedExt={selectedExt}
          onExtChange={setSelectedExt}
          availableExts={availableExts}
        />

        {/* Main Visuals Viewport */}
        {isLoading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[460px] gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm font-semibold text-white">Analyzing Repository AST & Git Metrics...</p>
            <p className="text-xs text-slate-400">Parsing recursive trees, commit churn, and dependency graph.</p>
          </div>
        ) : (
          <div className="transition-opacity duration-200">
            {activeTab === 'sunburst' && (
              <LanguageSunburst
                rootTree={data.rootTree}
                onSelectNode={setSelectedNode}
              />
            )}

            {activeTab === 'treemap' && (
              <FileTreemap
                rootTree={data.rootTree}
                onSelectNode={setSelectedNode}
              />
            )}

            {activeTab === 'dependencies' && (
              <DependencyGraph
                nodes={data.dependencies.nodes}
                links={data.dependencies.links}
                onSelectNode={setSelectedNode}
              />
            )}

            {activeTab === 'churn' && (
              <ChurnHeatmap
                files={filteredFiles}
                onSelectNode={setSelectedNode}
              />
            )}

            {activeTab === 'busfactor' && (
              <ContributorBusFactor
                contributors={data.contributors}
                directoryBusFactors={data.directoryBusFactors}
                overallBusFactor={data.overallBusFactor}
              />
            )}
          </div>
        )}
      </main>

      {/* Slide-Over File Detail Drawer */}
      <FileDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        repoFullName={data.metadata.fullName}
      />

      {/* Export Report Modal */}
      {showExportModal && (
        <ExportModal
          data={data}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CodebaseRadar — Advanced Code Repository Architecture & Resilience Engine</span>
          <span className="font-mono text-slate-400 text-[11px]">Powered by React · D3.js · TypeScript · Recharts</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
