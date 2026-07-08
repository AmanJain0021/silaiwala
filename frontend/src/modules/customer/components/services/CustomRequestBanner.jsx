import React from 'react';
import { UploadCloud, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomRequestBanner = () => {
    return (
        <div className="px-4 py-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>

                <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                        <UploadCloud size={20} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Have a unique design?</h2>
                    <p className="text-sm text-gray-300 mb-6 max-w-[80%]">Upload your sketch or reference image and get a custom quote.</p>

                    <Link to="/user/custom-design" className="inline-flex bg-white text-gray-900 px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 items-center gap-2 transition-transform hover:scale-105">
                        Start Custom Order <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CustomRequestBanner;
