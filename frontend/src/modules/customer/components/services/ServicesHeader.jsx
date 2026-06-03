import React from 'react';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedSearchBar from '../AnimatedSearchBar';

const ServicesHeader = ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter }) => {
    return (
        <div className="sticky top-0 md:top-20 z-[100] bg-white border-b border-gray-100 shadow-sm px-4 md:px-6 lg:px-8 pb-4 transition-all duration-300">
            {/* Top Bar - Mobile Only */}
            <div className="flex items-center gap-3 pt-3 mb-3 md:hidden">
                <Link to="/user" className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700 active:scale-90 transition-transform">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-black text-[#2D2F6E] tracking-tight">Stitching Services</h1>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <AnimatedSearchBar 
                        className="py-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onSearch={(val) => setSearchQuery(val)}
                    />
                </div>
                <button className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700">
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter Pills (Scrollable) */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Men', 'Women', 'Bridal', 'Popular', 'Under ₹500', 'Express Delivery'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter && setActiveFilter(filter)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap snap-start ${
                            activeFilter === filter 
                                ? 'bg-[#2D2F6E] text-white border-[#2D2F6E]' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#2D2F6E] hover:text-[#2D2F6E]'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ServicesHeader;
