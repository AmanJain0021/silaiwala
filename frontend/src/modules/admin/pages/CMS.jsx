import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, FileText, Bell, Plus, Edit2, Trash2, Smartphone, Megaphone, X } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminCMS = () => {
    const [selectedTab, setSelectedTab] = useState('Banners');
    const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);

    // Banner States
    const [bannersData, setBannersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBanner, setNewBanner] = useState({
        title: '',
        subtitle: '',
        badge: '',
        color: 'bg-gradient-to-br from-[#2D2F6E] to-[#ff85a2]',
        targetLocation: 'Home Page - Top Carousel',
        image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    // CMS Content (Legal/FAQ)
    const [cmsContent, setCmsContent] = useState([]);
    const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
    const [newContent, setNewContent] = useState({ title: '', content: '', type: 'legal', slug: '', category: 'general' });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Notification States
    const [notification, setNotification] = useState({ title: '', message: '', targetAudience: 'customer' });
    const [isSending, setIsSending] = useState(false);

    const tabs = ['Banners', 'Notifications', 'Legal Pages', 'FAQs'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (selectedTab === 'Banners') {
                const res = await api.get('/admin/cms/banners');
                setBannersData(res.data.data);
            } else if (selectedTab === 'Legal Pages') {
                const res = await api.get('/admin/cms/content?type=legal');
                setCmsContent(res.data.data);
            } else if (selectedTab === 'FAQs') {
                const res = await api.get('/admin/cms/content?type=faq');
                setCmsContent(res.data.data);
            }
        } catch (error) {
            console.error(`Error fetching ${selectedTab}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedTab]);

    const handleDeleteBanner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.delete(`/admin/cms/banners/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete banner:', error);
        }
    };

    const handleDeleteContent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) return;
        try {
            await api.delete(`/admin/cms/content/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete content:', error);
        }
    };

    const handleCreateBanner = async () => {
        if (!newBanner.title || !newBanner.image) return;
        setIsSubmitting(true);
        try {
            await api.post('/admin/cms/banners', newBanner);
            setIsAddBannerModalOpen(false);
            setNewBanner({
                title: '',
                subtitle: '',
                badge: '',
                color: 'bg-gradient-to-br from-[#2D2F6E] to-[#ff85a2]',
                targetLocation: 'Home Page - Top Carousel',
                image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'
            });
            fetchData();
        } catch (error) {
            console.error('Failed to create banner:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateContent = async () => {
        if (!newContent.title || !newContent.content) return;
        setIsSubmitting(true);
        try {
            const payload = { ...newContent, type: selectedTab === 'Legal Pages' ? 'legal' : 'faq' };
            if (!payload.slug) payload.slug = payload.title.toLowerCase().replace(/ /g, '-');

            if (isEditing) {
                await api.put(`/admin/cms/content/${editId}`, payload);
                toast.success('Content updated successfully');
            } else {
                await api.post('/admin/cms/content', payload);
                toast.success('Content published successfully');
            }

            setIsAddContentModalOpen(false);
            setNewContent({ title: '', content: '', type: 'legal', slug: '', category: 'general' });
            setIsEditing(false);
            setEditId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to save content:', error);
            toast.error('Failed to save content');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditContent = (item) => {
        setNewContent({
            title: item.title,
            content: item.content,
            type: item.type,
            slug: item.slug || '',
            category: item.category || 'general'
        });
        setEditId(item._id);
        setIsEditing(true);
        setIsAddContentModalOpen(true);
    };

    const handleSendBroadcast = async () => {
        if (!notification.title || !notification.message) return toast.error('Please fill all fields');
        setIsSending(true);
        try {
            await api.post('/admin/cms/notifications/broadcast', notification);
            toast.success('Broadcast sent successfully');
            setNotification({ title: '', message: '', targetAudience: 'customer' });
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            toast.error('Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewBanner({ ...newBanner, image: res.data.data });
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Content Management</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage app content, push notifications, and legal documents</p>
                </div>
                {selectedTab === 'Banners' && (
                    <button
                        onClick={() => setIsAddBannerModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest"
                    >
                        <Plus size={16} /> Add Banner
                    </button>
                )}
                {(selectedTab === 'Legal Pages' || selectedTab === 'FAQs') && (
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditId(null);
                            setNewContent({ title: '', content: '', type: 'legal', slug: '', category: 'general' });
                            setIsAddContentModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest"
                    >
                        <Plus size={16} /> Add {selectedTab === 'Legal Pages' ? 'Document' : 'FAQ'}
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-6 relative">
                {isLoading && (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3"></div>
                    </div>
                )}
                {selectedTab === 'Banners' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bannersData.map(banner => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={banner._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
                            >
                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider backdrop-blur-md ${getStatusStyle(banner.status)}`}>
                                            {banner.status}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 bg-white text-gray-700 hover:text-primary shadow-sm rounded-lg transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteBanner(banner._id)} className="p-1.5 bg-white text-gray-700 hover:text-red-600 shadow-sm rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-black text-gray-900">{banner.title}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Placement: {banner.targetLocation}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {selectedTab === 'Notifications' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 tracking-tight">
                                    <Megaphone size={18} className="text-primary" />
                                    Broadcast Push Notification
                                </h3>
                                <p className="text-[10px] text-gray-500 font-medium mt-1">Send manual alerts to all active users</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Audience</label>
                                    <select
                                        value={notification.targetAudience}
                                        onChange={e => setNotification({ ...notification, targetAudience: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value="customer">All Customers</option>
                                        <option value="tailor">All Tailors</option>
                                        <option value="delivery">Delivery Partners</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Notification Title</label>
                                    <input
                                        type="text"
                                        value={notification.title}
                                        onChange={e => setNotification({ ...notification, title: e.target.value })}
                                        placeholder="e.g. 50% Off on Stitching"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Message Body</label>
                                    <textarea
                                        rows={4}
                                        value={notification.message}
                                        onChange={e => setNotification({ ...notification, message: e.target.value })}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors resize-none"
                                    ></textarea>
                                </div>
                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={isSending}
                                    className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={16} />}
                                    {isSending ? 'Sending...' : 'Send Broadcast'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-2xl shadow-sm text-white flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Smartphone size={100} />
                            </div>
                            <Smartphone size={48} className="text-white/80 mb-4 relative z-10" />
                            <h3 className="text-lg font-black tracking-tight relative z-10">Automated Flows</h3>
                            <p className="text-xs text-white/70 mt-2 max-w-sm relative z-10">Transactional notifications (order updates, shipping, payments) are handled automatically by the system algorithms.</p>
                            <button className="mt-6 px-6 py-2.5 bg-white text-primary text-[10px] font-black rounded-xl hover:shadow-lg transition-all uppercase tracking-widest relative z-10">
                                View Notification Logs
                            </button>
                        </div>
                    </div>
                )}

                {selectedTab === 'Legal Pages' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Document Title</th>
                                    <th className="px-6 py-4">Last Updated</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cmsContent.map((doc, i) => (
                                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 text-gray-500 rounded-lg group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{doc.title}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">/{doc.slug}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-500">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${doc.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {doc.isActive ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditContent(doc)}
                                                    className="px-4 py-2 bg-gray-50 text-primary text-[10px] font-black rounded-lg hover:bg-gray-100 uppercase tracking-widest border border-gray-200"
                                                >
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteContent(doc._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {cmsContent.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs font-bold">No legal documents found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedTab === 'FAQs' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Question</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cmsContent.map((faq, i) => (
                                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4 max-w-md">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors block truncate">{faq.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{faq.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${faq.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {faq.isActive ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditContent(faq)}
                                                    className="px-4 py-2 bg-gray-50 text-primary text-[10px] font-black rounded-lg hover:bg-gray-100 uppercase tracking-widest border border-gray-200"
                                                >
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteContent(faq._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {cmsContent.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs font-bold">No FAQs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Banner Modal */}
            <AnimatePresence>
                {isAddBannerModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setIsAddBannerModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">Upload Banner</h2>
                                    <button onClick={() => setIsAddBannerModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-5 flex-1 bg-white">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Banner Title (Internal)</label>
                                        <input type="text" value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="e.g. Diwali Flash Sale" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Subtitle (Public)</label>
                                            <input type="text" value={newBanner.subtitle} onChange={e => setNewBanner({ ...newBanner, subtitle: e.target.value })} placeholder="e.g. On your first custom stitching order" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Badge Text</label>
                                            <input type="text" value={newBanner.badge} onChange={e => setNewBanner({ ...newBanner, badge: e.target.value })} placeholder="e.g. LIMITED OFFER" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Placement Location</label>
                                            <select value={newBanner.targetLocation} onChange={e => setNewBanner({ ...newBanner, targetLocation: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors appearance-none">
                                                <option>Home Page - Top Carousel</option>
                                                <option>Store Tab - Header Banner</option>
                                                <option>Promotional Popup</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Gradient Color (Tailwind)</label>
                                            <select value={newBanner.color} onChange={e => setNewBanner({ ...newBanner, color: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors appearance-none">
                                                <option value="bg-gradient-to-br from-[#2D2F6E] to-[#ff85a2]">SilaiWala Pink</option>
                                                <option value="bg-gradient-to-br from-[#1e3e5a] to-[#2d5a8c]">Deep Ocean Blue</option>
                                                <option value="bg-gradient-to-br from-[#5a1e3e] to-[#8c2d5a]">Luxury Purple</option>
                                                <option value="bg-gradient-to-br from-[#1e3932] to-[#2d5246]">Classic Emerald</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Banner Image</label>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newBanner.image}
                                                    onChange={e => setNewBanner({ ...newBanner, image: e.target.value })}
                                                    placeholder="https://..."
                                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        disabled={isImageUploading}
                                                    />
                                                    <button className="h-full px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200 whitespace-nowrap">
                                                        {isImageUploading ? (
                                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                                        ) : (
                                                            <ImageIcon size={16} />
                                                        )}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {newBanner.image && (
                                                <div className="h-32 w-full rounded-xl border border-gray-100 overflow-hidden bg-gray-50 relative group">
                                                    <img src={newBanner.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">Live Preview</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-3xl">
                                    <button onClick={() => setIsAddBannerModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                        Cancel
                                    </button>
                                    <button disabled={isSubmitting} onClick={handleCreateBanner} className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest disabled:opacity-50">
                                        {isSubmitting ? 'Publishing...' : 'Publish Banner'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Content Modal (Legal/FAQ) */}
            <AnimatePresence>
                {isAddContentModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setIsAddContentModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">
                                        {isEditing ? 'Edit' : 'Add'} {selectedTab === 'Legal Pages' ? 'Legal Document' : 'FAQ'}
                                    </h2>
                                    <button onClick={() => setIsAddContentModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-5 flex-1 bg-white overflow-y-auto max-h-[70vh]">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">{selectedTab === 'Legal Pages' ? 'Document Title' : 'Question'}</label>
                                        <input type="text" value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })} placeholder={selectedTab === 'Legal Pages' ? "e.g. Privacy Policy" : "e.g. How to track my order?"} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">URL Slug (Optional)</label>
                                            <input type="text" value={newContent.slug} onChange={e => setNewContent({ ...newContent, slug: e.target.value })} placeholder="e.g. privacy-policy" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Category</label>
                                            <select value={newContent.category} onChange={e => setNewContent({ ...newContent, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors appearance-none">
                                                <option value="general">General</option>
                                                <option value="customer">Customer</option>
                                                <option value="tailor">Tailor</option>
                                                <option value="delivery">Delivery</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">{selectedTab === 'Legal Pages' ? 'Full Content (Markdown/HTML supported)' : 'Answer Content'}</label>
                                        <textarea rows={8} value={newContent.content} onChange={e => setNewContent({ ...newContent, content: e.target.value })} placeholder="Start typing the content here..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors resize-none"></textarea>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-3xl">
                                    <button onClick={() => setIsAddContentModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                        Cancel
                                    </button>
                                    <button disabled={isSubmitting} onClick={handleCreateContent} className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Content' : 'Publish Content')}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminCMS;
