import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsDashboard = () => {
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/url/my-urls');
      const urls = response.data.urls || [];
      setUrls(urls);

      // Auto-select first URL for analytics
      if (urls.length > 0) {
        fetchAnalytics(urls[0].shortCode);
        setSelectedUrl(urls[0]);
      }
    } catch (err) {
      setError('Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (shortCode) => {
    try {
      setLoading(true);
      const response = await api.get(`/url/analytics/${shortCode}`);
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSelect = (url) => {
    setSelectedUrl(url);
    fetchAnalytics(url.shortCode);
  };

  if (loading && !analytics) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* URL Selection */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Select URL for Analytics
        </h3>

        {urls.length === 0 ? (
          <p className="text-gray-400">No URLs available for analytics.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urls.map((url) => (
              <button
                key={url._id}
                onClick={() => handleUrlSelect(url)}
                className={`p-4 rounded-xl text-left transition-all duration-200 border ${selectedUrl?.shortCode === url.shortCode
                  ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className="font-medium truncate  text-blue-200">
                  {url.shortCode}
                </div>
                <div className="text-sm text-gray-400 mt-1 truncate">
                  {url.defaultRedirectUrl}
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                  {url.clicksCount || 0} clicks
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Display */}
      {selectedUrl && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Clicks', value: analytics.totalClicks || 0, icon: '👆', color: 'from-blue-500 to-cyan-500' },
              { label: 'Active Days', value: analytics.dailyAnalytics?.length || 0, icon: '📅', color: 'from-purple-500 to-pink-500' },
              { label: 'Recent Clicks', value: analytics.recentClicks?.length || 0, icon: '⏰', color: 'from-amber-500 to-orange-500' }
            ].map((stat, i) => (
              <div key={i} className="glass-panel overflow-hidden rounded-2xl relative p-6">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl rounded-full transform translate-x-10 -translate-y-10`}></div>
                <div className="flex items-center relative z-10">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                    {stat.icon}
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-400 truncate">
                      {stat.label}
                    </p>
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Analytics Chart */}
            <div className="glass-panel p-6 rounded-2xl col-span-1 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-6 text-gray-200">Traffic Overview</h3>
              <div className="h-[300px] w-full">
                {analytics.dailyAnalytics && analytics.dailyAnalytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyAnalytics}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Area type="monotone" dataKey="totalClicks" stroke="#8884d8" fillOpacity={1} fill="url(#colorClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No traffic data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent Clicks List */}
            <div className="glass-panel p-6 rounded-2xl overflow-hidden">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Recent Activity</h3>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {analytics.recentClicks && analytics.recentClicks.length > 0 ? (
                  analytics.recentClicks.slice(0, 10).map((click, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {(click.geo?.country || '??').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {click.device?.deviceType || click.device || 'Unknown Device'} / {click.device?.os || 'Unknown OS'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {click.geo?.city || 'Unknown City'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent clicks</p>
                )}
              </div>
            </div>

            {/* Device/OS Stats (Placeholder for future or if data exists) */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Short URL</span>
                  <a href={`http://localhost:5001/${selectedUrl.shortCode}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 truncate max-w-[200px]">
                    http://localhost:5001/{selectedUrl.shortCode}
                  </a>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Target URL</span>
                  <span className="text-gray-300 truncate max-w-[200px]" title={selectedUrl.defaultRedirectUrl}>
                    {selectedUrl.defaultRedirectUrl}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      if (!analytics?.recentClicks?.length) return;

                      const headers = ['Date', 'IP', 'Country', 'City', 'Device', 'OS', 'Browser'];
                      const rows = analytics.recentClicks.map(click => [
                        new Date(click.timestamp).toLocaleString(),
                        click.ip, // Note: This is hashed, but included for reference
                        click.geo?.country || 'Unknown',
                        click.geo?.city || 'Unknown',
                        click.device?.deviceType || click.device || 'Unknown',
                        click.device?.os || 'Unknown',
                        click.device?.browser || 'Unknown'
                      ]);

                      const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `analytics_${selectedUrl.shortCode}_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
                  >
                    Download Report (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
