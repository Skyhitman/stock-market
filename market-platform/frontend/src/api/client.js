// API Client for interacting with the backend
// Uses VITE_API_URL env var in production, falls back to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchAPI(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return await res.json();
}

// Market Overview
export const fetchMarketSummary = () => fetchAPI('/market/summary');
export const fetchMarketMovers = () => fetchAPI('/market/movers');

// Sectors
export const fetchSectorRankings = () => fetchAPI('/sector/rankings');
export const fetchSectorHistory = (days = 30) => fetchAPI(`/sector/history?days=${days}`);

// Opportunities & Screener
export const fetchOpportunityRankings = () => fetchAPI('/opportunity/rankings');
export const fetchScreener = () => fetchAPI('/stocks/screener');
export const fetchStocksOverview = () => fetchAPI('/stocks/overview');

// Predictions
export const fetchPredictions = () => fetchAPI('/predict/all');
export const fetchSectorPredictions = () => fetchAPI('/predict/sectors');

// Relationships
export const fetchNetworkGraph = () => fetchAPI('/relationships/network');
export const fetchLeaders = () => fetchAPI('/relationships/leaders');
export const fetchCorrelationHeatmap = () => fetchAPI('/relationships/heatmap');

// Portfolio
export const fetchPortfolio = () => fetchAPI('/portfolio/');
export const addPortfolioItem = (data) => fetch(`${API_BASE}/portfolio/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const removePortfolioItem = (ticker) => fetch(`${API_BASE}/portfolio/${ticker}`, {
  method: 'DELETE'
});

// Backtest
export const runBacktest = (ticker, days) => fetchAPI(`/backtest/run?ticker=${ticker}&days=${days}`);

// Alerts
export const fetchAlerts = () => fetchAPI('/alerts/');
