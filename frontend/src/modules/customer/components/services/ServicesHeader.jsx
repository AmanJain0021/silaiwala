import React from 'react';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../../../components/ui/Input';

const ServicesHeader = () => {
    return (
        <div className="sticky top-0 md:top-20 z-[100] bg-white border-b border-gray-100 shadow-sm px-4 pb-4 transition-all duration-300">
            {/* Top Bar - Mobile Only */}
            <div className="flex items-center gap-3 pt-3 mb-3 md:hidden">
                <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700 active:scale-90 transition-transform">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-black text-[#2D2F6E] tracking-tight">Stitching Services</h1>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        className="pl-9 h-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white text-sm"
                        placeholder="Search Kurti, Blouse, Suit..."
                    />
                </div>
                <button className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700">
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter Pills (Scrollable) */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Popular', 'New Arrival', 'Under ₹500', 'Express Delivery'].map((filter) => (
                    <button
                        key={filter}
                        className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-all whitespace-nowrap snap-start"
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ServicesHeader;
