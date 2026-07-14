import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, User, Navigation, Phone, Clock, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/constants';
import { getToken } from '../../utils/auth';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];
const mapContainerStyle = { width: '100%', height: '100%', minHeight: '250px' };

const CustomerDropoffTracker = ({ order }) => {
    const [customerLocation, setCustomerLocation] = useState(null);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [socket, setSocket] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });
        
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('joinOrderRoom', order._id || order.id);
        });

        newSocket.on('locationUpdated', (data) => {
            if (data.orderId === (order._id || order.id)) {
                setCustomerLocation({ lat: data.currentLocation.latitude, lng: data.currentLocation.longitude });
                if (data.eta) setEta(data.eta);
                if (data.distanceRemaining) setDistance(data.distanceRemaining);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [order]);

    if (!isLoaded) {
        return (
            <div className="w-full h-[250px] bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    const destination = order.tailor?.location?.coordinates && order.tailor.location.coordinates.length >= 2
        ? { lat: Number(order.tailor.location.coordinates[1]), lng: Number(order.tailor.location.coordinates[0]) }
        : { lat: 22.7196, lng: 75.8577 }; // fallback

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mt-4">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900">Customer Dropoff</h4>
                        <p className="text-xs font-medium text-gray-500">Live Location Tracking</p>
                    </div>
                </div>
                {eta && (
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 text-blue-600 justify-end mb-0.5">
                            <Clock size={14} />
                            <span className="text-sm font-black">{eta}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{distance || 'Approaching'}</p>
                    </div>
                )}
            </div>
            
            <div className="relative h-[250px] w-full">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={customerLocation || destination}
                    zoom={15}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {/* Tailor Shop Marker */}
                    <Marker 
                        position={destination}
                        icon={{
                            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: '#843D9B',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                    />
                    
                    {/* Customer Live Marker */}
                    {customerLocation && (
                        <Marker 
                            position={customerLocation}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: '#2563EB',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                            }}
                        />
                    )}
                </GoogleMap>
                
                {!customerLocation && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <Navigation size={24} className="text-gray-400 mb-2 animate-bounce" />
                        <p className="text-sm font-black text-gray-600">Waiting for customer's GPS...</p>
                        <p className="text-xs text-gray-500 mt-1">They will appear here once they start the trip</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDropoffTracker;
