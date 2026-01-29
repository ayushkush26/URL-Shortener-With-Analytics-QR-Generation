import React from 'react';
import UrlManager from '../components/UrlManager';
import { motion } from 'framer-motion';

const MyLinks = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">My Links</h2>
                <p className="text-gray-400">Manage, track, and share your created URLs</p>
            </div>
            <UrlManager />
        </motion.div>
    );
};

export default MyLinks;
