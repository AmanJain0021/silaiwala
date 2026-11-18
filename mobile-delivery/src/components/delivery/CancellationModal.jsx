import { Dialog, Sheet } from '../../components/ui/Sheet';
import React from 'react';
import Spin from '../ui/Spin';
import { X as FiX, AlertTriangle as FiAlertTriangle, Send as FiSend } from 'lucide-react-native';
// Port of modules/delivery/components/CancellationModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { useState } from "react";
import { Box, Btn, Txt, Input, Scroll, I } from '../ui/primitives';
const CancellationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    onConfirm(reason.trim());
  };
  const commonReasons = ['Customer Refused', 'Incorrect Address', 'Customer Unreachable', 'Item Damaged', 'Payment Issue'];
  return <React.Fragment>
            {isOpen && <Dialog visible={!!(isOpen)} onClose={onClose} className={`relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-[10000] border border-white`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        {/* Header */}
                        <Box className="bg-rose-50 px-6 py-6 border-b border-rose-100/50 flex flex-col items-center text-center">
                            <Box className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 mb-4">
                                <I icon={FiAlertTriangle} size={24} />
                            </Box>
                            <Txt className="text-lg font-black text-rose-900 uppercase tracking-tight">Serious Action Required</Txt>
                            <Txt className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">Order Cancellation Protocol</Txt>
                        </Box>

                        {/* Body */}
                        <Box className="p-6">
                            <Txt className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-4 px-1">Choose a reason or type below:</Txt>
                            
                            <Box className="flex flex-wrap gap-2 mb-6">
                                {commonReasons.map(r => <Btn key={r} onPress={() => {
              setReason(r);
              setError('');
            }} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${reason === r ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}>
                                        {r}
                                    </Btn>)}
                            </Box>

                            <Box className="relative group">
                                <Input value={reason} onChangeText={e => {
              setReason(e);
              setError('');
            }} placeholder="Type details for cancellation..." className={`w-full h-24 bg-slate-50 border ${error ? 'border-rose-300' : 'border-slate-100'} rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:border-rose-400 focus:bg-white transition-all resize-none shadow-inner`} multiline />
                                {error && <Txt className="text-[9px] font-bold text-rose-500 mt-2 ml-1 uppercase">{error}</Txt>}
                            </Box>

                            <Box className="mt-8 flex gap-3">
                                <Btn onPress={onClose} disabled={isSubmitting} className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 active:scale-95 transition-all">
                                    Go Back
                                </Btn>
                                <Btn onPress={handleSubmit} disabled={isSubmitting} className="flex-1 h-12 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isSubmitting ? <Spin size={16} className="text-white/30" /> : <><I icon={FiSend} size={14} /> Confirm</>}
                                </Btn>
                            </Box>

                            <Txt className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-6 italic">
                                Note: This action cannot be undone.
                            </Txt>
                        </Box>

                        {/* Close button */}
                        <Btn onPress={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                            <I icon={FiX} size={16} />
                        </Btn>
                    </Box>
</Dialog>}
        </React.Fragment>;
};
export default CancellationModal;
