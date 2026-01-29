import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const UrlManager = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, url: null, title: '', loading: false, dataUrl: null });

  useEffect(() => {
    if (qrModal.open && qrModal.url) {
      setQrModal(prev => ({ ...prev, loading: true, dataUrl: null }));
      api.get(qrModal.url)
        .then(res => {
          setQrModal(prev => ({ ...prev, loading: false, dataUrl: res.data.qrCode }));
        })
        .catch(err => {
          console.error("QR Fetch Error:", err);
          setQrModal(prev => ({ ...prev, loading: false }));
        });
    }
  }, [qrModal.open, qrModal.url]);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/url/my-urls');
      setUrls(response.data.urls || []);
    } catch (err) {
      setError('Failed to fetch URLs');
      console.error('Fetch URLs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return;
    }

    try {
      setDeleteLoading(shortCode);
      await api.delete(`/url/${shortCode}`);
      setUrls(urls.filter(url => url.shortCode !== shortCode));
    } catch (err) {
      setError('Failed to delete URL');
      console.error('Delete URL error:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleVisibility = async (shortCode, currentVisibility) => {
    try {
      const response = await api.patch(`/url/${shortCode}/visibility`, {
        isPublic: !currentVisibility
      });

      // Update local state
      setUrls(urls.map(url =>
        url.shortCode === shortCode
          ? { ...url, isPublic: !currentVisibility }
          : url
      ));
    } catch (err) {
      setError('Failed to update visibility');
      console.error('Toggle visibility error:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Manage Your Links
        </h3>
        <span className="text-sm text-gray-400">
          Total: {urls.length}
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      {urls.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-dashed border-white/10">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-300 font-medium">No URLs created yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first short URL to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {urls.map((url) => (
              <motion.div
                key={url._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group p-5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${url.type === 'bio link'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                      }`}>
                      {url.type}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${url.isPublic
                      ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/20'
                      }`}>
                      {url.isPublic ? '🌐 Public' : '🔒 Private'}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(url.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`http://localhost:5001/${url.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-blue-400 hover:text-blue-300 hover:underline truncate"
                      >
                        /{url.shortCode}
                      </a>
                      <button
                        onClick={() => copyToClipboard(`http://localhost:5001/${url.shortCode}`)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                      </button>
                    </div>

                    <div className="flex items-center text-sm text-gray-400 truncate max-w-xl group-hover:text-gray-300 transition-colors">
                      <span className="mr-2">↳</span>
                      {url.type === 'bio link' ? (
                        <a href={`http://localhost:5173/view/${url.shortCode}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-purple-400">
                          Bio Page Viewer
                        </a>
                      ) : (
                        <a href={url.defaultRedirectUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                          {url.defaultRedirectUrl}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        👆 {url.clicksCount || 0}
                      </span>
                      <button
                        onClick={() => setQrModal({
                          open: true,
                          url: `http://localhost:5001/api/url/qr/${url.shortCode}`,
                          title: url.slug || url.shortCode
                        })}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        <span>QR</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisibility(url.shortCode, url.isPublic)}
                        className={`p-1.5 rounded-lg transition-colors border ${url.isPublic
                          ? 'text-green-400 hover:bg-green-500/10 border-transparent hover:border-green-500/20'
                          : 'text-gray-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/20 hover:text-blue-400'
                          }`}
                        title={url.isPublic ? 'Make Private' : 'Make Public'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {url.isPublic ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                          )}
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDelete(url.shortCode)}
                        disabled={deleteLoading === url.shortCode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                        title="Delete URL"
                      >
                        {deleteLoading === url.shortCode ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )
      }

      <AnimatePresence>
        {qrModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrModal({ open: false, url: null, title: '' })}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setQrModal({ open: false, url: null, title: '' })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold text-white mb-1 text-center">QR Code</h3>
              <p className="text-gray-400 text-sm text-center mb-6">/{qrModal.title}</p>

              <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
                {/* The backend returns JSON with qrCode field containing data URI */}
                {qrModal.loading ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : qrModal.dataUrl ? (
                  <img src={qrModal.dataUrl} alt="QR Code" className="w-48 h-48 block" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-red-500">Failed to load</div>
                )}
              </div>

              <div className="flex gap-3">
                {qrModal.dataUrl && (
                  <a
                    href={qrModal.dataUrl}
                    download={`qr-${qrModal.title}.png`}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold text-center transition-colors"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setQrModal({ open: false, url: null, title: '' })}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default UrlManager;
