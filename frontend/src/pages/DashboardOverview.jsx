import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DashboardOverview = () => {
    const navigate = useNavigate();

    const links = [
        {
            title: "Create Bio Page",
            description: "An All-in-One Url Shortener which provides all your links in a single bio page",
            action: () => navigate('/dashboard/create-bio'),
            color: "from-emerald-500 to-teal-500",
            hoverColor: "hover:shadow-emerald-500/30",
            icon: "✨"
        },
        {
            title: "Analytics",
            description: "Real Time Tracking of Your newly created Bio-Page",
            action: () => navigate('/dashboard/analytics'),
            color: "from-blue-500 to-indigo-500",
            hoverColor: "hover:shadow-blue-500/30",
            icon: "📈"
        },
        {
            title: "My Links",
            description: "Find all the Links And Previous and Current Bio-Pages Made By you",
            action: () => navigate('/dashboard/links'),
            color: "from-purple-500 to-pink-500",
            hoverColor: "hover:shadow-purple-500/30",
            icon: "🔗"
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 max-w-xl mx-auto">
            {/* Header / Profile Section - Mimicking Linktree Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <div className="w-24 h-24 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg border-4 border-white/10">
                    ⚡
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">My Dashboard</h1>
                <p className="text-gray-400">Manage your links and bios</p>
            </motion.div>

            {/* Links Stack */}
            <div className="w-full space-y-6">
                {links.map((link, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={link.action}
                        className={`
                            relative w-full p-6 rounded-2xl text-left group overflow-hidden
                            bg-white/5 border border-white/10 backdrop-blur-sm
                            hover:bg-white/10 transition-all duration-300
                            ${link.hoverColor} hover:shadow-xl hover:border-white/20
                        `}
                    >
                        {/* Background Gradient on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-200 transition-colors">
                                    {link.title}
                                </h3>
                                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    {link.description}
                                </p>
                            </div>
                            <div className={`
                                w-10 h-10 rounded-full bg-gradient-to-br ${link.color}
                                flex items-center justify-center text-xl shadow-lg
                                transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300
                            `}>
                                {link.icon}
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default DashboardOverview;
