import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import api from '../../../../utils/api';
import useGeoLocation from '../../../../hooks/useLocation';

const ServiceCard = ({ service }) => {
    const navigate = useNavigate();
    const location = useRouteLocation(); // Changed to useRouteLocation as per import alias

    const handleNavigate = () => {
        // Forward existing state (like tailor selection) to the detail page
        navigate(`/user/services/${service._id}`, { state: location.state });
    };

    return (
        <div
            onClick={handleNavigate}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                <img
                    src={service.image || 'https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=800'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {service.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
                            {tag}
                        </span>
                    )) || (
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
                            Classic
                        </span>
                    )}
                </div>
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {service.rating || 0}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{service.title}</h3>
                    <span className="font-bold text-primary">₹{service.basePrice}</span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{service.description}</p>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                    <Clock size={12} />
                    <span>Est. {service.deliveryTime || '10-15 Days'}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                    <span className="text-green-600 font-medium">Pickup Available</span>
                </div>

                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Details
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Book
                    </button>
                </div>
            </div>
        </div>
    );
};

const ServicesGrid = () => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    const routeLocation = useRouteLocation();
    const tailorId = routeLocation.state?.tailorId;

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/services', {
                    params: { tailor: tailorId }
                });
                if (response.data.success) {
                    setServices(response.data.data);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch services:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, [tailorId]);

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cataloging Services...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">All Services</h2>
            {services.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <p className="text-gray-400 font-bold text-sm">No services found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map(service => (
                        <ServiceCard key={service._id} service={service} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesGrid;
