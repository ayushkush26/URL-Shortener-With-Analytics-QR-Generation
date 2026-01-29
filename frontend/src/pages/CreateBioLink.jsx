import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Save,
    Link as LinkIcon,
    Layout,
    ArrowLeft,
    GripVertical
} from 'lucide-react';
import api from '../api/axios';

const CreateBioLink = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myUrls, setMyUrls] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        links: [
            { title: '', url: '', visible: true }
        ]
    });

    useEffect(() => {
        const fetchMyUrls = async () => {
            try {
                const response = await api.get('/url/my-urls');
                const urls = response.data?.urls || [];
                setMyUrls(urls);
            } catch (err) {
                console.error("Failed to fetch my urls", err);
            }
        };
        fetchMyUrls();
    }, []);

    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            links: [...prev.links, { title: '', url: '', visible: true }]
        }));
    };

    const handleRemoveLink = (index) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    };

    const handleLinkChange = (index, field, value) => {
        const newLinks = [...formData.links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData(prev => ({ ...prev, links: newLinks }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate
            if (!formData.slug) {
                throw new Error('Please enter a unique page handle (slug)');
            }
            const validLinks = formData.links.filter(l => l.title && l.url);
            if (validLinks.length === 0) {
                throw new Error('Please add at least one valid link');
            }

            // Create Bio Link
            // Note: 'originalUrl' is required by backend but less relevant here. 
            // We use the first link or a placeholder.
            const payload = {
                originalUrl: validLinks[0].url, // Fallback/Main link
                slug: formData.slug,
                type: 'bio link',
                links: validLinks.map((l, i) => ({ ...l, position: i })),
                settings: {
                    customDomain: formData.title // Using customDomain field for Title for now, or could store in specific field if model supported it.
                }
            };

            await api.post('/url/shorten', payload);

            navigate('/dashboard/links');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to create bio page');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create Bio Page</h1>
                    <p className="text-gray-400">Share multiple links with a single URL</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Page Settings */}
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Layout size={20} className="text-blue-400" />
                        Page Details
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Page Handle (Slug)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="my-links"
                                />
                            </div>
                        </div>
                        {/* Title field could be stored in a better place, effectively using it as metadata for now */}
                    </div>
                </div>

                {/* Links Editor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <LinkIcon size={20} className="text-purple-400" />
                            Links
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddLink}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Link
                        </button>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {formData.links.map((link, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="glass-panel p-4 rounded-xl flex items-start gap-4 group"
                                >
                                    <div className="mt-4 text-gray-600 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={20} />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        {/* Quick Select Dropdown */}
                                        {myUrls.length > 0 && (
                                            <div className="flex justify-end">
                                                <select
                                                    className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:text-white transition-colors cursor-pointer"
                                                    onChange={(e) => {
                                                        const selected = myUrls.find(u => u.shortCode === e.target.value);
                                                        if (selected) {
                                                            const shortUrlLink = `http://localhost:5001/${selected.shortCode}`;
                                                            handleLinkChange(index, 'url', shortUrlLink);
                                                            // Optional: Auto-set title if empty
                                                            if (!link.title) {
                                                                handleLinkChange(index, 'title', selected.slug || selected.shortCode);
                                                            }
                                                        }
                                                        e.target.value = ""; // Reset dropdown
                                                    }}
                                                >
                                                    <option value="">✨ Select from My Links</option>
                                                    {myUrls.map(url => {
                                                        let hostname = '...';
                                                        try {
                                                            if (url.originalUrl) {
                                                                hostname = new URL(url.originalUrl).hostname;
                                                            }
                                                        } catch (e) {
                                                            hostname = 'Invalid URL';
                                                        }
                                                        return (
                                                            <option key={url._id} value={url.shortCode}>
                                                                {url.slug || url.shortCode} ({hostname})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Title</label>
                                                <input
                                                    type="text"
                                                    value={link.title}
                                                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50"
                                                    placeholder="e.g. My Portfolio"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">URL</label>
                                                <input
                                                    type="url"
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLink(index)}
                                        className="mt-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Create Bio Page
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateBioLink;
