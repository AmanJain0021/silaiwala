import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false, loading = false }) => {
    const baseStyles = 'w-full py-4 px-6 rounded-full font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';
    const variants = {
        primary: 'bg-[#843D9B] text-white hover:bg-[#E04D79] shadow-lg shadow-[#843D9B]/20',
        secondary: 'bg-white text-[#843D9B] border-2 border-[#843D9B] hover:bg-fuchsia-50',
        outline: 'bg-transparent text-gray-400 border-2 border-gray-100 hover:border-gray-200',
        ghost: 'bg-transparent text-[#843D9B] hover:bg-fuchsia-50',
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
            {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#843D9B]">{label}</label>}
            <input
                {...props}
                className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium text-sm placeholder:text-gray-300 ${error ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-[#843D9B] focus:bg-white'
                    }`}
            />
            {error && <p className="text-[10px] text-red-500 font-bold pl-2">{error}</p>}
        </div>
    );
};
