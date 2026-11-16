// Port of modules/customer/components/AnimatedSearchBar.jsx (typewriter placeholder + suggestions)
import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { Box, Txt, Btn, Input, I } from '../ui/primitives';

const searchTerms = ['Search tailors...', 'Search bridal lehenga...', 'Search kurta stitching...', 'Search alterations...', 'Search custom fabrics...', 'Search blouse stitching...'];
const popularSuggestions = ['Bridal Wear', 'Custom Stitching', 'Alterations', 'Kurta Stitching', 'Lehenga', 'Suits & Blazers', 'Embroidery', 'Dress Making', 'Pants & Trousers', 'Blouse Stitching', 'Expert Tailors'];

const AnimatedSearchBar = ({ className = '', value, onChange, onSearch, hideBackground = false }) => {
  const [placeholderText, setPlaceholderText] = useState('');
  const [termIndex, setTermIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const isControlled = value !== undefined && onChange !== undefined;
  const inputValue = isControlled ? value : internalValue;
  const setInputValue = (v) => (isControlled ? onChange({ target: { value: v } }) : setInternalValue(v));
  const pauseAnimation = isFocused || Boolean(inputValue?.trim());

  useEffect(() => {
    if (pauseAnimation) return undefined;
    const currentTerm = searchTerms[termIndex];
    let timeout;
    if (!isDeleting) {
      if (placeholderText === currentTerm) timeout = setTimeout(() => setIsDeleting(true), 1800);
      else timeout = setTimeout(() => setPlaceholderText(currentTerm.substring(0, placeholderText.length + 1)), 75);
    } else if (placeholderText === '') {
      setIsDeleting(false);
      setTermIndex((prev) => (prev + 1) % searchTerms.length);
    } else {
      timeout = setTimeout(() => setPlaceholderText(currentTerm.substring(0, placeholderText.length - 1)), 40);
    }
    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, termIndex, pauseAnimation]);

  const executeSearch = (query) => {
    setIsFocused(false);
    if (onSearch) onSearch(query);
    else navigate(`/user/tailors?search=${encodeURIComponent(query)}`);
  };

  const filteredSuggestions = popularSuggestions.filter((s) => inputValue.trim() && s.toLowerCase().includes(inputValue.trim().toLowerCase())).slice(0, 5);
  const livePlaceholder = pauseAnimation ? 'Search tailors, designs, stitching...' : `${placeholderText}|`;

  return (
    <Box className={`relative ${className}`}>
      <Box className="absolute top-0 bottom-0 left-0 pl-3.5 flex items-center justify-center z-10" pointerEvents="none">
        <I icon={Search} size={16} color={isFocused ? '#843D9B' : '#9ca3af'} />
      </Box>
      <Input
        value={inputValue}
        onChangeText={setInputValue}
        onSubmitEditing={() => inputValue.trim() && executeSearch(inputValue.trim())}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder={livePlaceholder}
        returnKeyType="search"
        className={`w-full h-full pl-10 pr-4 text-[13px] font-medium placeholder:text-gray-400 relative z-10 ${hideBackground ? 'bg-transparent' : 'bg-white rounded-[1.25rem]'} ${className.includes('py-') ? '' : 'py-3'}`}
      />
      {isFocused && !!inputValue.trim() && filteredSuggestions.length > 0 && (
        <Box className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50">
          <Box className="p-1.5">
            <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Suggestions</Txt>
            {filteredSuggestions.map((s) => (
              <Btn key={s} onPress={() => { setInputValue(s); executeSearch(s); }} className="w-full text-left px-3 py-2.5 flex items-center justify-between rounded-xl">
                <Box className="flex items-center gap-2">
                  <I icon={Search} size={14} color="#9ca3af" />
                  <Txt className="text-xs font-bold text-gray-700">{s}</Txt>
                </Box>
                <I icon={ChevronRight} size={14} color="#d1d5db" />
              </Btn>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AnimatedSearchBar;
