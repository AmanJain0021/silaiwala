// Port of modules/customer/pages/LanguageSettings.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState } from "react";
import { Globe, ArrowLeft, Check } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import toast from '../lib/toast';
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const LanguageSettings = () => {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState('en');
  const languages = [{
    code: 'en',
    name: 'English (US)',
    nativeName: 'English'
  }];
  const handleSelect = code => {
    setSelectedLang(code);
    toast.success('Language updated successfully');
  };
  return <Screen className="bg-gray-50" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-gray-50 md:p-6 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">Language</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-4xl mx-auto px-4 md:px-0">
                <Box className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <Box className="flex items-center gap-4 mb-8">
                        <Box className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                            <I icon={Globe} size={24} className="text-[#843D9B]" />
                        </Box>
                        <Box>
                            <Txt className="text-lg font-black text-gray-900">App Language</Txt>
                            <Txt className="text-xs text-gray-500 font-bold mt-1">Select your preferred language</Txt>
                        </Box>
                    </Box>

                    <Box className="space-y-3">
                        {languages.map(lang => <Btn key={lang.code} onPress={() => handleSelect(lang.code)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${selectedLang === lang.code ? 'bg-[#843D9B]/5 border-[#843D9B] shadow-sm' : 'bg-white border-gray-100 hover:border-[#843D9B]/30 hover:bg-gray-50'}`}>
                                <Box className="flex flex-col items-start">
                                    <Txt className={`text-sm font-bold ${selectedLang === lang.code ? 'text-[#843D9B]' : 'text-gray-900'}`}>
                                        {lang.name}
                                    </Txt>
                                    <Txt className="text-xs text-gray-400 font-medium mt-1">
                                        {lang.nativeName}
                                    </Txt>
                                </Box>
                                {selectedLang === lang.code && <Box className="w-6 h-6 rounded-full bg-[#843D9B] flex items-center justify-center text-white">
                                        <I icon={Check} size={14} strokeWidth={3} />
                                    </Box>}
                            </Btn>)}
                    </Box>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default LanguageSettings;