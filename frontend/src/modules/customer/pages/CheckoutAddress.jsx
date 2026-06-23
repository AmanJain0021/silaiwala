import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Plus, ArrowRight, MapPin } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAddressStore from '../../../store/userStore';
import AddressCard from '../components/checkout/address/AddressCard';
import AddressForm from '../components/checkout/address/AddressForm';
import { cn } from '../../../utils/cn';

const CheckoutAddress = () => {
    const navigate = useNavigate();
    const { addresses, selectedAddressId, selectAddress, fetchAddresses } = useAddressStore();

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const handleSelect = (id) => {
        selectAddress(id);
    };

    const location = useLocation();

    const handleProceed = () => {
        if (selectedAddressId) {
            if (location.state?.returnUrl) {
                navigate(location.state.returnUrl, { state: { restoredState: location.state.restoredState } });
            } else {
                navigate('/user/checkout/summary'); // Next step (Step 4)
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            {/* 1. Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-end gap-3 pb-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm font-bold text-gray-900">Select Address</h1>
                    <p className="text-[10px] text-gray-500">Step 2 of 3</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* 2. Add New Button */}
                {!isAddingNew && (
                    <button
                        onClick={() => setIsAddingNew(true)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-dashed border-gray-300 hover:border-[#843D9B] group transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#843D9B] flex items-center justify-center group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                <Plus size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-gray-900">Add New Address</h3>
                                <p className="text-[10px] text-gray-500 group-hover:text-[#843D9B]">For Pickup & Delivery</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-[#843D9B]" />
                    </button>
                )}

                {/* 3. Logic: Show Form OR List */}
                {(isAddingNew || editingAddress) ? (
                    <div className="mt-2">
                        <AddressForm
                            initialData={editingAddress}
                            onCancel={() => {
                                setIsAddingNew(false);
                                setEditingAddress(null);
                            }}
                            onSuccess={() => {
                                setIsAddingNew(false);
                                setEditingAddress(null);
                            }}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MapPin size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">No Saved Addresses</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">Please add a new address to continue with your order.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Saved Addresses</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <AddressCard
                                            key={addr._id}
                                            address={addr}
                                            isSelected={selectedAddressId === addr._id}
                                            onSelect={() => handleSelect(addr._id)}
                                            onEdit={() => setEditingAddress(addr)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Solid Sticky Footer */}
            {!(isAddingNew || editingAddress) && (
                <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-4 bg-white border-t border-gray-100 z-40">
                    <button
                        onClick={handleProceed}
                        disabled={!selectedAddressId}
                        className={cn(
                            "w-full py-3.5 rounded-full text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2",
                            selectedAddressId
                                ? "bg-[#843D9B] text-white active:scale-[0.98] shadow-[#843D9B]/20"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        {location.state?.returnUrl ? "Confirm Address" : "Proceed to Order Summary"} <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CheckoutAddress;
