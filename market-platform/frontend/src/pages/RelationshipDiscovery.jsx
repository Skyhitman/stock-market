import React, { useEffect, useState, useRef } from 'react';
import { GitBranch, Grid3x3, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { useMarketData } from '../context/MarketDataContext';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

const SECTOR_COLORS = { Banking: '#f59e0b', Pharma: '#10b981', IT: '#00f0ff', Energy: '#ef4444' };

export default function RelationshipDiscovery() {
  const { leaders, heatmap, networkGraph: network, loading } = useMarketData();
  const [tab, setTab] = useState('leadlag');
  const [heatmapEl, setHeatmapEl] = useState(null);
  const [networkEl, setNetworkEl] = useState(null);

  useEffect(() => {
    if (tab === 'heatmap' && heatmap && heatmapEl) {
      heatmapEl.innerHTML = '';
      const data = heatmap;
      const margin = {top: 60, right: 50, bottom: 30, left: 90},
            width = 600 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
      
      const svg = d3.select(heatmapEl).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Get unique list of tickers
      const tickersSet = new Set();
      data.forEach(d => { 
        if (d && d.ticker_a) tickersSet.add(d.ticker_a); 
        if (d && d.ticker_b) tickersSet.add(d.ticker_b); 
      });
      const tickers = Array.from(tickersSet);
      
      // Build lookup map for O(1) symmetric lookup
      const corrMap = {};
      data.forEach(d => {
        const key1 = `${d.ticker_a}:${d.ticker_b}`;
        const key2 = `${d.ticker_b}:${d.ticker_a}`;
        corrMap[key1] = d.pearson_corr;
        corrMap[key2] = d.pearson_corr;
      });
      
      // Generate complete symmetric grid data including self-correlation diagonal
      const gridData = [];
      tickers.forEach(t1 => {
        tickers.forEach(t2 => {
          let corr = 0.0;
          if (t1 === t2) {
            corr = 1.0; // Self-correlation is always 1.0
          } else {
            const key = `${t1}:${t2}`;
            corr = corrMap[key] !== undefined ? corrMap[key] : 0.0;
          }
          gridData.push({
            ticker_a: t1,
            ticker_b: t2,
            pearson_corr: corr
          });
        });
      });
      
      const cleanTickers = tickers.map(t => t.replace('.NS', ''));
      const x = d3.scaleBand().range([ 0, width ]).domain(cleanTickers).padding(0.05);
      const y = d3.scaleBand().range([ height, 0 ]).domain(cleanTickers).padding(0.05);
      
      // Top Axis with custom 5-letter formatting, rotated 45 degrees
      svg.append("g")
        .attr("class", "x-axis")
        .call(d3.axisTop(x).tickSize(0).tickFormat(d => d.substring(0, 5)))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "start")
        .attr("dx", "8px")
        .attr("dy", "-5px");
        
      svg.select(".x-axis .domain").remove();
        
      // Y Axis on the left
      svg.append("g")
        .style("font-size", 10)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();
      
      // Diverging color scale: Red (negative correlation) -> Dark (no correlation) -> Green (positive correlation)
      const myColor = d3.scaleLinear().range(["#ef4444", "#0f172a", "#10b981"]).domain([-1, 0, 1]);
      
      // Draw grid cells
      svg.selectAll("rect")
        .data(gridData)
        .join("rect")
        .attr("x", d => x(d.ticker_a.replace('.NS', '')))
        .attr("y", d => y(d.ticker_b.replace('.NS', '')))
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => myColor(d.pearson_corr))
        .style("stroke-width", 2)
        .style("stroke", "#1e293b")
        .style("opacity", 0.85)
        .on("mouseover", function() { 
          d3.select(this).style("stroke", "#00f0ff").style("opacity", 1); 
        })
        .on("mouseleave", function() { 
          d3.select(this).style("stroke", "#1e293b").style("opacity", 0.85); 
        });
        
      // Add correlation values ONLY inside diagonal cells (self-correlation) showing '1.0'
      svg.selectAll(".corr-text")
        .data(gridData.filter(d => d.ticker_a === d.ticker_b))
        .join("text")
        .attr("class", "corr-text")
        .attr("x", d => x(d.ticker_a.replace('.NS', '')) + x.bandwidth() / 2)
        .attr("y", d => y(d.ticker_b.replace('.NS', '')) + y.bandwidth() / 2 + 3)
        .attr("text-anchor", "middle")
        .text("1.0")
        .style("fill", "#ffffff")
        .style("font-size", "9px")
        .style("font-family", "monospace")
        .style("font-weight", "bold")
        .style("pointer-events", "none");
        
      svg.selectAll(".domain").remove();
      svg.selectAll("text").style("fill", "#94a3b8").style("font-family", "monospace");
    }
  }, [tab, heatmap, heatmapEl]);

  useEffect(() => {
    if (tab === 'network' && network && networkEl) {
      networkEl.innerHTML = '';
      const width = 800, height = 600;
      const svg = d3.select(networkEl).append("svg")
        .attr("width", width).attr("height", height);
      
      const mainGroup = svg.append("g");
      
      // Copy nodes and links to prevent D3 from mutating React state
      const nodes = network.nodes.map(d => ({ ...d }));
      const links = network.links.map(d => ({ ...d }));
      
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));
      
      const link = mainGroup.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", d => Math.abs(d.value) * 3)
        .attr("stroke", d => d.value > 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)");
      
      const node = mainGroup.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        );
      
      node.append("circle")
        .attr("r", 12)
        .attr("fill", d => SECTOR_COLORS[d.sector] || "#3b82f6")
        .style("filter", "drop-shadow(0 0 8px rgba(0,240,255,0.4))");
      
      node.append("text")
        .text(d => d.id.replace('.NS', ''))
        .attr('x', 15)
        .attr('y', 4)
        .style("fill", "#e2e8f0")
        .style("font-family", "monospace")
        .style("font-size", "11px")
        .style("pointer-events", "none");
      
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
        node
          .attr("transform", d => `translate(${d.x},${d.y})`);
      });
      
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      return () => {
        simulation.stop();
      };
    }
  }, [tab, network, networkEl]);

  if (loading) return <HoloLoader />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-blue)', boxShadow: '0 0 10px var(--neon-blue)' }} />
          Neural Net Connect
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Discover hidden correlations and leader-lagger relationships</p>
      </motion.div>

      <div className="flex gap-4 border-b border-slate-800/50 pb-2">
        {[ { id: 'leadlag', icon: GitBranch, label: 'Leader/Lagger' }, { id: 'heatmap', icon: Grid3x3, label: 'Correlation Heatmap' }, { id: 'network', icon: Network, label: 'Network Graph' } ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors relative ${tab === t.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <t.icon size={16} /> {t.label}
            {tab === t.id && <motion.div layoutId="relTabLine" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-cyan-500" style={{ boxShadow: '0 0 8px rgba(0,240,255,0.5)' }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {tab === 'leadlag' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaders.map((rel, i) => (
                <GlassCard key={i} delay={i * 0.1} glow="cyan">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800/50">
                    <div className="text-center">
                      <div className="text-xs text-cyan-500/60 uppercase tracking-widest font-bold mb-1">Leader</div>
                      <div className="text-xl font-bold text-white font-mono">{rel.leader.replace('.NS', '')}</div>
                    </div>
                    <GitBranch className="text-cyan-500/30 rotate-90 md:rotate-0" size={24} />
                    <div className="text-center">
                      <div className="text-xs text-purple-500/60 uppercase tracking-widest font-bold mb-1">Follower</div>
                      <div className="text-xl font-bold text-white font-mono">{rel.follower.replace('.NS', '')}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Correlation</span>
                      <span className="text-emerald-400 font-bold font-mono">{(rel.lag_corr).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Strength</span>
                      <span className="text-cyan-400 font-bold font-mono">{rel.strength}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
          {tab === 'heatmap' && (
            <GlassCard hover={false} glow="cyan" className="flex items-center justify-center p-8">
              <div ref={setHeatmapEl} className="overflow-x-auto" />
            </GlassCard>
          )}
          {tab === 'network' && (
            <GlassCard hover={false} glow="purple" className="flex items-center justify-center p-8">
              <div ref={setNetworkEl} className="overflow-x-auto" />
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}