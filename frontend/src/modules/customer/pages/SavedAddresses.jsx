import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, ChevronLeft, Navigation, Home, Briefcase, Map as MapIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../../store/userStore';
import BottomNav from '../components/BottomNav';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const AddressPage = () => {
    const navigate = useNavigate();
    const { addresses, fetchAddresses, addAddress, removeAddress, updateAddress, isLoading } = useUserStore();
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Home',
        receiverName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleAdd = async (e) => {
        e.preventDefault();
        await addAddress(formData);
        setIsAdding(false);
        setFormData({ type: 'Home', receiverName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Remove this address?")) {
            await removeAddress(id);
        }
    };

    const toggleDefault = async (addr) => {
        if (addr.isDefault) return;
        await updateAddress(addr._id, { isDefault: true });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Home': return <Home size={20} />;
            case 'Work': return <Briefcase size={20} />;
            default: return <MapIcon size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-[#2D2F6E]">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-[#2D2F6E]">Saved Addresses</h1>
            </header>

            <div className="max-w-md mx-auto px-4 py-6">

                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100"
                        >
                            <h2 className="text-lg font-bold text-[#2D2F6E] mb-6">Add New Address</h2>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="flex bg-gray-50 p-1 rounded-2xl mb-4">
                                    {['Home', 'Work', 'Other'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.type === t ? 'bg-[#2D2F6E] text-white shadow-lg shadow-indigo-100' : 'text-gray-400'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <Input placeholder="Receiver Name" value={formData.receiverName} onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })} required />
                                <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                <Input placeholder="House No, Street Name" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                                    <Input placeholder="Zip Code" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} required />
                                </div>
                                <Input placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 h-14 rounded-full font-bold">Cancel</Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1 bg-[#2D2F6E] h-14 rounded-full text-white font-bold shadow-lg shadow-indigo-100">Save</Button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full p-6 dashed-border rounded-3xl flex items-center justify-center gap-3 text-[#2D2F6E] font-bold bg-white hover:bg-indigo-50 transition-colors border-2 border-dashed border-indigo-100"
                            >
                                <Plus size={20} /> Add New Address
                            </button>

                            {addresses.length === 0 && !isLoading ? (
                                <div className="text-center py-20 px-8">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <MapPin size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-400">No addresses saved</h4>
                                    <p className="text-gray-400 text-xs mt-1">Add your shipping details here.</p>
                                </div>
                            ) : (
                                addresses.map((addr) => (
                                    <div
                                        key={addr._id}
                                        onClick={() => toggleDefault(addr)}
                                        className={`bg-white p-6 rounded-3xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${addr.isDefault ? 'border-pink-500 ring-1 ring-indigo-500' : 'border-gray-100'} relative`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${addr.isDefault ? 'bg-[#2D2F6E] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {getIcon(addr.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{addr.type}</h4>
                                                        {addr.isDefault && <Check size={14} className="text-[#2D2F6E]" />}
                                                    </div>
                                                    <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                                                        <p className="font-bold text-gray-700 text-[13px]">{addr.receiverName || 'No Name'}</p>
                                                        <p>{addr.street}</p>
                                                        <p>{addr.city || 'Indore'} {addr.zipCode ? `, India - ${addr.zipCode}` : ''}</p>
                                                        <p className="mt-1 font-bold">Phone: {addr.phone}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!addr.isDefault && (
                                                    <div className="text-[10px] uppercase font-black text-[#2D2F6E] bg-indigo-50 px-3 py-1.5 rounded-md tracking-wider">
                                                        Set Default
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents setting default when deleting
                                                        handleDelete(addr._id);
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-error hover:bg-indigo-50 rounded-lg transition-all z-10"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <BottomNav />
        </div>
    );
};

export default AddressPage;
