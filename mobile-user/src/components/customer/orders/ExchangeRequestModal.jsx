// Port of modules/customer/components/orders/ExchangeRequestModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { alert } from '../../../lib/alert';
import Select from '../../../components/ui/Select';
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import React, { useState } from "react";
import { X, RefreshCcw, Camera } from "lucide-react-native";
import api from "../../../lib/api";
import { Box, Btn, I, Txt, Input, Scroll } from '../../ui/primitives';
const ExchangeRequestModal = ({
  isOpen,
  onClose,
  orderId,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [requestedSize, setRequestedSize] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async e => {
    setIsLoading(true);
    try {
      const res = await api.post(`/orders/${orderId}/exchange`, {
        reason,
        requestedSize,
        customerNotes
      });
      if (res.data.success) {
        alert('Exchange requested successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Exchange error:', error);
      alert(error.response?.data?.message || 'Failed to request exchange');
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog visible={!!(isOpen)} onClose={onClose} className={`bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl   zoom-in`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                <Box className="p-6 bg-gradient-to-br from-purple-500 to-primary-dark text-white relative">
                    <Btn onPress={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <I icon={X} size={20} />
                    </Btn>
                    <Box className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                        <I icon={RefreshCcw} size={24} className="text-white" />
                    </Box>
                    <Txt className="text-2xl font-black tracking-tighter">Request Exchange</Txt>
                    <Txt className="text-purple-100 text-sm font-medium opacity-90 mt-1">
                        Select a reason to exchange this ready-made item.
                    </Txt>
                </Box>

                <Box className="p-6 space-y-4">
                    <Box>
                        <Txt className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Reason for Exchange *
                        </Txt>
                        <Select value={reason} onChange={setReason} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none" options={[{ value: '', label: 'Select a reason' }, { value: 'Size too small', label: 'Size too small' }, { value: 'Size too large', label: 'Size too large' }, { value: 'Received wrong item', label: 'Received wrong item' }, { value: 'Item damaged', label: 'Item damaged' }, { value: 'Color mismatch', label: 'Color mismatch' }]} />
                    </Box>

                    <Box>
                        <Txt className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Requested Size (Optional)
                        </Txt>
                        <Select value={requestedSize} onChange={setRequestedSize} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none" options={[{ value: '', label: 'Same as before' }, { value: 'XS', label: 'XS' }, { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' }]} />
                    </Box>

                    <Box>
                        <Txt className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Additional Notes
                        </Txt>
                        <Input value={customerNotes} onChangeText={e => setCustomerNotes(e)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24" placeholder="Provide any additional details..." multiline></Input>
                    </Box>

                    <Btn onPress={handleSubmit} disabled={isLoading || !reason} className="w-full mt-2 py-4 bg-primary hover:bg-primary-dark disabled:bg-purple-300 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-md">
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Btn>
                </Box>
            </Box>
</Dialog>;
};
export default ExchangeRequestModal;
