// API Client for interacting with the backend
// Uses VITE_API_URL env var in production, falls back to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchAPI(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch (_) {}
    throw new Error(`API Error: ${detail}`);
  }
  return await res.json();
}

// Authentication
export const loginWithGoogle = (token) => fetch(`${API_BASE}/auth/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
}).then(res => {
  if (!res.ok) throw new Error('Google Sign-In failed');
  return res.json();
});

export const loginAsGuest = (name) => fetch(`${API_BASE}/auth/guest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
}).then(res => {
  if (!res.ok) throw new Error('Guest Sign-In failed');
  return res.json();
});

export const sendHeartbeat = (pages_visited) => fetch(`${API_BASE}/auth/heartbeat`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  },
  body: JSON.stringify({ pages_visited })
}).then(res => res.json());

export const logoutSession = () => fetch(`${API_BASE}/auth/logout`, {
  method: 'POST',
  headers: {
    ...getAuthHeaders()
  }
}).then(res => res.json());

// Admin endpoints
export const fetchAdminSessions = () => fetchAPI('/admin/sessions');
export const fetchAdminStats = () => fetchAPI('/admin/stats');

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
  headers: { 
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  },
  body: JSON.stringify(data)
}).then(res => {
  if (!res.ok) throw new Error('Failed to add portfolio item');
  return res.json();
});
export const removePortfolioItem = (ticker) => fetch(`${API_BASE}/portfolio/${ticker}`, {
  method: 'DELETE',
  headers: {
    ...getAuthHeaders()
  }
}).then(res => {
  if (!res.ok) throw new Error('Failed to remove portfolio item');
  return res.json();
});

// Backtest
export const runBacktest = (ticker, days) => fetchAPI(`/backtest/run?ticker=${ticker}&days=${days}`);

// Alerts
export const fetchAlerts = () => fetchAPI('/alerts/');
