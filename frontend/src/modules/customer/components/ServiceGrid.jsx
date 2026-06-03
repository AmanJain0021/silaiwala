import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Star, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import SafeImage from '../../../components/Common/SafeImage';

const ServiceGrid = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                if (response.data.success) {
                    // Just take top 4 for the home grid
                    setServices(response.data.data.slice(0, 4));
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Error fetching popular services:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    if (isLoading) {
        return (
            <div className="px-4 py-8 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-[#2D2F6E]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finding Best Designs...</p>
            </div>
        );
    }

    if (services.length === 0) return null;

    return (
        <div className="px-4 md:px-6 lg:px-8 py-2">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Popular Services</h2>
                    <p className="text-xs text-gray-500">Custom fitted for you</p>
                </div>
                <Link to="/user/services" state={location.state} className="text-xs font-semibold text-[#2D2F6E] flex items-center gap-1 hover:underline">
                    View All <ArrowRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {services.map((service) => (
                    <div
                        key={service._id}
                        onClick={() => navigate(`/user/services/${service._id}`, { state: location.state })}
                        className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-gray-50">
                            <SafeImage
                                src={service.image}
                                alt={service.title}
                                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm">
                                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                {service.rating || 0}
                            </div>
                        </div>
                        <div className="px-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{service.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">Starts from <span className="font-bold text-[#2D2F6E]">₹{service.basePrice}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceGrid;
