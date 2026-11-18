// Port of modules/measurement-executive/components/measurement-sheet/Header.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, MoreVertical, PhoneCall, HelpCircle, AlertTriangle } from "lucide-react-native";
import { useNavigate } from '../../../lib/nav';
import useBrandingStore from "../../../store/brandingStore";
import { openAdminWhatsApp } from "../../../utils/whatsapp";
import { Box, Btn, I, Img } from '../../ui/primitives';
const Header = ({
  customerPhone,
  onCancelTask
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    logos,
    appName,
    fetchBranding
  } = useBrandingStore();
  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);
  const execLogo = logos?.measurementExecutive || '/assets/images/admin_executive_logo.png';
  return <Box className="relative w-full bg-white border-b border-gray-100/80 px-4 py-2.5 flex items-center justify-between z-30 select-none">
            {/* Left: Back button */}
            <Btn onPress={() => navigate(-1)} className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer">
                <I icon={ArrowLeft} size={22} strokeWidth={2.2} />
            </Btn>

            {/* Center: Admin Configured Measurement Executive Logo */}
            <Box className="flex flex-col items-center justify-center">
                <Img src={execLogo} alt={appName || "SewZella"} className="h-10 w-[150px] object-contain" fallback="/assets/images/admin_executive_logo.png" />
            </Box>

            {/* Right: Actions */}
            <Box className="flex items-center gap-1 relative">
                {customerPhone ? <Btn onPress={() => Linking.openURL(`tel:${customerPhone}`)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-[#5B21B6] active:scale-95 transition-all">
                        <I icon={MessageSquare} size={19} strokeWidth={2} />
                    </Btn> : <Box className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-[#5B21B6] active:scale-95 transition-all cursor-pointer">
                        <I icon={MessageSquare} size={19} strokeWidth={2} />
                    </Box>}

                <Btn onPress={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer">
                    <I icon={MoreVertical} size={20} strokeWidth={2} />
                </Btn>

                {/* Dropdown Menu */}
                <Modal transparent visible={menuOpen} statusBarTranslucent animationType="none" onRequestClose={() => setMenuOpen(false)}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
                    <Box className="absolute right-4 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5" style={{ top: insets.top + 56 }}>
                            {customerPhone && <Btn className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5B21B6] transition-colors" onPress={() => {
            setMenuOpen(false);
            Linking.openURL(`tel:${customerPhone}`);
          }}>
                                    <I icon={PhoneCall} size={14} /> Call Customer
                                </Btn>}
                            <Btn onPress={() => {
            setMenuOpen(false);
            openAdminWhatsApp('Hi SewZella Admin, I need help with a measurement request.');
          }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5B21B6] transition-colors cursor-pointer">
                                <I icon={HelpCircle} size={14} /> Help & Support
                            </Btn>
                            {onCancelTask && <Btn onPress={() => {
            setMenuOpen(false);
            onCancelTask();
          }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100 cursor-pointer">
                                    <I icon={AlertTriangle} size={14} /> Cancel Request
                                </Btn>}
                    </Box>
                </Modal>
            </Box>
        </Box>;
};
export default Header;