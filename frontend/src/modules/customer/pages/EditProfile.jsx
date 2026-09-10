import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Navigation, Map, Loader2, X, Search, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import useAuthStore from '../../../store/authStore';
import ImageUploader from '../../../components/Common/ImageUploader';
import { validateName, validateEmail, validatePhone } from '../../../utils/validation';

import useUserStore from '../../../store/userStore';
import useLocationStore from '../../../store/locationStore';
import LocationModal from '../components/LocationModal';
import toast from 'react-hot-toast';
import api from '../../../utils/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const EditProfile = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuthStore(state => state);
    const { updateProfile, profile } = useUserStore();
    const storeAddress = useLocationStore((state) => state.address);

    const { isLoaded: isGoogleLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const storedUser = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const activeUser = React.useMemo(() => {
        const merged = {
            ...(storedUser || {}),
            ...(authUser || {}),
            ...(profile || {})
        };
        const rawImg = merged.profileImage || merged.user?.profileImage || merged.profile?.profileImage || authUser?.profileImage || authUser?.user?.profileImage || storedUser?.profileImage || null;
        return {
            ...merged,
            profileImage: typeof rawImg === 'string' ? rawImg : null
        };
    }, [profile, authUser, storedUser]);

    const [formData, setFormData] = useState({
        name: activeUser.name || '',
        email: activeUser.email || '',
        phone: activeUser.phone || activeUser.phoneNumber || '',
        location: activeUser.location || '',
        profileImage: activeUser.profileImage || null
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Location Suggestions State
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    const searchDebounceRef = useRef(null);

    // Sync selected address from LocationModal / LocationStore
    useEffect(() => {
        if (storeAddress) {
            const formatted = typeof storeAddress === 'string' 
                ? storeAddress 
                : (storeAddress.area || storeAddress.city || storeAddress.formatted_address || '');
            if (formatted) {
                setFormData(prev => ({ ...prev, location: formatted }));
            }
        }
    }, [storeAddress]);

    // Close suggestions dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search location suggestions (Google Places + OpenStreetMap fallback)
    const fetchLocationSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setLocationSuggestions([]);
            setIsSearchingLocation(false);
            return;
        }

        setIsSearchingLocation(true);

        const tryNominatim = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.map((item) => {
                        const parts = (item.display_name || '').split(', ');
                        const mainText = parts[0] || item.name || item.display_name;
                        const secondaryText = parts.slice(1, 4).join(', ');
                        return {
                            description: item.display_name,
                            mainText,
                            secondaryText,
                            lat: item.lat ? parseFloat(item.lat) : undefined,
                            lng: item.lon ? parseFloat(item.lon) : undefined,
                        };
                    });
                    setLocationSuggestions(mapped);
                    setShowSuggestions(true);
                } else {
                    setLocationSuggestions([]);
                }
            } catch (err) {
                console.warn('Nominatim search failed:', err);
                setLocationSuggestions([]);
            } finally {
                setIsSearchingLocation(false);
            }
        };

        // Try Google Places Autocomplete first if loaded and available
        if (window.google?.maps?.places?.AutocompleteService) {
            try {
                const service = new window.google.maps.places.AutocompleteService();
                service.getPlacePredictions(
                    {
                        input: query,
                        componentRestrictions: { country: 'in' },
                    },
                    (predictions, status) => {
                        if (status === 'OK' && predictions && predictions.length > 0) {
                            const mapped = predictions.map((p) => ({
                                description: p.description,
                                mainText: p.structured_formatting?.main_text || p.description,
                                secondaryText: p.structured_formatting?.secondary_text || '',
                                placeId: p.place_id
                            }));
                            setLocationSuggestions(mapped);
                            setShowSuggestions(true);
                            setIsSearchingLocation(false);
                        } else {
                            tryNominatim();
                        }
                    }
                );
                return;
            } catch (e) {
                tryNominatim();
            }
        } else {
            tryNominatim();
        }
    }, []);

    const handleLocationInputChange = (val) => {
        setFormData(prev => ({ ...prev, location: val }));
        setShowSuggestions(true);

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (!val || val.trim().length < 2) {
            setLocationSuggestions([]);
            setIsSearchingLocation(false);
            return;
        }

        setIsSearchingLocation(true);
        searchDebounceRef.current = setTimeout(() => {
            fetchLocationSuggestions(val);
        }, 200);
    };

    const handleSelectSuggestion = (suggestion) => {
        const addressText = suggestion.description || suggestion.mainText;
        setFormData(prev => ({ ...prev, location: addressText }));
        setShowSuggestions(false);
        setLocationSuggestions([]);

        if (suggestion.placeId && window.google?.maps?.places?.PlacesService) {
            try {
                const dummyDiv = document.createElement('div');
                const placesService = new window.google.maps.places.PlacesService(dummyDiv);
                placesService.getDetails({ placeId: suggestion.placeId, fields: ['geometry', 'formatted_address'] }, (place, status) => {
                    if (status === 'OK' && place?.geometry?.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        useLocationStore.getState().setLocation(place.formatted_address || addressText, lat, lng);
                    }
                });
            } catch (e) {}
        } else if (suggestion.lat && suggestion.lng) {
            try {
                useLocationStore.getState().setLocation(addressText, suggestion.lat, suggestion.lng);
            } catch (e) {}
        }
    };

    const handleDetectLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    let detectedAddress = '';

                    // 1. Google Maps Geocoder if available
                    if (window.google && window.google.maps && window.google.maps.Geocoder) {
                        try {
                            const geocoder = new window.google.maps.Geocoder();
                            const res = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
                            if (res.results?.[0]) {
                                detectedAddress = res.results[0].formatted_address;
                            }
                        } catch (e) {
                            console.warn('Google Geocoder failed:', e);
                        }
                    }

                    // 2. BigDataCloud reverse geocode fallback
                    if (!detectedAddress) {
                        try {
                            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                            const data = await res.json();
                            if (data) {
                                const parts = [data.locality || data.city, data.principalSubdivision, data.countryName].filter(Boolean);
                                if (parts.length > 0) detectedAddress = parts.join(', ');
                            }
                        } catch (e) {
                            console.warn('BigDataCloud reverse geocode failed:', e);
                        }
                    }

                    // 3. Nominatim OpenStreetMap fallback
                    if (!detectedAddress) {
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                            const data = await res.json();
                            if (data?.display_name) {
                                detectedAddress = data.display_name;
                            }
                        } catch (e) {
                            console.warn('Nominatim reverse geocode failed:', e);
                        }
                    }

                    const finalLocation = detectedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setFormData(prev => ({ ...prev, location: finalLocation }));
                    toast.success('Current location fetched!');
                } catch (err) {
                    toast.error('Failed to fetch location address');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                if (error.code === 1) {
                    toast.error('Location access denied by browser');
                } else {
                    toast.error('Could not retrieve current GPS position');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

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
            let uploadedImageUrl = typeof formData.profileImage === 'string' ? formData.profileImage : undefined;

            if (formData.profileImage instanceof File || (formData.profileImage && typeof formData.profileImage === 'object' && formData.profileImage.name)) {
                const uploadData = new FormData();
                uploadData.append('file', formData.profileImage);
                const uploadRes = await api.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data?.success) {
                    uploadedImageUrl = uploadRes.data.data;
                }
            }

            await updateProfile({
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phone,
                location: formData.location,
                profileImage: uploadedImageUrl
            });

            const updateUser = useAuthStore.getState().updateUser;
            if (updateUser) {
                updateUser({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    location: formData.location,
                    ...(uploadedImageUrl && { profileImage: uploadedImageUrl })
                });
            }

            toast.success('Profile updated successfully!');
            navigate('/user/profile');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to update profile');
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
                    <ImageUploader 
                        compact
                        value={formData.profileImage}
                        onChange={(file) => setFormData({ ...formData, profileImage: file })}
                    />
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

                    <div className="space-y-1.5" ref={suggestionsRef}>
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City / Location</label>
                            <button
                                type="button"
                                onClick={() => setShowLocationModal(true)}
                                className="text-[10px] font-extrabold text-[#843D9B] hover:underline flex items-center gap-1 uppercase tracking-wider"
                            >
                                <Map size={11} /> Select on Map
                            </button>
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 focus-within:border-[#843D9B] focus-within:bg-white transition-all">
                                <MapPin size={18} className="text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleLocationInputChange(e.target.value)}
                                    onFocus={() => {
                                        if (locationSuggestions.length > 0) setShowSuggestions(true);
                                    }}
                                    className="bg-transparent text-sm font-bold w-full focus:outline-none pr-28"
                                    placeholder="Type city, area, or address..."
                                />
                                
                                {formData.location && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, location: '' }));
                                            setLocationSuggestions([]);
                                            setShowSuggestions(false);
                                        }}
                                        className="absolute right-24 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleDetectLocation}
                                    disabled={isLocating}
                                    className="absolute right-2 px-3 py-1.5 bg-[#843D9B] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#6B2F7E] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {isLocating ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            GPS...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={12} />
                                            Current
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Floating Location Suggestions Dropdown */}
                            {showSuggestions && (isSearchingLocation || locationSuggestions.length > 0) && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-purple-100 shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {isSearchingLocation && (
                                        <div className="p-3.5 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                                            <Loader2 size={14} className="animate-spin text-[#843D9B]" />
                                            <span>Finding location suggestions...</span>
                                        </div>
                                    )}

                                    {locationSuggestions.map((suggestion, idx) => (
                                        <div
                                            key={`loc-${idx}`}
                                            onClick={() => handleSelectSuggestion(suggestion)}
                                            className="p-3 hover:bg-purple-50/50 cursor-pointer transition-colors flex items-start gap-2.5 text-left group"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                                <MapPin size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-gray-900 group-hover:text-[#843D9B] transition-colors truncate">
                                                    {suggestion.mainText}
                                                </p>
                                                {suggestion.secondaryText && (
                                                    <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                                        {suggestion.secondaryText}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full bg-[#843D9B] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-[#6B2F7E] active:scale-95"
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

            {showLocationModal && (
                <LocationModal
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                />
            )}
        </div>
    );
};

export default EditProfile;
