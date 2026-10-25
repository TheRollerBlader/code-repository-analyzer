import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RepoNode } from '../types/repository';
import { formatBytes, getLanguageColor } from '../utils/colors';

interface LanguageSunburstProps {
  rootTree: RepoNode;
  onSelectNode: (node: RepoNode) => void;
  width?: number;
  height?: number;
}

interface HierarchySunburstDatum {
  name: string;
  path: string;
  size?: number;
  language?: string;
  type: 'blob' | 'tree';
  commits?: number;
  churnScore?: number;
  linesOfCode?: number;
  children?: HierarchySunburstDatum[];
  rawNode?: RepoNode;
}

export const LanguageSunburst: React.FC<LanguageSunburstProps> = ({
  rootTree,
  onSelectNode,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    path: string;
    size: number;
    language: string;
    percentage: number;
    depth: number;
    loc?: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !rootTree || !containerRef.current) return;

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 550;
    const size = Math.min(containerWidth, 550);
    const radius = size / 2;

    // Transform repo node to hierarchy data
    function transformToHierarchy(node: RepoNode): HierarchySunburstDatum {
      return {
        name: node.name,
        path: node.path,
        size: node.size || (node.children ? undefined : 1000),
        language: node.language || 'Other',
        type: node.type,
        commits: node.commits,
        churnScore: node.churnScore,
        linesOfCode: node.linesOfCode,
        rawNode: node,
        children: node.children ? node.children.map(transformToHierarchy) : undefined,
      };
    }

    const hierarchyData = transformToHierarchy(rootTree);

    // D3 Hierarchy
    const root = d3
      .hierarchy<HierarchySunburstDatum>(hierarchyData)
      .sum(d => (d.children ? 0 : d.size || 1000))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // D3 Partition (max depth 3 for clean radial aesthetics)
    const partition = d3.partition<HierarchySunburstDatum>().size([2 * Math.PI, radius]);
    partition(root);

    // Filter nodes to depth <= 4
    const nodes = root.descendants().filter(d => d.depth > 0 && d.depth <= 4);

    const totalVal = root.value || 1;

    // Arc generator
    const arc = d3
      .arc<d3.HierarchyRectangularNode<HierarchySunburstDatum>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => Math.max(d.y0, 50))
      .outerRadius(d => Math.max(d.y0, d.y1 - 1));

    const g = svg
      .attr('viewBox', `0 0 ${size} ${size}`)
      .append('g')
      .attr('transform', `translate(${radius},${radius})`);

    // Render Arcs
    const paths = g
      .selectAll<SVGPathElement, d3.HierarchyRectangularNode<HierarchySunburstDatum>>('path')
      .data(nodes)
      .join('path')
      .attr('d', arc as any)
      .attr('fill', d => {
        if (d.data.type === 'blob') {
          return getLanguageColor(d.data.language || 'Other');
        }
        // Directories: gradient based on depth
        const depthColors = ['#1e293b', '#334155', '#475569', '#64748b'];
        return depthColors[Math.min(d.depth, depthColors.length - 1)];
      })
      .attr('fill-opacity', d => (d.data.type === 'blob' ? 0.9 : 0.6))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', '1px')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 1)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', '2px');

        const val = d.value || 0;
        const pct = Number(((val / totalVal) * 100).toFixed(1));

        setHoveredNode({
          name: d.data.name,
          path: d.data.path || d.data.name,
          size: val,
          language: d.data.language || 'Directory',
          percentage: pct,
          depth: d.depth,
          loc: d.data.linesOfCode,
        });
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', d.data.type === 'blob' ? 0.9 : 0.6)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', '1px');
      })
      .on('click', (event, d) => {
        if (d.data.rawNode) {
          onSelectNode(d.data.rawNode);
        } else {
          onSelectNode({
            name: d.data.name,
            path: d.data.path,
            type: d.data.type,
            size: d.value,
            language: d.data.language,
          });
        }
      });

    // Center circular badge
    g.append('circle')
      .attr('r', 48)
      .attr('fill', '#090d16')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2);

    // Initial state
    setHoveredNode({
      name: rootTree.name,
      path: rootTree.path || rootTree.name,
      size: totalVal,
      language: 'All Files',
      percentage: 100,
      depth: 0,
      loc: rootTree.linesOfCode,
    });
  }, [rootTree, onSelectNode]);

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Language & Hierarchy Sunburst</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Multi-Level Radial
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Radial partition showing folder depths and language proportions. Hover to inspect, click to drill.
          </p>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full flex items-center justify-center py-4 min-h-[380px]">
        <svg ref={svgRef} className="w-full max-w-[460px] h-auto drop-shadow-2xl" />

        {/* Center Hover Overlay */}
        {hoveredNode && (
          <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center max-w-[120px]">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
              {hoveredNode.language}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-full px-1">
              {hoveredNode.name}
            </span>
            <span className="text-[11px] text-slate-300 font-mono mt-0.5">
              {hoveredNode.percentage}%
            </span>
            <span className="text-[10px] text-slate-400">
              {formatBytes(hoveredNode.size)}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      {hoveredNode && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate pr-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getLanguageColor(hoveredNode.language) }}
            />
            <span className="font-mono text-slate-200 truncate">{hoveredNode.path}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] flex-shrink-0">
            <span className="text-cyan-400 font-bold">{hoveredNode.percentage}% share</span>
            <span className="text-slate-400">{formatBytes(hoveredNode.size)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
