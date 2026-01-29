import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    PlusCircle,
    Link as LinkIcon,
    BarChart2,
    User,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', name: 'Overview', icon: LayoutDashboard, end: true },
        { path: '/dashboard/create', name: 'Create Link', icon: PlusCircle },
        { path: '/dashboard/create-bio', name: 'Create Bio Page', icon: Layout },
        { path: '/dashboard/links', name: 'My Links', icon: LinkIcon },
        { path: '/dashboard/analytics', name: 'Analytics', icon: BarChart2 },
        { path: '/dashboard/profile', name: 'Profile', icon: User },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-button rounded-lg text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                className={`fixed top-0 left-0 h-full z-40 glass-panel border-r border-white/10 transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isOpen ? 'w-64' : 'w-20'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center space-x-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">L</span>
                                    </div>
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 whitespace-nowrap">
                                        Linkify
                                    </span>
                                </motion.div>
                            ) : (
                                <div className="w-full flex justify-center">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">L</span>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronRight size={20} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) => `
                  flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive
                                        ? 'bg-blue-600/20 text-blue-300 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={22} className={`min-w-[22px] ${isOpen ? 'mr-3' : 'mx-auto'}`} />

                                        {isOpen && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="font-medium whitespace-nowrap overflow-hidden"
                                            >
                                                {item.name}
                                            </motion.span>
                                        )}

                                        {!isOpen && (
                                            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                                {item.name}
                                            </div>
                                        )}

                                        {/* Active Indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 rounded-xl border border-blue-500/30"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-3 border-t border-white/5">
                        <div className={`
              rounded-xl p-2 transition-colors
              ${isOpen ? 'bg-white/5' : ''}
            `}>
                            <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
                                <div className="flex items-center min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                        {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                                    </div>
                                    {isOpen && (
                                        <div className="ml-3 overflow-hidden">
                                            <p className="text-sm font-medium text-white truncate">
                                                {(user?.firstName || user?.profile?.firstName)
                                                    ? `${user?.firstName || user?.profile?.firstName} ${user?.lastName || user?.profile?.lastName}`
                                                    : 'User'}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {user?.profile?.jobTitle || user?.email}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {isOpen && (
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isOpen && (
                            <button
                                onClick={handleLogout}
                                className="mt-2 w-full p-2 flex justify-center rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
