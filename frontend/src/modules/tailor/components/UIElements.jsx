import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false, loading = false }) => {
    const baseStyles = 'w-full py-4 px-6 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';
    const variants = {
        primary: 'bg-[#2D2F6F] text-white hover:bg-[#1E1F4D] shadow-lg shadow-purple-100',
        secondary: 'bg-white text-[#2D2F6F] border-2 border-[#2D2F6F] hover:bg-purple-50',
        outline: 'bg-transparent text-gray-400 border-2 border-gray-100 hover:border-gray-200',
        ghost: 'bg-transparent text-[#2D2F6F] hover:bg-purple-50',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {loading ? (
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : children}
        </button>
    );
};

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="space-y-1.5 w-full group">
            {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#2D2F6F]">{label}</label>}
            <input
                {...props}
                className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium text-sm placeholder:text-gray-300 ${error ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-[#2D2F6F] focus:bg-white'
                    }`}
            />
            {error && <p className="text-[10px] text-red-500 font-bold pl-2">{error}</p>}
        </div>
    );
};

export const FileUpload = ({ label, error, onChange, value, placeholder = "Upload Document" }) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{label}</label>}
            <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 bg-[#F8F9FD] flex flex-col items-center justify-center gap-2 ${error ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-[#2D2F6F] hover:bg-white'
                }`}>
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => onChange(e.target.files[0])}
                />
                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#2D2F6F]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <p className="text-sm font-black text-gray-700">{value ? value.name : placeholder}</p>
                <span className="text-[10px] text-gray-400 font-bold">PNG, JPG up to 5MB</span>
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold pl-2">{error}</p>}
        </div>
    );
};

