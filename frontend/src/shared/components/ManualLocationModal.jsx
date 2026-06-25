import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import PlacesAutocompleteField from './PlacesAutocompleteField';

const ManualLocationModal = ({ isOpen, onClose, onLocationSet }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSet(selectedLocation);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-indigo-600 h-5 w-5" />
                        Set Location Manually
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5">
                    <p className="text-sm text-gray-500 mb-4">
                        Search for your address or area to set your precise location for live tracking and assignments.
                    </p>
                    
                    <PlacesAutocompleteField
                        placeholder="Search area, landmark or street..."
                        onPlaceSelect={(place) => setSelectedLocation(place)}
                        onClear={() => setSelectedLocation(null)}
                    />
                    
                    {selectedLocation && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
                            <strong>Selected:</strong> {selectedLocation.address}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedLocation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualLocationModal;
