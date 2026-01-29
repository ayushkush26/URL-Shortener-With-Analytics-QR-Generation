import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    Building,
    ExternalLink,
    Calendar,
    BarChart3,
    ArrowLeft,
    Lock
} from 'lucide-react';
import axios from 'axios';

const PublicProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPublicProfile();
    }, [username]);

    const fetchPublicProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5001/api/public/u/${username}`);
            setProfile(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching public profile:', err);
            setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 rounded-3xl max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-red-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={18} />
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </motion.button>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 sm:p-12 rounded-[2.5rem] mb-8 text-center relative overflow-hidden"
                >
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 -z-10"></div>

                    {/* Avatar */}
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-blue-600/40 to-purple-600/40 blur-sm absolute -inset-1"></div>
                        <div className="relative w-32 h-32 mx-auto rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-5xl font-bold text-white shadow-2xl overflow-hidden">
                            {profile.profile?.avatar ? (
                                <img src={profile.profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span>{profile.profile?.firstName?.[0] || profile.username[0].toUpperCase()}</span>
                            )}
                        </div>
                    </div>

                    {/* Name & Username */}
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {profile.profile?.firstName && profile.profile?.lastName
                            ? `${profile.profile.firstName} ${profile.profile.lastName}`
                            : profile.username}
                    </h1>
                    <p className="text-blue-400 font-semibold mb-6">@{profile.username}</p>

                    {/* Job Title & Company */}
                    {profile.profile?.jobTitle && (
                        <p className="text-lg text-gray-300 mb-4 flex items-center justify-center gap-2">
                            <Briefcase size={18} className="text-blue-400" />
                            {profile.profile.jobTitle}
                            {profile.profile.company && (
                                <>
                                    <span className="text-gray-500">@</span>
                                    <Building size={18} className="text-purple-400" />
                                    {profile.profile.company}
                                </>
                            )}
                        </p>
                    )}

                    {/* Bio */}
                    {profile.profile?.bio && (
                        <p className="text-gray-300 italic max-w-2xl mx-auto mb-6 leading-relaxed">
                            "{profile.profile.bio}"
                        </p>
                    )}

                    {/* Location & Member Since */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                        {profile.profile?.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-pink-400" />
                                {profile.profile.location}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-green-400" />
                            Member since {formatDate(profile.memberSince)}
                        </div>
                    </div>
                </motion.div>

                {/* Links Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-8 rounded-[2.5rem]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="text-blue-400" size={28} />
                            Public Links
                        </h2>
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-semibold text-sm">
                            {profile.totalPublicLinks} {profile.totalPublicLinks === 1 ? 'Link' : 'Links'}
                        </div>
                    </div>

                    {profile.links && profile.links.length > 0 ? (
                        <div className="space-y-4">
                            {profile.links.map((link, index) => (
                                <motion.div
                                    key={link.shortCode}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Short URL */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <a
                                                    href={link.shortUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 font-mono text-lg font-semibold flex items-center gap-2 group/link"
                                                >
                                                    {link.shortUrl}
                                                    <ExternalLink size={16} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </a>
                                                <button
                                                    onClick={() => copyToClipboard(link.shortUrl)}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>

                                            {/* Original URL */}
                                            <p className="text-gray-400 text-sm truncate mb-2">
                                                → {link.originalUrl}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 size={14} />
                                                    {link.clicks} clicks
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    Created {formatDate(link.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="text-gray-600" size={32} />
                            </div>
                            <p className="text-gray-400 text-lg">No public links yet</p>
                            <p className="text-gray-500 text-sm mt-2">This user hasn't shared any links publicly</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default PublicProfile;
