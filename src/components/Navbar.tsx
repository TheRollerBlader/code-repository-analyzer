import React, { useState } from 'react';
import { Search, Download, Key, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { parseRepoString } from '../services/githubApi';

interface NavbarProps {
  currentRepo: string;
  onSearch: (repo: string) => void;
  onSelectPreset: (repo: string) => void;
  onExport: () => void;
  isLoading: boolean;
  isCached?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRepo,
  onSearch,
  onSelectPreset,
  onExport,
  isLoading,
  isCached,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('gh_pat') || '' : ''));

  const presets = [
    { label: 'React', repo: 'facebook/react' },
    { label: 'Express', repo: 'expressjs/express' },
    { label: 'Vue 3', repo: 'vuejs/core' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const parsed = parseRepoString(inputVal);
    if (parsed) {
      onSearch(`${parsed.owner}/${parsed.repo}`);
    } else {
      onSearch(inputVal.trim());
    }
  };

  const saveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('gh_pat', tokenInput.trim());
    } else {
      localStorage.removeItem('gh_pat');
    }
    setShowTokenModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-white">CodebaseRadar</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Repository Architecture & Knowledge Intelligence</p>
            </div>
          </div>

          {/* Repo Input Search Form */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter GitHub repo (e.g. facebook/react)..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 focus:border-cyan-500 rounded-lg pl-10 pr-24 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Analyze
              </button>
            </div>
          </form>

          {/* Presets and Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Samples:
              </span>
              {presets.map(p => (
                <button
                  key={p.repo}
                  onClick={() => onSelectPreset(p.repo)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    currentRepo.toLowerCase() === p.repo.toLowerCase()
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Token setting button */}
            <button
              onClick={() => setShowTokenModal(true)}
              title="Configure GitHub Token"
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Export button */}
            <button
              onClick={onExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export Report
            </button>

            {/* GitHub Link */}
            <a
              href={`https://github.com/${currentRepo}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
              title="Open on GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {isCached && (
          <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-1 text-center">
            <span className="text-[11px] text-amber-300 font-medium">
              ⚡ Rendering verified cached dataset with full structural AST and commit analytics.
            </span>
          </div>
        )}
      </header>

      {/* GitHub Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">GitHub Personal Access Token</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Unauthenticated GitHub requests are capped at 60 requests/hour. Supplying a read-only token elevates limits to 5,000 requests/hour for live deep analysis. Token is stored securely in your browser's <code className="text-cyan-300 font-mono">localStorage</code>.
            </p>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveToken}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Save Token
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
