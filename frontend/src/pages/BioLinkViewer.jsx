import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Share2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BioLinkViewer = () => {
    const { shortCode } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch public info for this specific shortCode
                // Note: The endpoint should be exposing the ShortUrl data including 'links'
                const response = await axios.get(`http://localhost:5001/api/url/public/${shortCode}`);
                setData(response.data);
            } catch (err) {
                console.error('Error fetching bio link data:', err);
                setError('Page not found or expired');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [shortCode]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    const { ownerId: owner, links } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-y-auto">
            <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] mb-4">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            {owner?.profile?.avatar ? (
                                <img src={owner.profile.avatar} alt={owner.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold">{owner?.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-1">
                        {owner?.profile?.firstName ? `${owner.profile.firstName} ${owner.profile.lastName}` : `@${owner?.username}`}
                    </h1>
                    {owner?.profile?.bio && (
                        <p className="text-gray-400 text-sm max-w-xs mx-auto line-clamp-3">
                            {owner.profile.bio}
                        </p>
                    )}
                </motion.div>

                {/* Links List */}
                <div className="flex-1 space-y-4 pb-12">
                    {links && links.map((link, index) => (
                        link.visible && (
                            <motion.a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="block"
                            >
                                <div className="glass-panel p-4 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 active:scale-[0.98] flex items-center justify-between group">
                                    <span className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                                        {link.title}
                                    </span>
                                    <ExternalLink size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                            </motion.a>
                        )
                    ))}

                    {(!links || links.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                            No links added yet.
                        </div>
                    )}
                </div>

                {/* Footer brand */}
                <div className="py-6 text-center">
                    <a href="/" className="text-xs font-semibold text-slate-700 hover:text-blue-500 transition-colors uppercase tracking-widest">
                        Powered by Linkify
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BioLinkViewer;
