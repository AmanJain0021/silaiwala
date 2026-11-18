// Port of modules/measurement-executive/components/measurement-sheet/ItemTabs.jsx (converted with scripts/web2rn.js, then reviewed)
import { Path, default as Svg } from 'react-native-svg';
import React from "react";
import { Plus } from "lucide-react-native";
import { Box, Btn, Txt, I, Scroll } from '../../ui/primitives';
const DressIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8 2h8l2 5-3 2v13H9V9L6 7l2-5z" />
        <Path d="M10 2v3a2 2 0 0 0 4 0V2" />
    </Svg>;
const PantsIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 4h16l-1 17-5-1-2-9-2 9-5 1L4 4z" />
        <Path d="M4 8h16" />
    </Svg>;
const ItemTabs = ({
  items = [],
  activeTabId,
  onSelectTab,
  onAddItem
}) => {
  return <Scroll contentClassName="flex items-center justify-between gap-2 py-1" className="w-full scrollbar-hide" horizontal>
            {/* Tabs List */}
            <Box className="flex items-center gap-2 flex-nowrap">
                {items.map(item => {
        const isActive = item.id === activeTabId;
        const isBottom = item.type === 'bottom' || /bottom|pant|pajama|salwar|trouser|plazo|palazzo|skirt/i.test(item.name);
        return <Btn key={item.id} onPress={() => onSelectTab(item.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive ? 'bg-[#4A154B] text-white shadow-md shadow-[#4A154B]/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/90'}`}>
                            {isBottom ? <I icon={PantsIcon} className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-600'}`} /> : <I icon={DressIcon} className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-600'}`} />}
                            <Txt>{item.name}</Txt>
                        </Btn>;
      })}
            </Box>

            {/* "+ Add Item" Button */}
            <Btn onPress={onAddItem} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:border-[#6C2E9C] hover:text-[#6C2E9C] hover:bg-purple-50/40 transition-all cursor-pointer whitespace-nowrap flex-shrink-0">
                <I icon={Plus} size={14} strokeWidth={2.2} />
                <Txt>Add Item</Txt>
            </Btn>
        </Scroll>;
};
export default ItemTabs;
