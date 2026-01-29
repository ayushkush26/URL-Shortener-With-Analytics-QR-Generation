import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateUrlForm from '../components/CreateUrlForm';
import { motion } from 'framer-motion';

const CreateLink = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Create New Short Link</h2>
                <p className="text-gray-400">Generate a short URL and QR code instantly</p>
            </div>
            <CreateUrlForm onSuccess={() => navigate('/dashboard/links')} />
        </motion.div>
    );
};

export default CreateLink;
