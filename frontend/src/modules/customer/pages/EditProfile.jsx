import React, { useState } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import ImageUploader from '../../../components/Common/ImageUploader';
import { validateName, validateEmail, validatePhone } from '../../../utils/validation';

import useUserStore from '../../../store/userStore';
import toast from 'react-hot-toast';

const EditProfile = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuthStore(state => state);
    const { updateProfile, profile } = useUserStore();

    const storedUser = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const activeUser = profile || authUser || storedUser || {};

    const [formData, setFormData] = useState({
        name: activeUser.name || '',
        email: activeUser.email || '',
        phone: activeUser.phone || activeUser.phoneNumber || '',
        location: activeUser.location || '',
        profileImage: activeUser.profileImage || null
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        const nameErr = validateName(formData.name);
        if (nameErr) newErrors.name = nameErr;

        if (formData.email) {
            const emailErr = validateEmail(formData.email);
            if (emailErr) newErrors.email = emailErr;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            await updateProfile({
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phone,
                profileImage: formData.profileImage
            });
            toast.success('Profile updated successfully!');
            navigate('/user/profile');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between pt-safe">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold">Edit Profile</h1>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="p-2 text-[#843D9B] hover:bg-indigo-50 rounded-full transition-colors font-black"
                    disabled={isLoading}
                >
                    <Save size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 2. Profile Photo */}
                <div className="flex flex-col items-center">
                    <div className="w-32">
                        <ImageUploader 
                            value={formData.profileImage}
                            onChange={(file) => setFormData({ ...formData, profileImage: file })}
                        />
                    </div>
                </div>

                {/* 3. Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <User size={18} className="text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none"
                                placeholder="Enter your name"
                            />
                        </div>
                        {errors.name && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.email ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <Mail size={18} className="text-gray-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none"
                                placeholder="Enter email"
                            />
                        </div>
                        {errors.email && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                            <span className="text-[9px] font-bold text-gray-400">{formData.phone?.length || 0}/10 digits</span>
                        </div>
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.phone || (formData.phone && formData.phone.length > 0 && formData.phone.length < 10) ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <Phone size={18} className="text-gray-400" />
                            <input
                                type="tel"
                                maxLength={10}
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setFormData({ ...formData, phone: val });
                                }}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none"
                                placeholder="Enter 10-digit phone number"
                            />
                        </div>
                        {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
                            <p className="text-[10px] text-red-500 font-bold ml-2">Must be exactly 10 digits</p>
                        )}
                        {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City / Location</label>
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-[#843D9B] focus-within:bg-white transition-all">
                            <MapPin size={18} className="text-gray-400" />
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none"
                                placeholder="Enter location"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full bg-[#843D9B] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-[#1E1F4D] active:scale-95"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
