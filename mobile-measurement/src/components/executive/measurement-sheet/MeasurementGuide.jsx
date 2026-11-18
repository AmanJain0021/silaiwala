// Port of modules/measurement-executive/components/measurement-sheet/MeasurementGuide.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState } from "react";
import { BookOpen, RotateCw, Hand, Play } from "lucide-react-native";
import ExecutiveMeasurementGuideModal from "../ExecutiveMeasurementGuideModal";
import { Box, Btn, I, Txt, Img, Scroll } from '../../ui/primitives';
const GUIDE_INSTRUCTIONS = {
  1: {
    title: "Shoulder",
    desc: "Measure straight across the back from the tip of one shoulder bone to the tip of the other."
  },
  2: {
    title: "Chest",
    desc: "Measure around the fullest part of the chest, keeping the tape horizontal."
  },
  4: {
    title: "Waist",
    desc: "Measure around the natural waistline, usually the narrowest part of the torso."
  },
  5: {
    title: "Hip",
    desc: "Measure around the fullest part of the hips and buttocks."
  },
  6: {
    title: "Sleeve Length",
    desc: "Measure from shoulder tip down along slightly bent arm to desired sleeve hem."
  },
  7: {
    title: "Kameez Length",
    desc: "Measure vertically from the shoulder seam near the neck down to the desired hemline."
  },
  9: {
    title: "Neck Width",
    desc: "Measure horizontally across the base of the neck where the collar sits."
  },
  10: {
    title: "Neck Depth",
    desc: "Measure vertically from the shoulder/neck intersection down to the lowest point of the neckline."
  }
};
const MeasurementGuide = ({
  onSelectGuideNumber,
  activeGuideNumber
}) => {
  const [selectedTip, setSelectedTip] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const handleNumberClick = num => {
    setSelectedTip(GUIDE_INSTRUCTIONS[num] || {
      title: `Step ${num}`,
      desc: "Follow standard tailoring measurement practice."
    });
    if (onSelectGuideNumber) {
      onSelectGuideNumber(num);
    }
  };
  const handleReset = () => {
    setSelectedTip(null);
    if (onSelectGuideNumber) onSelectGuideNumber(null);
  };
  return <Box className="w-full bg-white rounded-[26px] p-3.5 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)] flex flex-col items-center">
            {/* Top Control Bar */}
            <Box className="w-full flex items-center justify-between gap-2 mb-3">
                <Btn onPress={() => handleNumberClick(1)} className="flex-1 flex items-center justify-center gap-2 bg-[#581C87] hover:bg-[#4A154B] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                    <I icon={BookOpen} size={15} strokeWidth={2.2} />
                    <Txt>Diagram Guide</Txt>
                </Btn>

                <Btn onPress={() => setShowVideoModal(true)} className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#843D9B] to-[#6B2F7E] hover:opacity-95 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                    <I icon={Play} size={13} className="fill-current" />
                    <Txt>Video Guide</Txt>
                </Btn>

                <Btn onPress={handleReset} className="w-10 h-10 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-all active:scale-95 cursor-pointer flex-shrink-0">
                    <I icon={RotateCw} size={15} strokeWidth={2.2} />
                </Btn>
            </Box>

            {/* Model Image Asset with Interactive Hotspots */}
            <Box className="relative w-full rounded-2xl overflow-hidden bg-[#FCFBFE] border border-gray-100 flex items-center justify-center">
                <Img src="/assets/images/measurement_guide_model.png" alt="Measurement Guide Model" className="w-full object-contain" style={{ aspectRatio: 1024 / 1536, maxHeight: 460 }} />

                {/* Hotspot overlay buttons mapped to the image numbers */}
                {/* 9: Neck Width */}
                <Btn onPress={() => handleNumberClick(9)} className="absolute top-[16%] left-[49.5%] -translate-x-1/2 w-6 h-6 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 10: Neck Depth */}
                <Btn onPress={() => handleNumberClick(10)} className="absolute top-[19%] left-[53.5%] -translate-x-1/2 w-6 h-6 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 1: Shoulder */}
                <Btn onPress={() => handleNumberClick(1)} className="absolute top-[22%] left-[49.5%] -translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 2: Chest */}
                <Btn onPress={() => handleNumberClick(2)} className="absolute top-[28%] left-[49.5%] -translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 4: Waist */}
                <Btn onPress={() => handleNumberClick(4)} className="absolute top-[35.5%] left-[49.5%] -translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 5: Hip */}
                <Btn onPress={() => handleNumberClick(5)} className="absolute top-[44.5%] left-[49.5%] -translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 6: Sleeve Length */}
                <Btn onPress={() => handleNumberClick(6)} className="absolute top-[30%] left-[27.5%] -translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />

                {/* 7: Kameez Length */}
                <Btn onPress={() => handleNumberClick(7)} className="absolute top-[45%] right-[24%] translate-x-1/2 w-7 h-7 rounded-full bg-transparent hover:bg-purple-500/20 active:scale-110 transition-all cursor-pointer" />
            </Box>

            {/* Tip Overlay if selected */}
            {selectedTip && <Box className="w-full mt-2.5 p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Box className="text-xs font-bold text-[#581C87] flex items-center justify-between">
                        <Txt>{selectedTip.title}</Txt>
                        <Btn onPress={() => setSelectedTip(null)} className="text-gray-400 hover:text-gray-600 text-[10px]">
                            ✕
                        </Btn>
                    </Box>
                    <Txt className="text-[11px] text-gray-700 mt-0.5 leading-snug">{selectedTip.desc}</Txt>
                </Box>}

            {/* Bottom Instruction Note */}
            <Box className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium mt-2.5 select-none">
                <I icon={Hand} size={13} className="text-[#6C2E9C]" />
                <Txt>Tap on number to see how to measure</Txt>
            </Box>

            {/* Executive Video Guide Modal */}
            <ExecutiveMeasurementGuideModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
        </Box>;
};
export default MeasurementGuide;