import React, { useEffect, useState } from 'react';
import { fetchAdminSessions, fetchAdminStats } from '../api/client';
import GlassCard from '../components/GlassCard';
import { Users, ShieldAlert, Monitor, Globe, Clock, RefreshCw, BarChart2 } from 'lucide-react';

export default function AdminPanel() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAdminSessions(), fetchAdminStats()])
      .then(([sessionsData, statsData]) => {
        setSessions(sessionsData);
        setStats(statsData);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch admin dashboard metrics.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshKey]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return 'Active';
    // Backend stores UTC — convert to IST (UTC+5:30)
    const d = new Date(dtStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  };

  const parseUA = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome / PC';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari / Apple';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return ua.split(' ')[0] || 'Browser';
  };

  if (loading && refreshKey === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mr-3" />
        <span>Loading Admin System Data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 bg-slate-950 text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            System Analytics Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time tracking of visitor sessions, user demographics, and page popularity.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-xs font-semibold rounded-lg hover:text-cyan-400 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          {error}
        </div>
      )}

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard className="p-6 border border-slate-900 bg-slate-900/30">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Total Users</span>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.total_users}</h3>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border border-slate-900 bg-slate-900/30">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Sessions Logged</span>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.total_sessions}</h3>
              </div>
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border border-slate-900 bg-slate-900/30">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Google Logins</span>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.google_sessions}</h3>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Globe className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border border-slate-900 bg-slate-900/30">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Guest Visitors</span>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.guest_sessions}</h3>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                <Monitor className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main Grid: Sessions & Popular Pages */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Sessions Table */}
        <div className="xl:col-span-2">
          <GlassCard className="border border-slate-900 bg-slate-900/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Recent Visitor Sessions
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                {sessions.length} active logs
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-500 border-b border-slate-900">
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Login Time</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">IP / Device</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Visited Pages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {sess.user?.picture ? (
                          <img src={sess.user.picture} alt="" className="w-8 h-8 rounded-full border border-slate-800" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs uppercase border border-slate-700">
                            {sess.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-white block">{sess.name}</span>
                          <span className="text-xs text-slate-500">{sess.user?.email || 'Guest Session'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDateTime(sess.login_time)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {formatDuration(sess.duration_seconds)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 block text-xs font-mono">{sess.ip_address}</span>
                        <span className="text-slate-500 text-xs">{parseUA(sess.user_agent)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {sess.pages_visited.slice(0, 3).map((page, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-500/10 font-mono">
                              {page === '/' ? '/home' : page}
                            </span>
                          ))}
                          {sess.pages_visited.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500">
                              +{sess.pages_visited.length - 3} more
                            </span>
                          )}
                          {sess.pages_visited.length === 0 && (
                            <span className="text-xs text-slate-600 italic">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Popular Pages Panel */}
        <div>
          <GlassCard className="border border-slate-900 bg-slate-900/30 p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              Page View Analysis
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {stats && Object.entries(stats.page_views)
                .sort((a, b) => b[1] - a[1])
                .map(([route, count]) => {
                  const maxCount = Math.max(...Object.values(stats.page_views), 1);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={route} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400 font-mono">{route === '/' ? '/ (Home)' : route}</span>
                        <span className="text-white">{count} views</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {(!stats || Object.keys(stats.page_views).length === 0) && (
                <div className="text-slate-600 text-center italic py-12">
                  No page views tracked yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
