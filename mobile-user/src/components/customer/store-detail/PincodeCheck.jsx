// Port of modules/customer/components/store-detail/PincodeCheck.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import React, { useState } from "react";
import { MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react-native";
import { Input } from "../../ui/Input";
import { Box, I, Txt, Btn, Scroll } from '../../ui/primitives';
const PincodeCheck = () => {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleCheck = () => {
    if (pincode.length !== 6) return;
    setStatus('loading');

    // Mock API call
    setTimeout(() => {
      if (['190001', '190002', '110001'].includes(pincode)) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }, 1000);
  };
  return <Box className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <Box className="flex items-center gap-2 mb-2">
                <I icon={MapPin} size={16} className="text-gray-500" />
                <Txt className="text-sm font-bold text-gray-900">Check Delivery</Txt>
            </Box>

            <Box className="flex gap-2 relative">
                <Input maxLength={6} placeholder="Enter Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} className="h-10 text-sm bg-white" />
                <Btn onPress={handleCheck} disabled={pincode.length !== 6 || status === 'loading'} className="text-xs font-bold text-primary hover:bg-gray-200 px-4 rounded-lg bg-gray-100 disabled:opacity-50">
                    {status === 'loading' ? <Spin size={16} className="animate-spin" /> : 'Check'}
                </Btn>
            </Box>

            {/* Status Messages */}
            {status === 'success' && <Box className="mt-2 flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                    <I icon={CheckCircle2} size={14} className="mt-0.5" />
                    <Box>
                        <Txt className="font-bold">Delivery Available</Txt>
                        <Txt>Expected by <Txt className="font-bold">Wed, Feb 20</Txt></Txt>
                        <Txt className="text-gray-500 text-[10px] mt-0.5">Cash on Delivery Available</Txt>
                    </Box>
                </Box>}

            {status === 'error' && <Box className="mt-2 flex items-center gap-2 text-xs text-red-700 bg-indigo-50 p-2 rounded-lg">
                    <I icon={XCircle} size={14} />
                    <Txt className="font-bold">Not deliverable to {pincode}</Txt>
                </Box>}
        </Box>;
};
export default PincodeCheck;