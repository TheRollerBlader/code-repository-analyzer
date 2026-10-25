import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { RepoNode } from '../types/repository';
import { formatBytes, getLanguageColor } from '../utils/colors';
import { ChevronRight, Home, ZoomIn, ZoomOut, Flame } from 'lucide-react';

interface FileTreemapProps {
  rootTree: RepoNode;
  onSelectNode: (node: RepoNode) => void;
}

interface TreemapDatum {
  name: string;
  path: string;
  size?: number;
  linesOfCode?: number;
  language?: string;
  type: 'blob' | 'tree';
  commits?: number;
  churnScore?: number;
  complexity?: number;
  authors?: { [key: string]: number };
  children?: TreemapDatum[];
  rawNode?: RepoNode;
}

export const FileTreemap: React.FC<FileTreemapProps> = ({ rootTree, onSelectNode }) => {
  // Current directory path for drill-down navigation
  const [currentPath, setCurrentPath] = useState<string>('');
  const [hoveredFile, setHoveredFile] = useState<TreemapDatum | null>(null);

  // Convert RepoNode to TreemapDatum
  const convertNode = (node: RepoNode): TreemapDatum => ({
    name: node.name,
    path: node.path,
    size: node.size || (node.children ? undefined : 1000),
    linesOfCode: node.linesOfCode,
    language: node.language || 'Other',
    type: node.type,
    commits: node.commits,
    churnScore: node.churnScore,
    complexity: node.complexity,
    authors: node.authors,
    rawNode: node,
    children: node.children ? node.children.map(convertNode) : undefined,
  });

  // Find the sub-node matching currentPath
  const activeSubtree = useMemo(() => {
    if (!currentPath) return convertNode(rootTree);

    const parts = currentPath.split('/');
    let current: RepoNode | undefined = rootTree;

    for (const part of parts) {
      if (!current || !current.children) break;
      current = current.children.find(c => c.name === part);
    }

    return current ? convertNode(current) : convertNode(rootTree);
  }, [rootTree, currentPath]);

  // Compute D3 Treemap layout
  const { treemapLeaves, totalVolume } = useMemo(() => {
    const width = 800;
    const height = 480;

    const root = d3
      .hierarchy<TreemapDatum>(activeSubtree)
      .sum(d => (d.children ? 0 : d.size || 500))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3
      .treemap<TreemapDatum>()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(3)
      .paddingTop(14)
      .round(true)
      .tile(d3.treemapSquarify.ratio(1));

    treemapLayout(root);

    const leaves = root.leaves() as d3.HierarchyRectangularNode<TreemapDatum>[];
    const total = root.value || 1;

    return { treemapLeaves: leaves, totalVolume: total };
  }, [activeSubtree]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [{ name: rootTree.name || 'root', path: '' }];
    const parts = currentPath.split('/');
    const crumbs = [{ name: rootTree.name || 'root', path: '' }];
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      crumbs.push({ name: part, path: acc });
    }
    return crumbs;
  }, [currentPath, rootTree.name]);

  const handleTileClick = (d: d3.HierarchyRectangularNode<TreemapDatum>) => {
    if (d.data.type === 'blob') {
      if (d.data.rawNode) {
        onSelectNode(d.data.rawNode);
      } else {
        onSelectNode({
          name: d.data.name,
          path: d.data.path,
          type: 'blob',
          size: d.value,
          language: d.data.language,
          commits: d.data.commits,
          churnScore: d.data.churnScore,
        });
      }
    } else {
      // Zoom into folder
      setCurrentPath(d.data.path);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Header and Drill-Down Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>File-Size Treemap</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
              Interactive Drill-Down
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tile area represents byte volume. Click folders to zoom inside, click files to inspect details.
          </p>
        </div>

        {/* Breadcrumb Path Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setCurrentPath('')}
            className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 flex-shrink-0 transition-colors"
            title="Root directory"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path || idx}>
              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              <button
                onClick={() => setCurrentPath(crumb.path)}
                className={`font-mono text-xs whitespace-nowrap transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* SVG Treemap Canvas */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800/60 p-1">
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {treemapLeaves.map((d, i) => {
            const width = Math.max(0, d.x1 - d.x0);
            const height = Math.max(0, d.y1 - d.y0);
            const isTiny = width < 28 || height < 18;
            const isMedium = width > 55 && height > 35;
            const langColor = getLanguageColor(d.data.language || 'Other');
            const pct = (((d.value || 0) / totalVolume) * 100).toFixed(1);

            return (
              <g
                key={d.data.path || i}
                transform={`translate(${d.x0},${d.y0})`}
                className="cursor-pointer group"
                onClick={() => handleTileClick(d)}
                onMouseEnter={() => setHoveredFile(d.data)}
                onMouseLeave={() => setHoveredFile(null)}
              >
                <rect
                  width={width}
                  height={height}
                  fill={langColor}
                  fillOpacity={0.82}
                  rx={2}
                  className="transition-all duration-150 group-hover:fill-opacity-100 group-hover:stroke-2 group-hover:stroke-white/80"
                  stroke="#090d16"
                  strokeWidth={1}
                />

                {/* Hotspot flame indicator if high churn */}
                {(d.data.churnScore || 0) > 85 && width > 24 && height > 24 && (
                  <circle
                    cx={width - 8}
                    cy={8}
                    r={3.5}
                    fill="#f43f5e"
                    className="animate-pulse"
                  />
                )}

                {!isTiny && (
                  <text
                    x={4}
                    y={13}
                    fill="#ffffff"
                    fontSize={width < 70 ? 9 : 11}
                    fontWeight={600}
                    fontFamily="monospace"
                    className="pointer-events-none select-none drop-shadow"
                    clipPath={`url(#clip-${i})`}
                  >
                    {d.data.name}
                  </text>
                )}

                {isMedium && (
                  <text
                    x={4}
                    y={26}
                    fill="rgba(255,255,255,0.7)"
                    fontSize={9}
                    fontFamily="sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {formatBytes(d.value || 0)} ({pct}%)
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredFile && (
          <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-lg p-3 shadow-2xl pointer-events-none max-w-sm z-20">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getLanguageColor(hoveredFile.language || 'Other') }}
              />
              <span className="font-mono text-xs font-bold text-white truncate">
                {hoveredFile.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700 ml-auto">
                {hoveredFile.language}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mb-2">
              {hoveredFile.path}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 border-t border-slate-800 pt-1.5">
              <div>
                <span className="text-slate-500 block">Size</span>
                <strong className="text-white font-mono">{formatBytes(hoveredFile.size || 0)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Est. LOC</span>
                <strong className="text-white font-mono">{hoveredFile.linesOfCode || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Churn Index</span>
                <strong className={`font-mono ${(hoveredFile.churnScore || 0) > 80 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {hoveredFile.churnScore || '-'} / 100
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          Red indicator signifies high code churn frequency (recent modification velocity)
        </span>
        <span className="text-slate-500 text-[11px]">
          {treemapLeaves.length} leaf files displayed in current viewport
        </span>
      </div>
    </div>
  );
};
