// Port of modules/delivery/components/DeliveryLegalModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../lib/nav';
import { Dialog, Sheet } from '../../components/ui/Sheet';
import React from "react";
import { X, ExternalLink, ShieldCheck } from "lucide-react-native";
import useBrandingStore from "../../store/brandingStore";
import { Box, I, Txt, Btn, Scroll } from '../ui/primitives';
export default function DeliveryLegalModal({
  isOpen,
  onClose,
  type = 'terms'
}) {
  const navigate = useNavigate();
  const appName = useBrandingStore(state => state.appName);
    const isPrivacy = type.toLowerCase().includes('privacy');
  const title = isPrivacy ? "Delivery Partner Privacy Policy" : "Delivery Partner Terms & Conditions";
  const legalUrl = isPrivacy ? "/delivery/legal/privacy-policy" : "/delivery/legal/terms-and-conditions";
  return <Dialog visible={!!(isOpen)} onClose={onClose} className={`bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
        {/* Modal Header */}
        <Box className="bg-gradient-to-r from-[#843D9B] to-[#843D9B] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <Box className="flex items-center gap-3">
            <Box className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <I icon={ShieldCheck} className="w-6 h-6" />
            </Box>
            <Box>
              <Txt className="text-lg sm:text-xl font-black tracking-tight">{title}</Txt>
              <Txt className="text-xs text-indigo-100 font-medium">{appName} Delivery Partner Legal Terms</Txt>
            </Box>
          </Box>
          <Btn onPress={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer">
            <I icon={X} className="w-5 h-5" />
          </Btn>
        </Box>

        {/* Modal Scrollable Body */}
        <Scroll contentClassName="p-5 space-y-4" className="flex-1 sm:p-6 text-slate-600 text-sm leading-relaxed custom-scrollbar" nestedScrollEnabled>
          {isPrivacy ? <>
              <Txt className="font-semibold text-slate-800">Effective Date: January 1, 2026</Txt>
              <Txt>{appName} ("we", "our", or "us") values your privacy. This policy details how we collect, use, and protect your information when enrolling and serving as a Delivery Partner.</Txt>
              
              <Txt className="text-base font-bold text-slate-900 mt-4">1. Information Collection</Txt>
              <Txt>We collect personal details (name, phone number, national ID), vehicle details (driver's license, vehicle registration), real-time GPS location during active shifts for order routing, and bank details for payouts.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">2. Use of Information</Txt>
              <Txt>Your details are strictly used to process registration, assign delivery orders, calculate payouts, and ensure safety across the {appName} logistics network.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">3. Data Sharing & Security</Txt>
              <Txt>We implement strict security measures. We do not sell your personal data. Limited location data is shared with customers only while an order is actively in transit.</Txt>
            </> : <>
              <Txt className="font-semibold text-slate-800">Effective Date: January 1, 2026</Txt>
              <Txt>Welcome to {appName}. By registering and operating as a Delivery Partner, you agree to comply with these Terms and Conditions.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">1. Partner Eligibility</Txt>
              <Txt>You must be at least 18 years old, possess a valid driver's license, active mobile number, valid vehicle documents, and submit truthful registration details.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">2. Service Standards</Txt>
              <Txt>Partners must accept assigned orders promptly, maintain accurate online/offline status, observe traffic safety rules, and handle items with care.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">3. Earnings & Payouts</Txt>
              <Txt>Payouts and incentives are calculated per completed delivery and deposited into your registered bank account or wallet according to schedule.</Txt>

              <Txt className="text-base font-bold text-slate-900 mt-4">4. Account Conduct & Safety</Txt>
              <Txt>Violations of safety guidelines, misconduct, or account sharing may lead to immediate suspension or deactivation of partner status.</Txt>
            </>}
        </Scroll>

        {/* Modal Footer */}
        <Box className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <Btn onPress={() => { onClose?.(); navigate(legalUrl); }} className="text-xs font-bold text-[#843D9B] hover:underline flex items-center gap-1">
            Open full page in new tab <I icon={ExternalLink} className="w-3.5 h-3.5" />
          </Btn>
          <Btn onPress={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-[#843D9B] hover:bg-[#6e3082] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">
            I Understand & Agree
          </Btn>
        </Box>
      </Box>
</Dialog>;
}