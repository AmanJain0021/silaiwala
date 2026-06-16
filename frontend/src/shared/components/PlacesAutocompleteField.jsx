import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';

/**
 * Shared Google Places Autocomplete input field
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
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const sessionTokenRef = useRef(null);

    // Initialize Google Places Autocomplete service
    useEffect(() => {
        if (window.google?.maps?.places) {
            autocompleteRef.current = new window.google.maps.places.AutocompleteService();
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
    }, []);

    const fetchSuggestions = useCallback((inputValue) => {
        if (!autocompleteRef.current || !inputValue || inputValue.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        autocompleteRef.current.getPlacePredictions(
            {
                input: inputValue,
                componentRestrictions: { country: 'in' },
                sessionToken: sessionTokenRef.current,
            },
            (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        );
    }, []);

    const handleSelectPlace = useCallback((placeId, description) => {
        setShowSuggestions(false);
        setSuggestions([]);

        // Use PlacesService to get full place details with coordinates
        const placesService = new window.google.maps.places.PlacesService(
            document.createElement('div')
        );

        placesService.getDetails(
            {
                placeId: placeId,
                fields: ['geometry', 'address_components', 'formatted_address'],
                sessionToken: sessionTokenRef.current,
            },
            (place, status) => {
                // Create a new session token after a selection
                sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    // Extract address components
                    let city = '';
                    let state = '';
                    let pincode = '';

                    place.address_components?.forEach((component) => {
                        const types = component.types;
                        if (types.includes('locality')) {
                            city = component.long_name;
                        }
                        if (types.includes('administrative_area_level_1')) {
                            state = component.long_name;
                        }
                        if (types.includes('postal_code')) {
                            pincode = component.long_name;
                        }
                    });

                    onPlaceSelect({
                        address: place.formatted_address || description,
                        city,
                        state,
                        pincode,
                        latitude: lat,
                        longitude: lng,
                    });
                }
            }
        );
    }, [onPlaceSelect]);

    return (
        <div className="mb-3 relative">
            {label && (
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                    {label} {required && "*"}
                </label>
            )}
            <div className="relative flex items-center">
                <MapPin size={14} className="absolute left-3 text-indigo-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val);
                        fetchSuggestions(val);
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className={`w-full text-xs font-semibold p-2.5 pl-9 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                        error
                            ? "border-red-300 focus:border-red-500 bg-indigo-50"
                            : "border-gray-200 focus:border-primary bg-gray-50/50 focus:bg-white"
                    }`}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            if (onClear) onClear();
                            setSuggestions([]);
                            setShowSuggestions(false);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {error && <span className="text-[9px] text-error font-medium ml-1">{error}</span>}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.place_id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectPlace(suggestion.place_id, suggestion.description)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3 group"
                        >
                            <MapPin size={14} className="text-indigo-400 mt-0.5 shrink-0 group-hover:text-indigo-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">
                                    {suggestion.structured_formatting?.main_text}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                    {suggestion.structured_formatting?.secondary_text}
                                </p>
                            </div>
                        </button>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 text-[9px] text-gray-400 font-bold flex items-center gap-1.5">
                        <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" className="h-3" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacesAutocompleteField;
