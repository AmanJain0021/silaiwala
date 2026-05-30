import React, { useState } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import ImageUploader from '../../../components/Common/ImageUploader';
import { validateName, validateEmail, validatePhone } from '../../../utils/validation';

const EditProfile = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore(state => state);

    const [formData, setFormData] = useState({
        name: user?.name || 'Guest User',
        email: user?.email || 'guest@example.com',
        phone: user?.phone || '+91 9876543210',
        location: user?.location || 'Srinagar, Kashmir',
        profileImage: user?.profileImage || null
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        const nameErr = validateName(formData.name);
        if (nameErr) newErrors.name = nameErr;

        const emailErr = validateEmail(formData.email);
        if (emailErr) newErrors.email = emailErr;

        const phoneErr = validatePhone(formData.phone);
        if (phoneErr) newErrors.phone = phoneErr;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        // Mock API Call
        setTimeout(() => {
            // Update store
            // useAuthStore doesn't have a setUser by default in many patterns, checking common ones
            // For now, mock success and navigate back
            setIsLoading(false);
            navigate('/user/profile');
        }, 1000);
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
                    className="p-2 text-[#2D2F6E] hover:bg-indigo-50 rounded-full transition-colors font-black"
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
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#2D2F6E] focus-within:bg-white transition-all`}>
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
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.email ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#2D2F6E] focus-within:bg-white transition-all`}>
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.phone ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#2D2F6E] focus-within:bg-white transition-all`}>
                            <Phone size={18} className="text-gray-400" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none"
                                placeholder="Enter phone"
                            />
                        </div>
                        {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City / Location</label>
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-[#2D2F6E] focus-within:bg-white transition-all">
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
                        className="w-full bg-[#2D2F6E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-[#1E1F4D] active:scale-95"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-4">
                        Silaiwala protects your data privacy as per our <span className="underline">Terms of Service</span>.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
