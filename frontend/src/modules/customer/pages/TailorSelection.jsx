import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import useCheckoutStore from '../../../store/checkoutStore';
import useLocationStore from '../../../store/locationStore';
import SafeImage from '../../../components/Common/SafeImage';

const TailorSelection = () => {
    const navigate = useNavigate();
    const { serviceDetails, configuration, pricing, setTailor, isBuyNowMode, buyNowItem } = useCheckoutStore();
    const [tailors, setTailors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { coordinates } = useLocationStore();

    useEffect(() => {
        const fetchTailors = async () => {
            try {
                const response = await api.get('/customers/tailors');
                if (response.data.success) {
                    setTailors(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching tailors for selection:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTailors();
    }, []);

    const handleSelectTailor = (tailor) => {
        // We use the tailor's User ID for the order assignment in the backend
        const tailorUserId = tailor.user?._id || tailor.user?.id || tailor._id;

        setTailor(tailorUserId, tailor.shopName || tailor.user?.name);
        navigate('/user/checkout/address');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 size={32} className="text-[#2D2F6E] animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finding Available Tailors...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#2D2F6E] text-white px-4 py-4 flex items-center gap-3 pt-safe">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Select a Tailor</h1>
                    <p className="text-[10px] text-gray-100">Choose an expert for your {(isBuyNowMode ? buyNowItem?.serviceDetails?.title : serviceDetails?.title) || 'service'}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white px-6 py-6 flex justify-between items-center border-b border-gray-100">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#2D2F6E] text-white text-[10px] flex items-center justify-center font-bold">1</div>
                    <span className="text-[10px] font-bold text-[#2D2F6E]">Service</span>
                </div>
                <div className="h-px bg-[#2D2F6E] flex-1 mx-4"></div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#2D2F6E] text-white text-[10px] flex items-center justify-center font-bold animate-pulse">2</div>
                    <span className="text-[10px] font-bold text-[#2D2F6E]">Tailor</span>
                </div>
                <div className="h-px bg-gray-200 flex-1 mx-4"></div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center font-bold">3</div>
                    <span className="text-[10px] font-bold text-gray-400">Review</span>
                </div>
            </div>

            {/* Tailor List */}
            <div className="p-4 space-y-4 max-w-4xl mx-auto md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {tailors.length > 0 ? tailors.map(tailor => (
                    <div
                        key={tailor._id}
                        onClick={() => handleSelectTailor(tailor)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                            <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName || tailor.user?.name} className="w-full h-full" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#2D2F6E] transition-colors">{tailor.shopName || tailor.user?.name}</h3>
                            <p className="text-[10px] text-[#2D2F6E] font-bold mb-1">{tailor.specializations?.[0] || 'Expert Tailor'}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400" /> {tailor.rating || 0}</span>
                                <span className="flex items-center gap-0.5"><MapPin size={10} /> {tailor.distance || 'Near You'}</span>
                                <span className="font-bold text-[#2D2F6E] bg-indigo-50 px-1 py-0.5 rounded text-[8px]">{tailor.experienceInYears || 0}Y Exp</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 mr-1" />
                    </div>
                )) : (
                    <div className="py-20 text-center opacity-40">
                        <p className="text-sm font-bold uppercase tracking-widest">No available tailors found</p>
                    </div>
                )}
            </div>

            {/* Info Message */}
            <div className="mx-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] text-blue-700 leading-relaxed">
                    <span className="font-bold">Note:</span> You are manually selecting a tailor. Their specific stitching quality and style will be reflected in your final outfit.
                </p>
            </div>
        </div>
    );
};

export default TailorSelection;
