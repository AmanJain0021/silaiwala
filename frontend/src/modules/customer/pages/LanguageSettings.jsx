import React, { useState } from 'react';
import { Globe, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LanguageSettings = () => {
    const navigate = useNavigate();
    const [selectedLang, setSelectedLang] = useState('en');

    const languages = [
        { code: 'en', name: 'English (US)', nativeName: 'English' }
    ];

    const handleSelect = (code) => {
        setSelectedLang(code);
        toast.success('Language updated successfully');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:p-6 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">Language</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-0">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                            <Globe size={24} className="text-[#843D9B]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">App Language</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">Select your preferred language</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                    selectedLang === lang.code 
                                        ? 'bg-[#843D9B]/5 border-[#843D9B] shadow-sm' 
                                        : 'bg-white border-gray-100 hover:border-[#843D9B]/30 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-bold ${selectedLang === lang.code ? 'text-[#843D9B]' : 'text-gray-900'}`}>
                                        {lang.name}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium mt-1">
                                        {lang.nativeName}
                                    </span>
                                </div>
                                {selectedLang === lang.code && (
                                    <div className="w-6 h-6 rounded-full bg-[#843D9B] flex items-center justify-center text-white">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSettings;
