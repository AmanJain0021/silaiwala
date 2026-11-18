// Port of modules/measurement-executive/components/measurement-sheet/BottomActions.jsx (converted with scripts/web2rn.js, then reviewed)
import { Path, Polyline, default as Svg } from 'react-native-svg';
import React from "react";
import { ArrowRight } from "lucide-react-native";
import { Box, Btn, Txt, I, Scroll } from '../../ui/primitives';
const SaveOutlineIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <Polyline points="17 21 17 13 7 13 7 21" />
        <Polyline points="7 3 7 8 15 8" />
    </Svg>;
const BottomActions = ({
  onSaveDraft,
  onSaveAndContinue,
  loading = false,
  saveDraftLoading = false
}) => {
  return <Box className="bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            <Box className="w-full flex items-center gap-3">
                {/* Left: Save Draft */}
                <Btn onPress={onSaveDraft} disabled={saveDraftLoading || loading} className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#581C87] text-[#581C87] hover:bg-purple-50/60 font-bold text-sm py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm">
                    <I icon={SaveOutlineIcon} className="w-4.5 h-4.5 text-[#581C87]" />
                    <Txt>{saveDraftLoading ? 'Saving...' : 'Save Draft'}</Txt>
                </Btn>

                {/* Right: Save & Continue → */}
                <Btn onPress={onSaveAndContinue} disabled={loading} className="flex-[1.35] flex items-center justify-center gap-2 bg-[#4A154B] hover:bg-[#3B0F3C] text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-[#4A154B]/25 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer">
                    <Txt>{loading ? 'Processing...' : 'Save & Continue'}</Txt>
                    <I icon={ArrowRight} size={18} strokeWidth={2.4} />
                </Btn>
            </Box>
        </Box>;
};
export default BottomActions;
