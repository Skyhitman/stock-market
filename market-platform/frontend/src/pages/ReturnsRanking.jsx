"import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const ReturnsRanking = () => {
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/stocks/returns')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch returns data');
        return res.json();
      })
      .then(data => {
        setReturnsData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <Activity className="mr-2" /> Error loading data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="text-emerald-400" size={32} />
            Today's Returns
          </h1>
          <p className="text-slate-400 mt-2">
            Intraday profit & loss and return percentage rankings across all tracked stocks.
          </p>
        </div>
      </div>

      <div className="bg-surface/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-300 text-sm font-semibold border-b border-slate-700">
              <tr>
             
<truncated 3168 bytes>