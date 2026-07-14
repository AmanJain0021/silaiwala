import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

/**
 * Shared Google Places Autocomplete input field using native Google Maps Autocomplete widget
 */
const PlacesAutocompleteField = ({ 
    label, 
    name, 
    placeholder, 
    required, 
    value, 
    error, 
    onChange, 
    onClear,
    onPlaceSelect 
}) => {
    const [autocomplete, setAutocomplete] = useState(null);

    const onLoad = (autoC) => {
        autoC.setComponentRestrictions({ country: 'in' });
        setAutocomplete(autoC);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                let city = '';
                let state = '';
                let pincode = '';
                
                place.address_components?.forEach((component) => {
                    const types = component.types;
                    if (types.includes('locality')) city = component.long_name;
                    if (types.includes('administrative_area_level_1')) state = component.long_name;
                    if (types.includes('postal_code')) pincode = component.long_name;
                });
                
                const address = place.formatted_address || place.name;
                onChange(address);
                
                onPlaceSelect({
                    address,
                    city,
                    state,
                    pincode,
                    latitude: lat,
                    longitude: lng,
                });
            } else {
                // User just typed a place name and hit enter without selecting
                onChange(place.name || '');
            }
        }
    };

    return (
        <div className="mb-3 relative z-[100]">
            {label && (
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                    {label} {required && "*"}
                </label>
            )}
            <div className="relative flex items-center">
                <MapPin size={14} className="absolute left-3 text-indigo-400 z-10 pointer-events-none" />
                
                <div className="w-full relative">
                    {/* The Autocomplete wrapper is transparent, we render the input inside */}
                    <Autocomplete
                        onLoad={onLoad}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => {
                                // Prevent form submission when pressing enter to select a place
                                if (e.key === 'Enter') e.preventDefault();
                            }}
                            className={`w-full text-xs font-semibold p-2.5 pl-9 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                                error
                                    ? "border-red-300 focus:border-red-500 bg-indigo-50"
                                    : "border-gray-200 focus:border-primary bg-gray-50/50 focus:bg-white"
                            }`}
                            style={{ paddingRight: value ? '2rem' : '0.75rem' }}
                        />
                    </Autocomplete>
                </div>

                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            if (onClear) onClear();
                            else onChange('');
                        }}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 z-10"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {error && <span className="text-[9px] text-error font-medium ml-1">{error}</span>}
        </div>
    );
};

export default PlacesAutocompleteField;
