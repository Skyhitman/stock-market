import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchMarketSummary,
  fetchMarketMovers,
  fetchScreener,
  fetchOpportunityRankings,
  fetchPredictions,
  fetchSectorPredictions,
  fetchStocksOverview,
  fetchSectorRankings,
  fetchSectorHistory,
  fetchLeaders,
  fetchCorrelationHeatmap,
  fetchNetworkGraph,
  fetchAlerts
} from '../api/client';
import { useAuth } from './AuthContext';

const MarketDataContext = createContext(null);

export function MarketDataProvider({ children }) {
  const { token } = useAuth();
  const [data, setData] = useState({
    summary: null,
    alerts: [],
    movers: { gainers: [], losers: [] },
    screener: [],
    opportunityRankings: [],
    predictions: [],
    sectorPredictions: [],
    stocksOverview: [],
    sectorRankings: [],
    sectorHistory: [],
    leaders: [],
    heatmap: null,
    networkGraph: null,
    lastFetchTime: null,
    loading: true,
    error: null,
  });

  const refreshNow = useCallback(async () => {
    if (!token) return;
    setData(prev => ({ ...prev, loading: !!prev.lastFetchTime ? false : true, error: null }));
    try {
      const [
        summaryRes,
        alertsRes,
        moversRes,
        screenerRes,
        oppRes,
        predRes,
        secPredRes,
        overviewRes,
        secRankRes,
        secHistRes,
        leadersRes,
        heatmapRes,
        networkRes
      ] = await Promise.all([
        fetchMarketSummary().catch(() => null),
        fetchAlerts().catch(() => []),
        fetchMarketMovers().catch(() => ({ gainers: [], losers: [] })),
        fetchScreener().catch(() => []),
        fetchOpportunityRankings().catch(() => []),
        fetchPredictions().catch(() => []),
        fetchSectorPredictions().catch(() => []),
        fetchStocksOverview().catch(() => []),
        fetchSectorRankings().catch(() => []),
        fetchSectorHistory(30).catch(() => []),
        fetchLeaders().catch(() => []),
        fetchCorrelationHeatmap().catch(() => null),
        fetchNetworkGraph().catch(() => null),
      ]);

      setData({
        summary: summaryRes,
        alerts: alertsRes,
        movers: moversRes || { gainers: [], losers: [] },
        screener: screenerRes || [],
        opportunityRankings: oppRes || [],
        predictions: predRes || [],
        sectorPredictions: secPredRes || [],
        stocksOverview: overviewRes || [],
        sectorRankings: secRankRes || [],
        sectorHistory: secHistRes || [],
        leaders: leadersRes || [],
        heatmap: heatmapRes,
        networkGraph: networkRes,
        lastFetchTime: new Date(),
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setData(prev => ({ ...prev, loading: false, error: 'Failed to synchronize market data.' }));
    }
  }, [token]);

  useEffect(() => {
    refreshNow();
    
    // Poll every 10 minutes
    const interval = setInterval(() => {
      refreshNow();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshNow]);

  return (
    <MarketDataContext.Provider value={{ ...data, refreshNow }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}
