import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, MarkerF, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation, Search, X, ChevronLeft, Map, Home, Briefcase, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useLocationStore from '../../../store/locationStore';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // New Delhi

const LocationModal = ({ isOpen, onClose }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const setStoreLocation = useLocationStore((state) => state.setLocation);
    const storeAddress = useLocationStore((state) => state.address);
    
    // View state: 'list' | 'pre-location' | 'map' | 'form'
    const [view, setView] = useState('list');
    
    // Data states
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [formattedAddress, setFormattedAddress] = useState('');
    const [addressDetails, setAddressDetails] = useState({
        flat: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        type: 'home'
    });
    
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    
    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    // Reset view when opened
    useEffect(() => {
        if (isOpen) {
            setView('list');
        }
    }, [isOpen]);

    const handleClose = () => {
        onClose();
        setTimeout(() => setView('list'), 300);
    };

    const getAddressFromCoords = async (lat, lng) => {
        setIsGeocoding(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });
            
            if (response.results[0]) {
                const result = response.results[0];
                setFormattedAddress(result.formatted_address);
                
                let city = '', state = '', pincode = '', locality = '';
                
                result.address_components.forEach(comp => {
                    if (comp.types.includes('locality')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                    if (comp.types.includes('postal_code')) pincode = comp.long_name;
                    if (comp.types.includes('sublocality_level_1') || comp.types.includes('route')) locality = comp.long_name;
                });
                
                setAddressDetails(prev => ({
                    ...prev,
                    area: locality || result.formatted_address.split(',')[0],
                    city,
                    state,
                    pincode
                }));
            }
        } catch (error) {
            console.error('Geocoding failed:', error);
            toast.error('Could not fetch address details');
        } finally {
            setIsGeocoding(false);
        }
    };

    const triggerActualLocationFlow = () => {
        setView('pre-location');
        setIsFetchingLocation(true);
        
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setIsFetchingLocation(false);
            setView('list');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = { lat: latitude, lng: longitude };
                setMapCenter(newPos);
                setMarkerPosition(newPos);
                getAddressFromCoords(latitude, longitude);
                setView('map');
                setIsFetchingLocation(false);
            },
            (error) => {
                let msg = 'Failed to get location';
                if (error.code === 1) msg = 'Location permission denied';
                if (error.code === 2) msg = 'Position unavailable';
                if (error.code === 3) msg = 'Request timeout';
                toast.error(msg);
                setIsFetchingLocation(false);
                setView('list');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleMapDragEnd = (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setMarkerPosition({ lat: newLat, lng: newLng });
        getAddressFromCoords(newLat, newLng);
    };

    const handleMapClick = (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setMapCenter({ lat: newLat, lng: newLng });
        setMarkerPosition({ lat: newLat, lng: newLng });
        getAddressFromCoords(newLat, newLng);
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                const newPos = { lat: newLat, lng: newLng };
                setMapCenter(newPos);
                setMarkerPosition(newPos);
                
                setFormattedAddress(place.formatted_address);
                
                let city = '', state = '', pincode = '', locality = '';
                place.address_components?.forEach(comp => {
                    if (comp.types.includes('locality')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                    if (comp.types.includes('postal_code')) pincode = comp.long_name;
                    if (comp.types.includes('sublocality_level_1') || comp.types.includes('route')) locality = comp.long_name;
                });
                
                setAddressDetails(prev => ({
                    ...prev,
                    area: locality || place.name,
                    city,
                    state,
                    pincode
                }));
            }
        }
    };

    const handleConfirmLocation = () => {
        if (!formattedAddress) {
            toast.error('Please select a valid location');
            return;
        }
        setView('form');
    };

    const handleSaveAddress = () => {
        if (!addressDetails.flat || !addressDetails.area) {
            toast.error('Please fill all required fields');
            return;
        }
        
        const finalAddress = `${addressDetails.flat}, ${formattedAddress}`;
        
        // Save to store
        setStoreLocation(finalAddress, markerPosition.lat, markerPosition.lng);
        toast.success('Address saved successfully!');
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans text-gray-900">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-white sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden"
                    style={{ height: '90vh', maxHeight: '750px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 z-10 bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                            {view !== 'list' && (
                                <button 
                                    onClick={() => setView(view === 'form' ? 'map' : 'list')}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <h2 className="text-lg font-black tracking-tight">
                                {view === 'list' ? 'Select Location' : 
                                 view === 'map' ? 'Confirm Location' : 
                                 view === 'form' ? 'Enter Details' : 'Enable Location'}
                            </h2>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto relative bg-gray-50/50">
                        
                        {/* LIST VIEW */}
                        {view === 'list' && (
                            <div className="p-4 sm:p-6 space-y-6">
                                <div className="space-y-3">
                                    <button 
                                        onClick={triggerActualLocationFlow}
                                        className="w-full flex items-center gap-4 p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#843D9B] shadow-sm group-hover:scale-110 transition-transform">
                                            <Navigation size={18} className="fill-[#843D9B]/10" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[#843D9B]">Use Current Location</h3>
                                            <p className="text-xs text-indigo-900/60 font-medium">Using GPS</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setView('map')}
                                        className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl transition-all group text-left shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 shadow-sm group-hover:scale-110 transition-transform border border-gray-100">
                                            <Map size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900">Add New Address</h3>
                                            <p className="text-xs text-gray-500 font-medium">Search on map</p>
                                        </div>
                                        <div className="ml-auto p-1.5 bg-gray-100 rounded-full">
                                            <Plus size={16} className="text-gray-500" />
                                        </div>
                                    </button>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Saved Addresses</h4>
                                    
                                    {/* Placeholder for saved addresses */}
                                    <div className="space-y-3">
                                        <button className="w-full flex items-start gap-4 p-4 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all text-left shadow-sm">
                                            <div className="mt-0.5 text-gray-400">
                                                <Home size={18} />
                                            </div>
                                            <div className="flex-1 pr-4">
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    Home
                                                    {storeAddress === 'Srinagar, Kashmir - 190001' && <span className="bg-[#843D9B]/10 text-[#843D9B] text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Active</span>}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">
                                                    {storeAddress || 'Srinagar, Kashmir - 190001'}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRE-LOCATION LOADING VIEW */}
                        {view === 'pre-location' && (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin"></div>
                                    <MapPin size={32} className="text-[#843D9B] animate-pulse" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Locating you...</h3>
                                <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Please allow location permissions when prompted by your browser to find your exact address.</p>
                            </div>
                        )}

                        {/* MAP VIEW */}
                        {view === 'map' && (
                            <div className="h-full flex flex-col relative bg-gray-100">
                                {/* Autocomplete Search Bar */}
                                <div className="absolute top-4 left-4 right-4 z-10">
                                    {isLoaded && (
                                        <Autocomplete onLoad={ref => autocompleteRef.current = ref} onPlaceChanged={onPlaceChanged}>
                                            <div className="relative shadow-lg rounded-2xl">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Search size={18} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search for area, street name..."
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white border-0 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#843D9B]"
                                                />
                                            </div>
                                        </Autocomplete>
                                    )}
                                </div>

                                {/* Map */}
                                <div className="flex-1 w-full relative bg-gray-200">
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={mapCenter}
                                            zoom={16}
                                            options={{
                                                disableDefaultUI: true,
                                                zoomControl: true,
                                                clickableIcons: false
                                            }}
                                            onClick={handleMapClick}
                                            onLoad={map => mapRef.current = map}
                                        >
                                            <MarkerF 
                                                position={markerPosition} 
                                                draggable={true}
                                                onDragEnd={handleMapDragEnd}
                                                animation={window.google.maps.Animation.DROP}
                                            />
                                        </GoogleMap>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#843D9B]" />
                                        </div>
                                    )}
                                </div>

                                {/* Location Details Footer */}
                                <div className="bg-white p-5 sm:p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative z-20">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="mt-1 p-2 bg-indigo-50 rounded-full text-[#843D9B]">
                                            <MapPin size={20} className="fill-[#843D9B]/20" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Selected Location</h3>
                                            {isGeocoding ? (
                                                <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4 mb-1"></div>
                                            ) : (
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{addressDetails.area || 'Unknown Area'}</h4>
                                            )}
                                            
                                            {isGeocoding ? (
                                                <div className="h-4 bg-gray-50 rounded animate-pulse w-full mt-1"></div>
                                            ) : (
                                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{formattedAddress || 'Move pin to find address'}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleConfirmLocation}
                                        disabled={!formattedAddress || isGeocoding}
                                        className="w-full py-3.5 bg-[#843D9B] text-white text-xs font-black rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-indigo-900/20 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm Location
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* FORM VIEW */}
                        {view === 'form' && (
                            <div className="p-4 sm:p-6 pb-24 space-y-6">
                                {/* Map Snippet Preview */}
                                <div className="h-24 rounded-2xl overflow-hidden relative border border-gray-200">
                                    {isLoaded && (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={markerPosition}
                                            zoom={16}
                                            options={{ disableDefaultUI: true, draggable: false, keyboardShortcuts: false }}
                                        >
                                            <MarkerF position={markerPosition} />
                                        </GoogleMap>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent flex items-end p-3">
                                        <p className="text-xs font-bold text-gray-900 truncate pr-8">{formattedAddress}</p>
                                    </div>
                                    <button onClick={() => setView('map')} className="absolute top-2 right-2 px-3 py-1 bg-white text-[9px] font-black text-[#843D9B] uppercase tracking-widest rounded-lg shadow-sm border border-gray-100">
                                        Change
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">House / Flat / Block No. *</label>
                                        <input 
                                            type="text" 
                                            value={addressDetails.flat}
                                            onChange={e => setAddressDetails({...addressDetails, flat: e.target.value})}
                                            placeholder="e.g. Flat 402, Block A" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] transition-all shadow-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Apartment / Road / Area</label>
                                        <input 
                                            type="text" 
                                            value={addressDetails.area}
                                            onChange={e => setAddressDetails({...addressDetails, area: e.target.value})}
                                            placeholder="e.g. Film Colony Rd" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] transition-all shadow-sm" 
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2.5">Save As</label>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setAddressDetails({...addressDetails, type: 'home'})}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black tracking-wider transition-all ${addressDetails.type === 'home' ? 'bg-indigo-50 border-[#843D9B] text-[#843D9B]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <Home size={14} /> Home
                                            </button>
                                            <button 
                                                onClick={() => setAddressDetails({...addressDetails, type: 'work'})}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black tracking-wider transition-all ${addressDetails.type === 'work' ? 'bg-indigo-50 border-[#843D9B] text-[#843D9B]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <Briefcase size={14} /> Work
                                            </button>
                                            <button 
                                                onClick={() => setAddressDetails({...addressDetails, type: 'other'})}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black tracking-wider transition-all ${addressDetails.type === 'other' ? 'bg-indigo-50 border-[#843D9B] text-[#843D9B]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <MapPin size={14} /> Other
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer for Form View */}
                    {view === 'form' && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-gray-100 z-20">
                            <button 
                                onClick={handleSaveAddress}
                                className="w-full py-3.5 bg-[#843D9B] text-white text-xs font-black rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-indigo-900/20 transition-all uppercase tracking-widest"
                            >
                                Save Address & Proceed
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LocationModal;
