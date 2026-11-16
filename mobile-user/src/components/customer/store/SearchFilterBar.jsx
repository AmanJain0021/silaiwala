// Port of modules/customer/components/store/SearchFilterBar.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { Box, Input, I, Btn, Txt, Scroll } from '../../ui/primitives';
const SearchFilterBar = ({
  onOpenFilter,
  searchQuery,
  setSearchQuery
}) => {
  return <Box className="bg-white border-b border-gray-100 transition-all duration-300">
            <Box className="max-w-7xl mx-auto py-3 px-4 flex items-center gap-3">
                {/* Search Input (Mobile/Tablet primarily, or as secondary filter) */}
                <Box className="flex-1 relative">
                    <Input placeholder="Search within store..." value={searchQuery} onChangeText={e => setSearchQuery(e)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-primary text-sm transition-all shadow-inner" />
                    <I icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </Box>

                {/* Filter Button */}
                <Btn onPress={onOpenFilter} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary hover:bg-gray-50 transition-all active:scale-95">
                    <I icon={SlidersHorizontal} className="h-4 w-4" />
                    <Txt className="hidden sm:inline">Filters</Txt>
                </Btn>
            </Box>
        </Box>;
};
export default SearchFilterBar;
