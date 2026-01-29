import React from 'react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { motion } from 'framer-motion';

const Analytics = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Analytics</h2>
                <p className="text-gray-400">Detailed insights into your link performance</p>
            </div>
            <AnalyticsDashboard />
        </motion.div>
    );
};

export default Analytics;
