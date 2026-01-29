import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Instagram, Twitter, Facebook, Youtube, Linkedin, Github, Globe, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

const BioProfile = () => {
    const { username } = useParams();
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

    // Get icon for a link based on URL or title
    const getIcon = (url, title) => {
        const urlLower = url.toLowerCase();
        const titleLower = title.toLowerCase();
        
        if (urlLower.includes('instagram') || titleLower.includes('instagram')) {
            return <Instagram size={20} />;
        } else if (urlLower.includes('twitter') || urlLower.includes('x.com') || titleLower.includes('twitter')) {
            return <Twitter size={20} />;
        } else if (urlLower.includes('facebook') || titleLower.includes('facebook')) {
            return <Facebook size={20} />;
        } else if (urlLower.includes('youtube') || titleLower.includes('youtube')) {
            return <Youtube size={20} />;
        } else if (urlLower.includes('linkedin') || titleLower.includes('linkedin')) {
            return <Linkedin size={20} />;
        } else if (urlLower.includes('github') || titleLower.includes('github')) {
            return <Github size={20} />;
        } else if (urlLower.includes('mailto:') || titleLower.includes('email')) {
            return <Mail size={20} />;
        } else {
            return <ExternalLink size={20} />;
        }
    };

    // Ensure URL has protocol
    const formatUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-lg"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                </motion.div>
            </div>
        );
    }

    const displayName = profile.profile?.firstName && profile.profile?.lastName
        ? `${profile.profile.firstName} ${profile.profile.lastName}`
        : profile.username;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    {/* Avatar */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-4"
                    >
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {profile.profile?.avatar ? (
                                    <img 
                                        src={profile.profile.avatar} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-purple-600">
                                        {displayName[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Name */}
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-gray-900 mb-2"
                    >
                        {displayName}
                    </motion.h1>

                    {/* Username */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 mb-4"
                    >
                        @{profile.username}
                    </motion.p>

                    {/* Bio */}
                    {profile.profile?.bio && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-700 text-sm mb-4 px-4 leading-relaxed"
                        >
                            {profile.profile.bio}
                        </motion.p>
                    )}

                    {/* Location */}
                    {profile.profile?.location && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-4"
                        >
                            <MapPin size={16} />
                            <span>{profile.profile.location}</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Links Section */}
                {profile.links && profile.links.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="space-y-3"
                    >
                        {profile.links.map((link, index) => (
                            <motion.a
                                key={index}
                                href={formatUrl(link.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="block w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="text-gray-700 group-hover:text-purple-600 transition-colors">
                                            {link.icon ? (
                                                <img src={link.icon} alt="" className="w-5 h-5 object-contain" />
                                            ) : (
                                                getIcon(link.url, link.title)
                                            )}
                                        </div>
                                        <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                            {link.title}
                                        </span>
                                    </div>
                                    <ExternalLink 
                                        size={18} 
                                        className="text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" 
                                    />
                                </div>
                            </motion.a>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-center py-12 bg-white rounded-2xl shadow-md"
                    >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ExternalLink className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-600">No links yet</p>
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-center mt-8 text-sm text-gray-500"
                >
                    <p>Powered by URL Shortener</p>
                </motion.div>
            </div>
        </div>
    );
};

export default BioProfile;
