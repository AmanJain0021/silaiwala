import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const searchTerms = [
    '"bridal lehenga"',
    '"kurta stitching"',
    '"expert tailors"',
    '"custom fabrics"',
    '"alterations"'
];

const AnimatedSearchBar = ({ className = "", value, onChange, onSearch }) => {
    const [text, setText] = useState('');
    const [termIndex, setTermIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [internalValue, setInternalValue] = useState('');
    const navigate = useNavigate();

    const isControlled = value !== undefined && onChange !== undefined;
    const inputValue = isControlled ? value : internalValue;

    const setInputValue = (newVal) => {
        if (isControlled) {
            onChange({ target: { value: newVal } });
        } else {
            setInternalValue(newVal);
        }
    };

    useEffect(() => {
        let timeout;
        const currentTerm = searchTerms[termIndex];

        if (!isDeleting) {
            // Typing forward
            if (text === currentTerm) {
                // Pause before deleting
                timeout = setTimeout(() => setIsDeleting(true), 2000);
            } else {
                timeout = setTimeout(() => {
                    setText(currentTerm.substring(0, text.length + 1));
                }, 100);
            }
        } else {
            // Deleting backward
            if (text === '') {
                setIsDeleting(false);
                setTermIndex((prev) => (prev + 1) % searchTerms.length);
            } else {
                timeout = setTimeout(() => {
                    setText(currentTerm.substring(0, text.length - 1));
                }, 50);
            }
        }

        return () => clearTimeout(timeout);
    }, [text, isDeleting, termIndex]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            if (onSearch) {
                onSearch(inputValue.trim());
            } else {
                navigate(`/user/services?search=${encodeURIComponent(inputValue.trim())}`);
            }
        }
    };

    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#2D2F6E] transition-colors" />
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleSearch}
                placeholder={`Search ${text}|`}
                className={`w-full bg-gray-100 border border-transparent rounded-[1.25rem] pl-10 pr-4 text-[13px] font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D2F6E]/5 focus:border-[#2D2F6E]/20 transition-all placeholder:text-gray-400 shadow-inner ${className.includes('py-') ? '' : 'py-2 sm:py-2.5'}`}
            />
        </div>
    );
};

export default AnimatedSearchBar;
