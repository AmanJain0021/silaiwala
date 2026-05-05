import React, { useState, useEffect } from 'react';
import { Scissors, ShoppingBag, ChevronRight, X, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import api from '../../../../utils/api';

const FabricSelector = ({ selected, onSelect, selectedFabric, onSelectFabric, tailor }) => {
    const [showFabricPicker, setShowFabricPicker] = useState(false);
    const [fabrics, setFabrics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFabrics = async () => {
            if (!tailor?._id || !showFabricPicker) return;
            
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get(`/tailors/${tailor._id}/fabrics`);
                if (response.data.success) {
                    setFabrics(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching fabrics:', err);
                setError('Failed to load fabrics. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFabrics();
    }, [tailor?._id, showFabricPicker]);

    return (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 relative">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Fabric Source</h3>

            <div className="grid grid-cols-2 gap-3">
                {/* Customer Provides */}
                <div
                    onClick={() => onSelect('customer')}
                    className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all text-center",
                        selected === 'customer' ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-2">
                        <Scissors size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-900">I will provide</p>
                    <p className="text-[10px] text-gray-500 mt-1">Pickup from your location</p>
                </div>

                {/* Platform Provides */}
                <div
                    onClick={() => {
                        onSelect('platform');
                        if (!selectedFabric && tailor) setShowFabricPicker(true);
                    }}
                    className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all text-center",
                        selected === 'platform' ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <div className="w-10 h-10 mx-auto bg-indigo-50 rounded-full flex items-center justify-center text-primary mb-2">
                        <ShoppingBag size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-900">Buy from Tailor</p>
                    <p className="text-[10px] text-gray-500 mt-1">Direct from tailor's store</p>
                </div>
            </div>

            {/* Selected Fabric Info (NEW) */}
            {selectedFabric && selected === 'platform' ? (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-primary/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        <img src={selectedFabric.image} alt={selectedFabric.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Selected Fabric</p>
                        <h4 className="text-xs font-bold text-gray-900">{selectedFabric.name}</h4>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-xs font-bold text-primary">₹{selectedFabric.price}</p>
                        <button
                            onClick={() => setShowFabricPicker(true)}
                            className="text-[9px] text-primary font-bold underline mt-1"
                        >
                            Change
                        </button>
                    </div>
                </div>
            ) : selected === 'platform' && !selectedFabric && (
                <div className="mt-4">
                    {!tailor ? (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                            <p className="text-[10px] text-amber-700 font-medium">Please select a tailor first to see their available fabrics.</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowFabricPicker(true)}
                            className="w-full p-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                        >
                            Select Fabric from {tailor.shopName || tailor.name} <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Fabric Picker Modal (Simplified) */}
            {showFabricPicker && tailor && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Fabrics by {tailor.shopName || tailor.name}</h3>
                                <p className="text-xs text-gray-500">Pick a fabric for your outfit</p>
                            </div>
                            <button onClick={() => setShowFabricPicker(false)} className="p-2 bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching Fabrics...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <p className="text-xs text-error font-medium">{error}</p>
                                    <button 
                                        onClick={() => setShowFabricPicker(false)}
                                        className="mt-4 text-[10px] font-black uppercase text-primary underline"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            ) : fabrics.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 text-xs font-medium">No fabrics available from this tailor at the moment.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {fabrics.map(fabric => (
                                        <div
                                            key={fabric._id}
                                            onClick={() => {
                                                onSelectFabric(fabric);
                                                setShowFabricPicker(false);
                                            }}
                                            className={cn(
                                                "p-2 rounded-2xl border transition-all cursor-pointer group",
                                                selectedFabric?._id === fabric._id ? "border-primary bg-primary-soft" : "border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <div className="aspect-square rounded-xl overflow-hidden mb-2 border border-gray-50">
                                                <img src={fabric.image || fabric.images?.[0]} alt={fabric.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <h4 className="text-[11px] font-bold text-gray-800 truncate">{fabric.name}</h4>
                                            <p className="text-[10px] font-bold text-primary">₹{fabric.price}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FabricSelector;
