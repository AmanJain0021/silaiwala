// Port of modules/measurement-executive/components/measurement-sheet/AddItemModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import React, { useState } from "react";
import { X } from "lucide-react-native";
import { Box, Txt, Btn, I, Input, Scroll } from '../../ui/primitives';
const AddItemModal = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('top');
    const handleSubmit = e => {
    if (!name.trim()) return;
    onAdd({
      id: `item_${Date.now()}`,
      name: name.trim(),
      type
    });
    setName('');
    setType('top');
    onClose();
  };
  return <Dialog visible={!!(isOpen)} onClose={onClose} className={`w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                <Box className="flex items-center justify-between mb-4">
                    <Txt className="text-base font-bold text-gray-900">Add New Garment Item</Txt>
                    <Btn onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors">
                        <I icon={X} size={16} />
                    </Btn>
                </Box>

                <Box className="space-y-4">
                    <Box>
                        <Txt className="block text-xs font-semibold text-gray-700 mb-1">
                            Item Name
                        </Txt>
                        <Input placeholder="e.g. Suit 3, Dupatta, Palazzo" value={name} onChangeText={e => setName(e)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6C2E9C] focus:ring-2 focus:ring-purple-100" />
                    </Box>

                    <Box>
                        <Txt className="block text-xs font-semibold text-gray-700 mb-1">
                            Garment Type
                        </Txt>
                        <Box className="grid grid-cols-2 gap-2">
                            <Btn onPress={() => setType('top')} className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${type === 'top' ? 'bg-[#581C87] text-white border-[#581C87]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                                Top (Kameez/Shirt)
                            </Btn>
                            <Btn onPress={() => setType('bottom')} className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${type === 'bottom' ? 'bg-[#581C87] text-white border-[#581C87]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                                Bottom (Salwar/Pant)
                            </Btn>
                        </Box>
                    </Box>

                    <Box className="flex items-center gap-2 pt-2">
                        <Btn onPress={onClose} className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                            Cancel
                        </Btn>
                        <Btn onPress={handleSubmit} className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#581C87] hover:bg-[#4A154B] transition-colors shadow-md shadow-purple-900/20">
                            Add Item
                        </Btn>
                    </Box>
                </Box>
            </Box>
</Dialog>;
};
export default AddItemModal;
