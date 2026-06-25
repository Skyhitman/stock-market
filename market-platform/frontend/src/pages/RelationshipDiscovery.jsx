import React, { useEffect, useState, useRef } from 'react';
import { Loader2, GitBranch, Grid3x3, Network } from 'lucide-react';
import { fetchLeaders, fetchCorrelationHeatmap, fetchNetworkGraph } from '../api/client';
import * as d3 from 'd3';

const SECTOR_COLORS = {
  Banking: '#f59e0b',
  Pharma: '#10b981',
  IT: '#3b82f6',
  Energy: '#ef4444',
};

export default function RelationshipDiscovery({ lastRefresh }) {
  const [tab, setTab] = useState('leadlag');
  const [leaders, setLeaders] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const heatmapRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    Promise.all([fetchLeaders(), fetchCorrelationHeatmap(), fetchNetworkGraph()])
      .then(([lData, hData, nData]) => {
        setLeaders(lData);
        setHeatmap(hData);
        setNetwork(nData);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  // Heatmap D3 rendering
  useEffect(() => {
    if (tab !== 'heatmap' || !heatmap || !heatmapRef.current) return;
    const container = heatmapRef.current;
    d3.select(container).selectAll('*').remove();

    let tickers = [];
    let matrix = [];
    
    if (Array.isArray(heatmap)) {
      // Backend returns flat array: [{ticker_a, ticker_b, pearson_corr}]
      const tSet = new Set();
      heatmap.forEach(item => {
        tSet.add(item.ticker_a);
        tSet.add(item.ticker_b);
      });
      tickers = Array.from(tSet).sort();
      
      const n = tickers.length;
      matrix = Array(n).fill(null).map(() => Array(n).fill(0));
      
      heatmap.forEach(item => {
        const i = tickers.indexOf(item.ticker_a);
        const j = tickers.indexOf(item.ticker_b);
        if (i !== -1 && j !== -1) {
          matrix[i][j] = item.pearson_corr || 0;
          matrix[j][i] = item.pearson_corr || 0;
        }
      });
      // Set diagonal to 1.0
      for(let i=0; i<n; i++) matrix[i][i] = 1.0;
    } else {
      tickers = heatmap.tickers || [];
      matrix = heatmap.matrix || [];
    }

    const n = tickers.length;
    if (n === 0) return;

    const cellSize = Math.min(36, 600 / n);
    const margin = { top: 80, right: 10, bottom: 10, left: 90 };
    const w = margin.left + n * cellSize + margin.right;
    const h = margin.top + n * cellSize + margin.bottom;

    const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
    const colorScale = d3.scaleLinear()
      .domain([-1, 0, 1])
      .range(['#be185d', '#1e293b', '#10b981']);

    // Labels top
    svg.selectAll('.col-label')
      .data(tickers).enter()
      .append('text')
      .attr('x', (d, i) => margin.left + i * cellSize + cellSize / 2)
      .attr('y', margin.top - 8)
      .attr('text-anchor', 'end')
      .attr('transform', (d, i) => `rotate(-45, ${margin.left + i * cellSize + cellSize / 2}, ${margin.top - 8})`)
      .attr('font-size', 9).attr('fill', '#94a3b8').attr('font-weight', 700)
      .text(d => d.replace('.NS', ''));

    // Labels left
    svg.selectAll('.row-label')
      .data(tickers).enter()
      .append('text')
      .attr('x', margin.left - 6)
      .attr('y', (d, i) => margin.top + i * cellSize + cellSize / 2 + 3)
      .attr('text-anchor', 'end')
      .attr('font-size', 9).attr('fill', '#94a3b8').attr('font-weight', 700)
      .text(d => d.replace('.NS', ''));

    // Cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = matrix[i]?.[j] ?? 0;
        svg.append('rect')
          .attr('x', margin.left + j * cellSize)
          .attr('y', margin.top + i * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('fill', colorScale(val))
          .attr('rx', 2)
          .append('title').text(`${tickers[i]} × ${tickers[j]}: ${val.toFixed(2)}`);

        if (i === j) {
          svg.append('text')
            .attr('x', margin.left + j * cellSize + cellSize / 2)
            .attr('y', margin.top + i * cellSize + cellSize / 2 + 3)
            .attr('text-anchor', 'middle')
            .attr('font-size', 8).attr('fill', '#94a3b8')
            .text('1.0');
        }
      }
    }
  }, [tab, heatmap]);

  // Network D3 rendering
  useEffect(() => {
    if (tab !== 'network' || !network || !networkRef.current) return;
    const container = networkRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 800;
    const height = 500;

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height);

    const nodes = (network.nodes || []).map(n => ({ ...n, id: n.ticker || n.id }));
    const links = (network.edges || network.links || []).map(l => ({
      source: l.source,
      target: l.target,
      value: l.correlation || l.value || 0.5
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const link = svg.append('g').selectAll('line')
      .data(links).enter().append('line')
      .attr('stroke', '#334155').attr('stroke-width', 1.5).attr('stroke-opacity', 0.6);

    // Arrow markers
    svg.append('defs').selectAll('marker')
      .data(['end']).enter().append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -5 10 10')
      .attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#475569');

    link.attr('marker-end', 'url(#arrow)');

    const node = svg.append('g').selectAll('g')
      .data(nodes).enter().append('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => Math.max(8, (d.score || 40) / 5))
      .attr('fill', d => SECTOR_COLORS[d.sector] || '#6366f1')
      .attr('stroke', '#0f172a').attr('stroke-width', 2);

    node.append('text')
      .attr('dx', 14).attr('dy', 4)
      .attr('font-size', 10).attr('fill', '#94a3b8').attr('font-weight', 600)
      .text(d => (d.id || '').replace('.NS', ''));

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [tab, network]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const tabs = [
    { key: 'leadlag', label: 'Pairs Lead/Lag', icon: GitBranch },
    { key: 'heatmap', label: 'Correlation Heatmap', icon: Grid3x3 },
    { key: 'network', label: 'Network Graph', icon: Network },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
            Relationship Discovery
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Examine lead-lag indicators, cross-asset correlations, and node graphs</p>
        </div>
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead/Lag Tab */}
      {tab === 'leadlag' && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <GitBranch size={18} className="text-blue-400" />
            Pairs Lead/Lag Indicators
          </h3>
          <p className="text-xs text-slate-500 mb-6">Statistically maps lead-lag dynamics. Moves in the leader stock often trigger a matching move in the follower stock after a lag period.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-700/50">
                <tr>
                  <th className="p-3">Leader (Moves First)</th>
                  <th className="p-3">Follower (Moves Later)</th>
                  <th className="p-3">Lag Correlation</th>
                  <th className="p-3 text-right">Influence Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {leaders.map((pair, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-white">
                      {(pair.leader || pair.ticker_a || '').replace('.NS', '')}
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 uppercase">Leader</span>
                    </td>
                    <td className="p-3 text-slate-300 flex items-center gap-2">
                      <span className="text-slate-600">→</span>
                      {(pair.follower || pair.ticker_b || '').replace('.NS', '')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                        {(Number(pair.lag_corr || pair.lag_correlation || 0)).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {Number(pair.strength || pair.influence || pair.leader_score || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {leaders.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-600">No lead/lag data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Grid3x3 size={18} className="text-blue-400" />
            Sector Correlation Heatmap
          </h3>
          <p className="text-xs text-slate-500 mb-4">Symmetric matrix of Pearson correlation coefficients. Vibrant green denotes high direct correlation; vibrant red denotes inverse correlation.</p>
          <div ref={heatmapRef} className="overflow-x-auto flex justify-center" />
        </div>
      )}

      {/* Network Tab */}
      {tab === 'network' && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Network size={18} className="text-blue-400" />
            Directed Correlation Networks
          </h3>
          <p className="text-xs text-slate-500 mb-4">Node size matches tactical Opportunity score. Lines denote Pearson correlation {'>'} 0.50. Directed arrows denote Leader → Follower influence lines. Drag nodes to reshape layout.</p>
          <div ref={networkRef} className="w-full" style={{ minHeight: 500 }} />
        </div>
      )}
    </div>
  );
}