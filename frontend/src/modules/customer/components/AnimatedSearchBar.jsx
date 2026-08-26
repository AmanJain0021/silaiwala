import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const searchTerms = [
    'Search tailors...',
    'Search bridal lehenga...',
    'Search kurta stitching...',
    'Search alterations...',
    'Search custom fabrics...',
    'Search blouse stitching...',
];

const popularSuggestions = [
    "Bridal Wear",
    "Custom Stitching",
    "Alterations",
    "Kurta Stitching",
    "Lehenga",
    "Suits & Blazers",
    "Embroidery",
    "Dress Making",
    "Pants & Trousers",
    "Blouse Stitching",
    "Expert Tailors"
];

const AnimatedSearchBar = ({ className = "", value, onChange, onSearch, hideBackground = false }) => {
    const [placeholderText, setPlaceholderText] = useState('');
    const [termIndex, setTermIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [internalValue, setInternalValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);
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

    const pauseAnimation = isFocused || Boolean(inputValue?.trim());

    // Typewriter / erase placeholder animation
    useEffect(() => {
        if (pauseAnimation) return undefined;

        const currentTerm = searchTerms[termIndex];
        let timeout;

        if (!isDeleting) {
            if (placeholderText === currentTerm) {
                timeout = setTimeout(() => setIsDeleting(true), 1800);
            } else {
                timeout = setTimeout(() => {
                    setPlaceholderText(currentTerm.substring(0, placeholderText.length + 1));
                }, 75);
            }
        } else if (placeholderText === '') {
            setIsDeleting(false);
            setTermIndex((prev) => (prev + 1) % searchTerms.length);
        } else {
            timeout = setTimeout(() => {
                setPlaceholderText(currentTerm.substring(0, placeholderText.length - 1));
            }, 40);
        }

        return () => clearTimeout(timeout);
    }, [placeholderText, isDeleting, termIndex, pauseAnimation]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const executeSearch = (query) => {
        setIsFocused(false);
        if (onSearch) {
            onSearch(query);
        } else {
            navigate(`/user/tailors?search=${encodeURIComponent(query)}`);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            executeSearch(inputValue.trim());
        }
    };

    const filteredSuggestions = popularSuggestions.filter(s =>
        inputValue.trim() && s.toLowerCase().includes(inputValue.trim().toLowerCase())
    ).slice(0, 5);

    const livePlaceholder = pauseAnimation
        ? 'Search tailors, designs, stitching...'
        : `${placeholderText}|`;

    return (
        <div className={`relative group ${className}`} ref={wrapperRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#843D9B] transition-colors" />
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setIsFocused(true)}
                placeholder={livePlaceholder}
                className={`w-full h-full pl-10 pr-4 text-[13px] font-medium focus:outline-none focus:ring-0 transition-all placeholder:text-gray-400 relative z-10 ${hideBackground ? 'bg-transparent border-transparent shadow-none' : 'bg-white border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-white/20 focus:border-white shadow-inner'} ${className.includes('py-') ? '' : 'py-3 sm:py-3.5'}`}
            />

            <AnimatePresence>
                {isFocused && inputValue.trim() && filteredSuggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50"
                    >
                        <div className="p-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Suggestions</p>
                            {filteredSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setInputValue(suggestion);
                                        executeSearch(suggestion);
                                    }}
                                    className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors group/item"
                                >
                                    <div className="flex items-center gap-2">
                                        <Search size={14} className="text-gray-400 group-hover/item:text-[#843D9B]" />
                                        <span className="text-xs font-bold text-gray-700 group-hover/item:text-[#843D9B]">{suggestion}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedSearchBar;
