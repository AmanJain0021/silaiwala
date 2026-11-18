// Port of modules/measurement-executive/components/measurement-sheet/MeasurementRow.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import { Circle, Line, Path, default as Svg } from 'react-native-svg';
import React, { useState } from "react";
import { Info } from "lucide-react-native";
import { Box, Txt, Btn, I, Input, Scroll } from '../../ui/primitives';

// Custom body measurement icons
const BodyPartIcon = ({
  type,
  size = 16,
  color = "#6C2E9C"
}) => {
  switch (type) {
    case 'shoulder':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M4 18v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                    <Circle cx="12" cy="7" r="3" />
                    <Line x1="4" y1="14" x2="20" y2="14" strokeDasharray="2 2" />
                </Svg>;
    case 'chest':
    case 'bust':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M6 6a6 6 0 0 1 12 0c0 4-3 8-6 10-3-2-6-6-6-10z" />
                    <Line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
                </Svg>;
    case 'waist':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M5 4c3 4 3 12 0 16h14c-3-4-3-12 0-16H5z" />
                    <Line x1="7" y1="12" x2="17" y2="12" strokeDasharray="2 2" />
                </Svg>;
    case 'hip':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M4 6h16c0 6-3 12-8 12S4 12 4 6z" />
                    <Line x1="4" y1="13" x2="20" y2="13" strokeDasharray="2 2" />
                </Svg>;
    case 'armhole':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Circle cx="12" cy="12" r="7" />
                    <Path d="M12 5a7 7 0 0 1 7 7" strokeDasharray="2 2" />
                </Svg>;
    case 'sleeveLength':
    case 'sleeve':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M6 4l6 14 6-4-6-14H6z" />
                    <Line x1="6" y1="4" x2="12" y2="18" strokeDasharray="2 2" />
                </Svg>;
    case 'kameezLength':
    case 'length':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M7 4h10v16H7z" />
                    <Path d="M12 4v16" strokeDasharray="2 2" />
                    <Path d="M10 20l2 2 2-2" />
                </Svg>;
    case 'neckWidth':
    case 'neckDepth':
    case 'neck':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Path d="M8 4c0 4 2 8 4 8s4-4 4-8" />
                    <Circle cx="12" cy="12" r="8" />
                </Svg>;
    default:
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    <Circle cx="12" cy="12" r="8" />
                    <Line x1="12" y1="8" x2="12" y2="16" />
                    <Line x1="8" y1="12" x2="16" y2="12" />
                </Svg>;
  }
};
const MeasurementRow = ({
  itemKey,
  label,
  value,
  unit = 'in',
  guideNumber,
  instruction,
  isHighlighted,
  onChange
}) => {
  const [showInfo, setShowInfo] = useState(false);
  return <Box className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all ${isHighlighted ? 'bg-purple-100/70 ring-2 ring-[#6C2E9C]/40' : 'hover:bg-purple-50/40'}`}>
            {/* Left: Icon + Label + Info */}
            <Box className="flex items-center gap-2.5 min-w-0">
                {/* Purple circular icon badge */}
                <Box className="w-8 h-8 rounded-full bg-[#F5EFFF] flex items-center justify-center flex-shrink-0 text-[#6C2E9C]">
                    <BodyPartIcon type={itemKey} />
                </Box>

                {/* Name */}
                <Box className="relative flex items-center gap-1.5 min-w-0">
                    <Txt className="text-[13px] font-medium text-gray-800 tracking-tight truncate">
                        {label}
                    </Txt>

                    {/* Guide Number pill if mapped */}
                    {guideNumber && <Box className="w-4 h-4 rounded-full bg-[#581C87] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                            {guideNumber}
                        </Box>}

                    {/* Small Info Button */}
                    <Btn onPress={() => setShowInfo(!showInfo)} className="text-gray-400 hover:text-[#6C2E9C] transition-colors p-0.5 cursor-pointer flex-shrink-0">
                        <I icon={Info} size={13} strokeWidth={2} />
                    </Btn>

                    {/* Tooltip */}
                    <Dialog visible={showInfo} onClose={() => setShowInfo(false)} className="w-full max-w-xs p-4 bg-gray-900 text-white text-[11px] rounded-xl shadow-lg leading-snug">
                        <Txt className="font-semibold text-purple-200 mb-0.5">{label}</Txt>
                        <Txt className="text-gray-300">{instruction || `Measure around the standard ${label.toLowerCase()} line snug against body.`}</Txt>
                    </Dialog>
                </Box>
            </Box>

            {/* Right: Rounded Input Box */}
            <Box className="flex items-center border border-gray-200/90 rounded-xl px-2.5 py-1.5 bg-white focus-within:border-[#6C2E9C] focus-within:ring-2 focus-within:ring-purple-100 transition-all w-28 flex-shrink-0">
                <Input placeholder="0.0" value={value ?? ''} onChangeText={e => onChange && onChange(e)} className="w-full text-right font-bold text-gray-900 text-sm focus:outline-none bg-transparent pr-1" keyboardType="numeric" />
                <Box className="text-gray-400 text-xs font-semibold select-none flex-shrink-0">
                    {unit}
                </Box>
            </Box>
        </Box>;
};
export default MeasurementRow;
