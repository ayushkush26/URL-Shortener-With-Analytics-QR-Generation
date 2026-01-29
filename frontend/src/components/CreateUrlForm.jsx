import React, { useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const CreateUrlForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    originalUrl: '',
    slug: '',
    type: 'redirect',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUrl, setCreatedUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.post('/url/shorten', {
        originalUrl: formData.originalUrl,
        slug: formData.slug || undefined,
        type: formData.type,
      });

      setCreatedUrl(response.data);
      setSuccess(true);
      setFormData({ originalUrl: '', slug: '', type: 'redirect' });

      // Notify parent after delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create URL');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Create New Short Link
        </h3>
        <p className="text-gray-400">
          Simplify your links for better reach and tracking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Destination URL <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">🔗</span>
            </div>
            <input
              type="url"
              name="originalUrl"
              id="originalUrl"
              required
              className="glass-input block w-full pl-10 pr-3 py-3 rounded-xl sm:text-sm"
              placeholder="https://example.com/clean/url"
              value={formData.originalUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
              Custom Slug <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">/</span>
              </div>
              <input
                type="text"
                name="slug"
                id="slug"
                className="glass-input block w-full pl-6 pr-3 py-3 rounded-xl sm:text-sm"
                placeholder="custom-name"
                value={formData.slug}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Link Type
            </label>
            <div className="relative">
              <select
                name="type"
                id="type"
                className="glass-input block w-full px-3 py-3 rounded-xl sm:text-sm appearance-none"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="redirect" className="bg-gray-800">Redirect</option>
                <option value="bio link" className="bg-gray-800">Bio Link</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <div className="flex">
                <div className="text-red-300 text-sm">
                  {error}
                </div>
              </div>
            </motion.div>
          )}

          {success && createdUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
            >
              <div className="flex flex-col">
                <div className="text-green-400 font-semibold mb-2 flex items-center">
                  <span className="mr-2">🎉</span> URL Created Successfully!
                </div>
                <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                  <a href={createdUrl.shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate mr-4">
                    {createdUrl.shortUrl}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdUrl.shortUrl)}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Shorten URL'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUrlForm;
