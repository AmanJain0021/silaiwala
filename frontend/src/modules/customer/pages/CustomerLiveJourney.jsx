import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { ChevronLeft, MapPin, Navigation, Bike, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../../../utils/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];
const mapContainerStyle = { width: '100%', height: '100%' };

const CustomerLiveJourney = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [directions, setDirections] = useState(null);
    const [directLine, setDirectLine] = useState(null);
    const [distance, setDistance] = useState('');
    const [eta, setEta] = useState('');
    const [error, setError] = useState(null);
    const [isArrived, setIsArrived] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');

    const mapRef = useRef(null);
    const watchIdRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data.data);
            } catch (err) {
                if (err?.name === 'CanceledError' || err?.message === 'canceled' || err?.message === 'Cancelled by a new request') {
                    return; // Ignore cancelled duplicate requests from StrictMode
                }
                console.error("Fetch Order Error:", err);
                setError(err.response?.data?.message || err.message || "Failed to fetch order details");
            }
        };
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!order || !isLoaded) return;

        const token = getToken();
        if (!token) return;

        const startTracking = () => {
            if (!navigator.geolocation) {
                setError("Geolocation is not supported by your browser");
                return;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = { lat: latitude, lng: longitude };
                    setCurrentLocation(newLocation);

                    // Update route and broadcast location
                    updateRouteAndBroadcast(newLocation);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    // Instead of failing completely, use the customer's saved address or a fallback mock location
                    console.log("Using customer address or fallback mock location.");
                    const mockLocation = (order.customerLatitude && order.customerLongitude)
                        ? { lat: Number(order.customerLatitude), lng: Number(order.customerLongitude) }
                        : { lat: 22.7246, lng: 75.8677 };
                    setCurrentLocation(mockLocation);
                    updateRouteAndBroadcast(mockLocation);
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        };

        startTracking();

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [order, isLoaded]);

    const updateRouteAndBroadcast = async (currentLoc) => {
        const vendorLat = order?.vendorLatitude ? Number(order.vendorLatitude) : 22.7196;
        const vendorLng = order?.vendorLongitude ? Number(order.vendorLongitude) : 75.8577;
        
        if (!window.google) return;
        if (isArrived) return;

        const destination = { lat: vendorLat, lng: vendorLng };
        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
            {
                origin: currentLoc,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            async (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    setDirectLine(null);
                    const leg = result.routes[0].legs[0];
                    setDistance(leg.distance.text);
                    setEta(leg.duration.text);

                    // Check if arrived (e.g., within 50 meters)
                    if (leg.distance.value <= 50) {
                        setIsArrived(true);
                    }

                    // Broadcast to backend
                    try {
                        await api.post(`/orders/${order._id}/customer-location`, {
                            latitude: currentLoc.lat,
                            longitude: currentLoc.lng,
                            distanceRemaining: leg.distance.text,
                            eta: leg.duration.text
                        });
                    } catch (err) {
                        console.error("Failed to broadcast location", err);
                    }
                } else {
                    // Fallback to TWO_WHEELER if DRIVING fails
                    directionsService.route(
                        {
                            origin: currentLoc,
                            destination: destination,
                            travelMode: window.google.maps.TravelMode.TWO_WHEELER || 'TWO_WHEELER',
                        },
                        async (result2, status2) => {
                            if (status2 === window.google.maps.DirectionsStatus.OK) {
                                setDirections(result2);
                                setDirectLine(null);
                                const leg = result2.routes[0].legs[0];
                                setDistance(leg.distance.text);
                                setEta(leg.duration.text);
                            } else {
                                console.error("Directions API failed:", status2);
                                // Fallback to a straight direct line if Directions API is unavailable/restricted
                                setDirectLine([currentLoc, destination]);
                                setDistance('Direct Route');
                                setEta('Calculating...');
                            }
                        }
                    );
                }
            }
        );
    };

    const handleMarkDelivered = () => {
        setShowOtpModal(true);
    };

    const submitOtp = async (e) => {
        if (e) e.preventDefault();
        if (!otp || otp.length !== 6) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }

        setIsUpdating(true);
        try {
            const targetStatus = ['ready-for-pickup', 'ready-for-delivery'].includes(order.status) ? 'product-delivered' : 'fabric-received';
            await api.patch(`/orders/${order._id}/status`, { status: targetStatus, otp });
            setShowOtpModal(false);
            navigate(`/user/orders/${order._id}/track`, { replace: true });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update status. Incorrect OTP?");
            setIsUpdating(false);
        }
    };

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded || !order) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Initializing Tracker...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Location Error</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={() => navigate('/user/orders')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Go Back</button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans">
            <div className="bg-white px-4 py-4 pt-safe pt-8 shadow-sm z-10 flex items-center justify-between sticky top-0 border-b border-gray-100">
                <button onClick={() => navigate('/user/orders')} className="p-2 -ml-2 rounded-full hover:bg-gray-50">
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
                <div className="text-center">
                    <h2 className="text-[14px] font-black tracking-tight text-gray-900">Your Journey to Tailor</h2>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{['ready-for-pickup', 'ready-for-delivery'].includes(order.status) ? 'Product Pickup' : 'Live GPS Broadcast'}</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 relative bg-gray-100">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={15}
                    center={currentLocation || { lat: 20.5937, lng: 78.9629 }}
                    options={{ disableDefaultUI: true, zoomControl: false, styles: [] }}
                    onLoad={map => { mapRef.current = map; }}
                >
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: true,
                                polylineOptions: { strokeColor: '#843D9B', strokeOpacity: 0.8, strokeWeight: 5 }
                            }}
                        />
                    )}
                    {directLine && !directions && (
                        <Polyline 
                            path={directLine} 
                            options={{ strokeColor: '#843D9B', strokeOpacity: 0.8, strokeWeight: 4 }} 
                        />
                    )}
                    {currentLocation && (
                        <Marker 
                            position={currentLocation} 
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: '#4f46e5',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }}
                        />
                    )}
                    <Marker 
                        position={{ 
                            lat: order.vendorLatitude ? Number(order.vendorLatitude) : 22.7196, 
                            lng: order.vendorLongitude ? Number(order.vendorLongitude) : 75.8577 
                        }} 
                        icon={{
                            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: '#000000',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                    />
                </GoogleMap>
                
                {/* Floating Stats */}
                <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-100/50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time Left</p>
                        <p className="text-lg font-black text-gray-900 leading-none">{eta || '--'}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Distance</p>
                        <p className="text-lg font-black text-gray-900 leading-none">{distance || '--'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 z-10 sticky bottom-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900">{order.tailor?.shopName || order.tailor?.name || 'Tailor Shop'}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{order.tailor?.location?.address || 'Indore, Madhya Pradesh (Fallback Address)'}</p>
                    </div>
                </div>

                <button 
                    onClick={handleMarkDelivered}
                    disabled={isUpdating}
                    className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25"
                >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={20} />}
                    {['ready-for-pickup', 'ready-for-delivery'].includes(order.status) ? 
                        (isArrived ? 'Confirm Product Received' : 'Proceeding to Shop (Collect Product)') : 
                        (isArrived ? 'Confirm Fabric Dropped' : 'Proceeding to Shop (Click to Complete)')}
                </button>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <XCircle size={20} />
                        </button>
                        
                        <div className="w-12 h-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        
                        <h3 className="text-xl font-black text-gray-900 mb-2">Dropoff Verification</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            Please ask the Tailor for the 6-digit delivery OTP to confirm you have dropped off the fabric.
                        </p>
                        
                        <form onSubmit={submitOtp}>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] mb-4 focus:outline-none focus:border-primary focus:bg-white transition-all"
                            />
                            
                            <button 
                                type="submit"
                                disabled={isUpdating || otp.length !== 6}
                                className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25"
                            >
                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Complete'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerLiveJourney;
