import os

frontend_dir = r'C:\Users\Saurav Karunakaran\OneDrive\Desktop\stock\market-platform\frontend\src'

components = {
    'components/StockBackgroundCanvas.jsx': '''import React from 'react';
export default function StockBackgroundCanvas() { return <div className="fixed inset-0 z-0 bg-slate-900"></div>; }
''',
    'pages/Overview.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchMarketSummary } from '../api/client';
export default function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchMarketSummary().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Market Overview</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/SectorIntelligence.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchSectorRankings } from '../api/client';
export default function SectorIntelligence() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchSectorRankings().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Sector Intelligence</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/MarketScreener.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchScreener } from '../api/client';
export default function MarketScreener() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchScreener().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Market Screener</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/RelationshipDiscovery.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchLeaders } from '../api/client';
export default function RelationshipDiscovery() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchLeaders().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Relationship Discovery</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/TopMovers.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchMarketMovers } from '../api/client';
export default function TopMovers() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchMarketMovers().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Top Movers</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/PredictionEngine.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchPredictions } from '../api/client';
export default function PredictionEngine() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchPredictions().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Prediction Engine</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/OpportunityEngine.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchOpportunityRankings } from '../api/client';
export default function OpportunityEngine() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchOpportunityRankings().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Opportunity Engine</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/PortfolioTracker.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchPortfolio } from '../api/client';
export default function PortfolioTracker() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchPortfolio().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Portfolio Tracker</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}''',
    'pages/Backtesting.jsx': '''import React, { useState, useEffect } from 'react';
import { fetchBacktest } from '../api/client';
export default function Backtesting() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchBacktest().then(setData).catch(console.error); }, []);
  return <div className="p-6 glass-panel"><h1 className="text-2xl font-bold mb-4">Backtesting</h1>
    {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
  </div>;
}'''
}

for path, content in components.items():
    full_path = os.path.join(frontend_dir, path.replace('/', os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Successfully created placeholder components.')
