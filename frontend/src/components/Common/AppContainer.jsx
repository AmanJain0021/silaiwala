import React from 'react';

const AppContainer = ({ children, className = '' }) => {
    return (
        <div className={`min-h-screen bg-gray-50/50 flex items-center justify-center p-0 sm:p-6 md:p-12 overflow-hidden ${className}`}>
            {/* Responsive container: Full screen on mobile, floating card on desktop */}
            <div className="w-full max-w-3xl bg-white sm:rounded-[2rem] sm:shadow-2xl sm:shadow-[#2D2F6E]/10 h-screen sm:h-auto sm:min-h-[600px] sm:max-h-[90vh] relative flex flex-col overflow-hidden border border-gray-100/50 no-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default AppContainer;
