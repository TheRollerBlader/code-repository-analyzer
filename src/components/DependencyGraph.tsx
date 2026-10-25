import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { DependencyGraphNode, DependencyLink, RepoNode } from '../types/repository';
import { getLanguageColor } from '../utils/colors';
import { RotateCcw, Filter, Network, Info } from 'lucide-react';

interface DependencyGraphProps {
  nodes: DependencyGraphNode[];
  links: DependencyLink[];
  onSelectNode: (node: RepoNode) => void;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  path: string;
  group: string;
  size: number;
  language: string;
  inDegree: number;
  outDegree: number;
  churnScore: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: string;
  strength?: number;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes,
  links,
  onSelectNode,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);

  // Extract distinct module groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach(n => set.add(n.group));
    return ['all', ...Array.from(set)];
  }, [nodes]);

  // Filtered nodes and links based on group
  const filteredData = useMemo(() => {
    if (selectedGroup === 'all') return { nodes, links };
    const filteredNodes = nodes.filter(n => n.group === selectedGroup);
    const validIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(
      l =>
        validIds.has(typeof l.source === 'string' ? l.source : (l.source as any).id) &&
        validIds.has(typeof l.target === 'string' ? l.target : (l.target as any).id)
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, selectedGroup]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 700;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Setup zoom container
    const g = svg.append('g').attr('class', 'graph-container');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Deep copy data for simulation
    const simNodes: SimNode[] = filteredData.nodes.map(d => ({ ...d }));
    const simLinks: SimLink[] = filteredData.links.map(d => ({
      source: d.source,
      target: d.target,
      type: d.type,
      strength: d.strength,
    }));

    // Build neighbor set for ego-network hover
    const linkedByIndex: { [key: string]: boolean } = {};
    simLinks.forEach(d => {
      const s = typeof d.source === 'string' ? d.source : (d.source as any).id;
      const t = typeof d.target === 'string' ? d.target : (d.target as any).id;
      linkedByIndex[`${s},${t}`] = true;
      linkedByIndex[`${t},${s}`] = true;
    });

    const isConnected = (a: SimNode, b: SimNode) => {
      return a.id === b.id || linkedByIndex[`${a.id},${b.id}`];
    };

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id(d => d.id)
          .distance(70)
      )
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius(d => 18));

    // Arrow markers for directed graph
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    // Render links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => (d.strength ? d.strength * 2 : 1.5))
      .attr('marker-end', 'url(#arrow)');

    // Render nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node circles (radius proportional to in-degree centrality)
    node
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(22, 7 + d.inDegree * 1.5)))
      .attr('fill', d => getLanguageColor(d.language))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-150');

    // Churn ring highlight if high churn
    node
      .filter(d => d.churnScore > 80)
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(22, 7 + d.inDegree * 1.5)) + 3)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 2')
      .attr('opacity', 0.85);

    // Node labels
    node
      .append('text')
      .text(d => d.name)
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8')
      .attr('class', 'pointer-events-none select-none drop-shadow');

    // Hover ego-network interactivity
    node
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);

        // Highlight incident links
        link
          .attr('stroke', l => {
            const s = (l.source as SimNode).id;
            const t = (l.target as SimNode).id;
            return s === d.id || t === d.id ? '#38bdf8' : '#1e293b';
          })
          .attr('stroke-opacity', l => {
            const s = (l.source as SimNode).id;
            const t = (l.target as SimNode).id;
            return s === d.id || t === d.id ? 1 : 0.15;
          })
          .attr('stroke-width', l => {
            const s = (l.source as SimNode).id;
            const t = (l.target as SimNode).id;
            return s === d.id || t === d.id ? 2.5 : 1;
          });

        // Fade non-neighbors
        node.style('opacity', o => (isConnected(d, o) ? 1 : 0.2));
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        link
          .attr('stroke', '#334155')
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', d => (d.strength ? d.strength * 2 : 1.5));
        node.style('opacity', 1);
      })
      .on('click', (event, d) => {
        onSelectNode({
          name: d.name,
          path: d.path,
          type: 'blob',
          size: d.size,
          language: d.language,
          churnScore: d.churnScore,
        });
      });

    // Tick updates
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimNode).x!)
        .attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!)
        .attr('y2', d => (d.target as SimNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, onSelectNode]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Dependency Network Architecture</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Force-Directed Simulation
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal imports and coupling relationships. Node size corresponds to in-degree centrality.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-mono"
            >
              {groups.map(g => (
                <option key={g} value={g} className="bg-slate-900 text-slate-200">
                  {g === 'all' ? 'All Modules' : `group: ${g}`}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            title="Reset Pan & Zoom"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Force Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] min-h-[400px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80"
      >
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Hover Inspector Card */}
        {hoveredNode && (
          <div className="absolute top-3 right-3 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-lg p-3 shadow-xl max-w-xs pointer-events-none text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getLanguageColor(hoveredNode.language) }}
              />
              <span className="font-mono font-bold text-white truncate">{hoveredNode.name}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mb-2">
              {hoveredNode.path}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800 pt-2 text-slate-300">
              <div>
                <span className="text-slate-500 block">In-Degree Centrality</span>
                <span className="text-cyan-400 font-mono font-semibold">{hoveredNode.inDegree} dependents</span>
              </div>
              <div>
                <span className="text-slate-500 block">Out-Degree</span>
                <span className="text-blue-400 font-mono font-semibold">{hoveredNode.outDegree} imports</span>
              </div>
              <div>
                <span className="text-slate-500 block">Churn Risk</span>
                <span className={`font-mono ${hoveredNode.churnScore > 80 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {hoveredNode.churnScore} / 100
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Module Group</span>
                <span className="text-slate-200 font-mono">{hoveredNode.group}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          Hover node to isolate ego-network. Drag nodes to explore cluster dynamics.
        </span>
        <span className="text-slate-500 text-[11px]">
          {filteredData.nodes.length} nodes · {filteredData.links.length} directed links
        </span>
      </div>
    </div>
  );
};
