import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Shield,
    CreditCard,
    Mail,
    MapPin,
    Phone,
    Briefcase,
    Building,
    Camera,
    Save,
    ChevronRight,
    Link as LinkIcon,
    Plus,
    Trash2,
    GripVertical,
    ExternalLink,
    LogOut,
    Share2,
    Download,
    X
} from 'lucide-react';

const Profile = () => {
    const { user, logout, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        firstName: user?.firstName || user?.profile?.firstName || '',
        lastName: user?.lastName || user?.profile?.lastName || '',
        bio: user?.profile?.bio || '',
        phone: user?.profile?.phone || '',
        jobTitle: user?.profile?.jobTitle || '',
        company: user?.profile?.company || '',
        company: user?.profile?.company || '',
        location: user?.profile?.location || '',
        avatar: user?.profile?.avatar || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(() => {
        const saved = sessionStorage.getItem('profile_preview');
        return saved || user?.profile?.avatar || null;
    });
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [stream, setStream] = useState(null);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);

    // Modal States
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isTwoFAOpen, setIsTwoFAOpen] = useState(false);
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [twoFAStep, setTwoFAStep] = useState(1); // 1: QR, 2: Verify
    const [qrCode, setQrCode] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
    const [disable2FAPassword, setDisable2FAPassword] = useState('');
    const [profileQrModal, setProfileQrModal] = useState({ open: false, loading: false, dataUrl: null, profileUrl: '' });
    const [linkhubLinks, setLinkHubLinks] = useState([]);
    const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [linkForm, setLinkForm] = useState({ title: '', url: '', icon: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || user.profile?.firstName || '',
                lastName: user.lastName || user.profile?.lastName || '',
                bio: user.profile?.bio || '',
                phone: user.profile?.phone || '',
                jobTitle: user.profile?.jobTitle || '',
                company: user.profile?.company || '',
                company: user.profile?.company || '',
                location: user.profile?.location || '',
                avatar: user.profile?.avatar || '',
            });

            // Sync preview image if not already set locally
            if (!previewImage && user.profile?.avatar) {
                setPreviewImage(user.profile.avatar);
            }
        }
    }, [user]);

    // Fetch linkhub links
    useEffect(() => {
        if (user && activeTab === 'linkhub') {
            fetchLinkHubLinks();
        }
    }, [user, activeTab]);

    const fetchLinkHubLinks = async () => {
        try {
            const { default: apiInstance } = await import('../api/axios');
            const response = await apiInstance.get('/auth/linkhub/links');
            setLinkHubLinks(response.data.links || []);
        } catch (error) {
            console.error('Error fetching linkhub links:', error);
        }
    };

    const handleSaveLinkHubLinks = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const { default: apiInstance } = await import('../api/axios');
            await apiInstance.put('/auth/linkhub/links', { links: linkhubLinks });
            setMessage({ type: 'success', text: 'Links saved successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error saving links:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save links' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddLink = () => {
        if (!linkForm.title || !linkForm.url) {
            setMessage({ type: 'error', text: 'Title and URL are required' });
            return;
        }
        const newLink = {
            title: linkForm.title,
            url: linkForm.url,
            icon: linkForm.icon || undefined,
            position: linkhubLinks.length,
            visible: true,
        };
        setLinkHubLinks([...linkhubLinks, newLink]);
        setLinkForm({ title: '', url: '', icon: '' });
        setIsAddLinkModalOpen(false);
    };

    const handleEditLink = (index) => {
        setEditingLink(index);
        setLinkForm({
            title: linkhubLinks[index].title,
            url: linkhubLinks[index].url,
            icon: linkhubLinks[index].icon || '',
        });
        setIsAddLinkModalOpen(true);
    };

    const handleUpdateLink = () => {
        if (!linkForm.title || !linkForm.url) {
            setMessage({ type: 'error', text: 'Title and URL are required' });
            return;
        }
        const updated = [...linkhubLinks];
        updated[editingLink] = {
            ...updated[editingLink],
            title: linkForm.title,
            url: linkForm.url,
            icon: linkForm.icon || undefined,
        };
        setLinkHubLinks(updated);
        setLinkForm({ title: '', url: '', icon: '' });
        setEditingLink(null);
        setIsAddLinkModalOpen(false);
    };

    const handleDeleteLink = (index) => {
        setLinkHubLinks(linkhubLinks.filter((_, i) => i !== index).map((link, i) => ({ ...link, position: i })));
    };

    const handleMoveLink = (index, direction) => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === linkhubLinks.length - 1)) {
            return;
        }
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...linkhubLinks];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        updated[index].position = index;
        updated[newIndex].position = newIndex;
        setLinkHubLinks(updated);
    };

    // Keep preview image in sync if user changes from elsewhere
    useEffect(() => {
        if (user?.profile?.avatar && !previewImage) {
            setPreviewImage(user.profile.avatar);
        }
    }, [user, previewImage]);

    useEffect(() => {
        if (previewImage && previewImage.startsWith('data:')) {
            sessionStorage.setItem('profile_preview', previewImage);
        }
    }, [previewImage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { default: apiInstance } = await import('../api/axios');
            const response = await apiInstance.put('/auth/profile', formData);
            setUser(response.data.user);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Update error:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoClick = () => {
        // Toggle options menu
        setShowPhotoOptions(!showPhotoOptions);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
        setShowPhotoOptions(false);
    };

    const handleCameraClick = async () => {
        setIsCameraModalOpen(true);
        setShowPhotoOptions(false);
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMessage({ type: 'error', text: 'Could not access camera. Please check permissions.' });
            setIsCameraModalOpen(false);
        }
    };

    const closeCameraModal = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraModalOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        // Mirror for user experience
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        setPreviewImage(dataUrl);
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
        setMessage({ type: 'success', text: "Photo captured. Click 'Apply Changes' to save." });
        closeCameraModal();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (e.g., 2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
                return;
            }

            // Create local preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                // Here you would typically upload to backend
                // For now, we'll just show the preview
                setPreviewImage(reader.result);
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                setMessage({ type: 'success', text: "Photo selected. Click 'Apply Changes' to save." });
            };
            reader.readAsDataURL(file);
        }
    };

    // Change Password Handlers
    // Change Password Handlers
    const handleChangePassword = async (e) => {
        e.preventDefault();

        setMessage({ type: '', text: '' });

        if (!passData.currentPassword || !passData.newPassword || !passData.confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (passData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
            return;
        }

        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const { default: apiInstance } = await import('../api/axios');
            await apiInstance.post('/auth/change-password', {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setIsChangePasswordOpen(false);
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Change Password Error:", error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    // 2FA Handlers
    const start2FASetup = async () => {
        try {
            const { default: apiInstance } = await import('../api/axios');
            const res = await apiInstance.post('/auth/2fa/setup');
            setQrCode(res.data.qrCode);
            setBackupCodes(res.data.backupCodes);
            setTwoFAStep(1); // Show QR
            setIsTwoFAOpen(true);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to start 2FA setup' });
        }
    };

    const verify2FA = async () => {
        try {
            const { default: apiInstance } = await import('../api/axios');
            await apiInstance.post('/auth/2fa/enable', { code: totpCode });
            setUser(prev => ({ ...prev, twoFA: { ...prev.twoFA, enabled: true } }));
            setMessage({ type: 'success', text: '2FA Enabled Successfully!' });
            setIsTwoFAOpen(false);
            setTwoFAStep(1);
            setTotpCode('');
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Invalid Code' });
        }
    };

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { default: apiInstance } = await import('../api/axios');
            await apiInstance.post('/auth/2fa/disable', { password: disable2FAPassword });
            setUser(prev => ({ ...prev, twoFA: { ...prev.twoFA, enabled: false } }));
            setMessage({ type: 'success', text: '2FA Disabled Successfully' });
            setIsDisable2FAModalOpen(false);
            setDisable2FAPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to disable 2FA' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProfileQr = async () => {
        setProfileQrModal(prev => ({ ...prev, open: true, loading: true, dataUrl: null }));
        try {
            const { default: apiInstance } = await import('../api/axios');
            // Depending on how publicProfileController is mounted, it might be /api/public/u/... or just /api/u/...
            // Based on publicProfileRoutes.ts: router.get('/u/:username/qr'...)
            // And assuming it's mounted at /api/public or similar. Let's assume /api/public based on previous file views.
            // If authentication is not required, we can use axios directly, but apiInstance is fine too.
            const res = await apiInstance.get(`/public/u/${user.username}/qr`);
            setProfileQrModal({
                open: true,
                loading: false,
                dataUrl: res.data.qrCode,
                profileUrl: res.data.profileUrl
            });
        } catch (error) {
            console.error("Failed to load profile QR", error);
            setMessage({ type: 'error', text: 'Failed to load profile QR code' });
            setProfileQrModal(prev => ({ ...prev, open: false, loading: false }));
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'linkhub', label: 'LinkHub Links', icon: LinkIcon },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    const planDetails = {
        name: 'Pro Plan',
        limit: 1000,
        usage: 124,
        features: ['Unlimited Links', 'Custom Aliases', 'QR Codes', 'Detailed Analytics', 'Priority Support']
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-6xl mx-auto space-y-8"
            >
                <div className="text-left mb-4">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Account Settings</h2>
                    <p className="text-gray-400 mt-1">Manage your account preferences and profile details</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Sidebar */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                        {/* Profile Summary Card */}
                        <div className="glass-panel p-8 rounded-[2rem] text-center relative overflow-hidden group shadow-2xl">
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-blue-600/40 to-purple-600/40 blur-sm absolute -inset-1"></div>
                                <div className="relative w-32 h-32 mx-auto rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="relative z-10">{(user?.firstName || user?.profile?.firstName)?.[0] || 'U'}</span>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePhotoClick}
                                    className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full border border-white/20 text-white hover:bg-blue-500 transition-colors shadow-lg z-20"
                                >
                                    <Camera size={16} />
                                </button>

                                {/* Photo Options Menu */}
                                <AnimatePresence>
                                    {showPhotoOptions && (
                                        <>
                                            {/* Overlay to close menu when clicking outside */}
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setShowPhotoOptions(false)}
                                            ></div>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-white/20 rounded-2xl p-2 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                                            >
                                                <button
                                                    onClick={handleUploadClick}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl text-sm text-white flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                                                        <Camera size={14} />
                                                    </div>
                                                    Upload Photo
                                                </button>
                                                <button
                                                    onClick={handleCameraClick}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl text-sm text-white flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                                                        <Camera size={14} />
                                                    </div>
                                                    Use Camera
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">
                                {(user?.firstName || user?.profile?.firstName)} {(user?.lastName || user?.profile?.lastName)}
                            </h2>

                            {user?.profile?.jobTitle && (
                                <p className="text-blue-400 font-bold mb-4 text-sm tracking-wide flex items-center justify-center gap-2">
                                    <Briefcase size={14} />
                                    {user.profile.jobTitle} {user.profile.company ? `@ ${user.profile.company}` : ''}
                                </p>
                            )}

                            <div className="space-y-3 mb-6">
                                <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                                    <Mail size={14} className="text-blue-400" />
                                    {user?.email}
                                </p>
                                {user?.profile?.location && (
                                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                                        <MapPin size={14} className="text-pink-400" />
                                        {user.profile.location}
                                    </p>
                                )}
                                {user?.profile?.phone && (
                                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                                        <Phone size={14} className="text-green-400" />
                                        {user.profile.phone}
                                    </p>
                                )}
                            </div>

                            {user?.profile?.bio && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-gray-300 text-sm italic leading-relaxed">"{user.profile.bio}"</p>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-white/5">
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-xs uppercase tracking-wider">
                                    {planDetails.name}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="glass-panel p-2 rounded-[1.5rem] shadow-xl">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 group mb-1 last:mb-0 ${isActive
                                            ? 'bg-blue-600/90 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                                            <span className="font-medium">{tab.label}</span>
                                        </div>
                                        {isActive && <ChevronRight size={16} />}
                                    </button>
                                );
                            })}
                            <div className="my-2 border-t border-white/5"></div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-300"
                            >
                                <LogOut size={18} />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Main Content Area */}
                    <motion.div variants={itemVariants} className="lg:col-span-8">
                        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] shadow-2xl relative">
                            <AnimatePresence mode="wait">
                                {activeTab === 'profile' && (
                                    <motion.div
                                        key="profile-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white">Profile Details</h3>
                                                <p className="text-gray-400">Update your public information</p>
                                            </div>
                                            {message.text && (
                                                <div className={`px-4 py-2 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'
                                                    }`}>
                                                    {message.text}
                                                </div>
                                            )}

                                            <button
                                                onClick={handleOpenProfileQr}
                                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-blue-500/20"
                                            >
                                                <Share2 size={16} />
                                                Share Public Profile
                                            </button>
                                        </div>

                                        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">First Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="Jane"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="Doe"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Bio</label>
                                                <textarea
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleChange}
                                                    rows="4"
                                                    className="glass-input w-full p-5 rounded-[1.5rem] outline-none resize-none"
                                                    placeholder="A short snippet about your journey..."
                                                />
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Job Title</label>
                                                <div className="relative group">
                                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        name="jobTitle"
                                                        value={formData.jobTitle}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="Product Manager"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Company</label>
                                                <div className="relative group">
                                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        name="company"
                                                        value={formData.company}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="Meta"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-pink-400 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="California, USA"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-400 transition-colors" size={18} />
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="glass-input w-full pl-12 pr-4 py-3 rounded-xl outline-none"
                                                        placeholder="+1 234 567 890"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full py-4 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                                                >
                                                    {loading ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <Save size={18} />
                                                            Apply Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}

                                {activeTab === 'linkhub' && (
                                    <motion.div
                                        key="linkhub-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white">LinkHub Links</h3>
                                                <p className="text-gray-400">Manage links for your public profile page</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <a
                                                    href={`http://localhost:5173/u/${user?.username}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-purple-500/20"
                                                >
                                                    <ExternalLink size={16} />
                                                    View Profile
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setEditingLink(null);
                                                        setLinkForm({ title: '', url: '', icon: '' });
                                                        setIsAddLinkModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Add Link
                                                </button>
                                            </div>
                                        </div>

                                        {message.text && (
                                            <div className={`px-4 py-2 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        {linkhubLinks.length === 0 ? (
                                            <div className="text-center py-12 bg-white/5 rounded-2xl">
                                                <LinkIcon className="text-gray-600 mx-auto mb-4" size={48} />
                                                <p className="text-gray-400 mb-2">No links yet</p>
                                                <p className="text-gray-500 text-sm">Add your first link to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {linkhubLinks.map((link, index) => (
                                                    <div
                                                        key={index}
                                                        className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <GripVertical className="text-gray-600 cursor-move" size={20} />
                                                            <button
                                                                onClick={() => handleMoveLink(index, 'up')}
                                                                disabled={index === 0}
                                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveLink(index, 'down')}
                                                                disabled={index === linkhubLinks.length - 1}
                                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-white truncate">{link.title}</p>
                                                            <p className="text-sm text-gray-400 truncate">{link.url}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditLink(index)}
                                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLink(index)}
                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {linkhubLinks.length > 0 && (
                                            <div className="pt-4 border-t border-white/5">
                                                <button
                                                    onClick={handleSaveLinkHubLinks}
                                                    disabled={loading}
                                                    className="w-full py-4 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                                                >
                                                    {loading ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <Save size={18} />
                                                            Save Links
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'security' && (
                                    <motion.div
                                        key="security-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-left border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-bold text-white">Security</h3>
                                            <p className="text-gray-400">Manage your password and authentication</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-lg">
                                                <div className="text-left">
                                                    <p className="font-bold text-white">Password</p>
                                                    <p className="text-sm text-gray-500">Updated periodically for security</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsChangePasswordOpen(true)}
                                                    className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-lg">
                                                <div className="text-left">
                                                    <p className="font-bold text-white">Two-Factor Authentication</p>
                                                    <p className="text-sm text-gray-500">Enable secondary code verification</p>
                                                </div>
                                                <div
                                                    onClick={() => {
                                                        if (user?.twoFA?.enabled) {
                                                            setIsDisable2FAModalOpen(true);
                                                        } else {
                                                            start2FASetup();
                                                        }
                                                    }}
                                                    className={`w-12 h-6 rounded-full relative cursor-pointer group transition-colors ${user?.twoFA?.enabled ? 'bg-green-500/20' : 'bg-blue-900/50'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${user?.twoFA?.enabled
                                                        ? 'left-7 bg-green-500'
                                                        : 'left-1 bg-gray-500 group-hover:bg-gray-400'
                                                        }`}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'billing' && (
                                    <motion.div
                                        key="billing-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-left border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-bold text-white">Plan & Limits</h3>
                                            <p className="text-gray-400">Current subscription and data limit</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="glass-panel p-8 rounded-[1.5rem] border-blue-500/20 bg-blue-500/5 text-left shadow-lg">
                                                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Subscription</p>
                                                <p className="text-3xl font-bold text-white mb-6 leading-tight">{planDetails.name}</p>
                                                <ul className="space-y-3">
                                                    {planDetails.features.slice(0, 3).map((f, i) => (
                                                        <li key={i} className="text-sm text-gray-300 flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="glass-panel p-8 rounded-[1.5rem] text-left flex flex-col justify-between shadow-lg">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="text-left">
                                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Resource Usage</p>
                                                        <p className="text-4xl font-bold text-white tracking-tight">{planDetails.usage}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-600">/{planDetails.limit} Links</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(planDetails.usage / planDetails.limit) * 100}%` }}
                                                            transition={{ duration: 1, delay: 0.2 }}
                                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold text-right tracking-widest">
                                                        {Math.round((planDetails.usage / planDetails.limit) * 100)}% utilized
                                                    </p>
                                                </div>
                                            </div>
                                        </div>


                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Camera Capture Modal */}
            <AnimatePresence>
                {isCameraModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeCameraModal}></div>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Capture Photo</h3>
                                <button onClick={closeCameraModal} className="text-gray-400 hover:text-white transition-colors">
                                    <LogOut size={20} className="rotate-180" />
                                </button>
                            </div>

                            <div className="relative aspect-video bg-slate-950 overflow-hidden ring-1 ring-white/10">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover scale-x-[-1] brightness-110 contrast-105"
                                />
                                {!stream ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-gray-400 font-medium">Starting camera...</p>
                                    </div>
                                ) : (
                                    <div className="absolute top-4 left-4">
                                        <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            Live Feed
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 flex justify-center gap-4 bg-slate-900/50">
                                <button
                                    onClick={closeCameraModal}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    disabled={!stream}
                                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Camera size={18} />
                                    Capture
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile QR Modal */}
            <AnimatePresence>
                {profileQrModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setProfileQrModal(prev => ({ ...prev, open: false }))}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setProfileQrModal(prev => ({ ...prev, open: false }))}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-1 text-center">Share Profile</h3>
                            <p className="text-gray-400 text-sm text-center mb-6">@{user?.username}</p>

                            <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
                                {profileQrModal.loading ? (
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : profileQrModal.dataUrl ? (
                                    <img src={profileQrModal.dataUrl} alt="Profile QR Code" className="w-48 h-48 block" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center text-red-500">Failed to load</div>
                                )}
                            </div>

                            {profileQrModal.profileUrl && (
                                <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between gap-3">
                                    <span className="text-xs text-gray-400 truncate flex-1 font-mono">{profileQrModal.profileUrl}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(profileQrModal.profileUrl);
                                            setMessage({ type: 'success', text: 'Copied to clipboard' });
                                            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 text-xs font-bold"
                                    >
                                        COPY
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {profileQrModal.dataUrl && (
                                    <a
                                        href={profileQrModal.dataUrl}
                                        download={`profile-qr-${user?.username}.png`}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold text-center transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </a>
                                )}
                                <button
                                    onClick={() => setProfileQrModal(prev => ({ ...prev, open: false }))}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Change Password Modal */}
            <AnimatePresence>
                {isChangePasswordOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsChangePasswordOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-panel rounded-[2rem] overflow-hidden shadow-2xl border-white/10 p-8"
                        >
                            <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={passData.currentPassword}
                                    onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                                    className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={passData.newPassword}
                                    onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                    className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                    required
                                    minLength={8}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={passData.confirmPassword}
                                    onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                    className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                    required
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsChangePasswordOpen(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2FA Setup Modal */}
            <AnimatePresence>
                {isTwoFAOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsTwoFAOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-panel rounded-[2rem] overflow-hidden shadow-2xl border-white/10 p-8 text-center"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Enable 2FA In 2 Steps</h3>
                            <p className="text-gray-400 text-sm mb-6">Secure your account with Google Authenticator</p>

                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                                    {qrCode ? <img src={qrCode} alt="QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 animate-pulse bg-gray-200 rounded-lg"></div>}
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-white">Enter Code from App</p>
                                    <input
                                        type="text"
                                        placeholder="123 456"
                                        value={totpCode}
                                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        className="glass-input w-full px-4 py-3 rounded-xl outline-none text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                </div>

                                {/* Backup Codes (Only show if needed, simplifed here) */}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsTwoFAOpen(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={verify2FA}
                                        disabled={totpCode.length !== 6}
                                        className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Verify & Enable
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Disable 2FA Modal */}
            <AnimatePresence>
                {isDisable2FAModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsDisable2FAModalOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-panel rounded-[2rem] overflow-hidden shadow-2xl border-white/10 p-8"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Disable 2FA</h3>
                            <p className="text-gray-400 text-sm mb-6">Enter your password to disable Two-Factor Authentication</p>

                            <form onSubmit={handleDisable2FA} className="space-y-4">
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={disable2FAPassword}
                                    onChange={e => setDisable2FAPassword(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                    required
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsDisable2FAModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg disabled:opacity-50"
                                        disabled={!disable2FAPassword}
                                    >
                                        Disable 2FA
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Edit Link Modal */}
            <AnimatePresence>
                {isAddLinkModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => {
                            setIsAddLinkModalOpen(false);
                            setEditingLink(null);
                            setLinkForm({ title: '', url: '', icon: '' });
                        }}></div>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-panel rounded-[2rem] overflow-hidden shadow-2xl border-white/10 p-8"
                        >
                            <h3 className="text-xl font-bold text-white mb-6">
                                {editingLink !== null ? 'Edit Link' : 'Add New Link'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., My Instagram"
                                        value={linkForm.title}
                                        onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                                        className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com"
                                        value={linkForm.url}
                                        onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                                        className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Icon URL (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/icon.png"
                                        value={linkForm.icon}
                                        onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })}
                                        className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddLinkModalOpen(false);
                                            setEditingLink(null);
                                            setLinkForm({ title: '', url: '', icon: '' });
                                        }}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingLink !== null ? handleUpdateLink : handleAddLink}
                                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
                                    >
                                        {editingLink !== null ? 'Update' : 'Add'} Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Profile;
