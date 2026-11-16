// Port of modules/customer/pages/SavedAddresses.jsx (converted with scripts/web2rn.js, then reviewed)
import { confirm } from '../lib/alert';
import Screen from '../components/common/Screen';
import React, { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, ChevronLeft, Navigation, Home, Briefcase, Map as MapIcon, Check } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import useUserStore from "../store/userStore";
import BottomNav from "../components/customer/BottomNav";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { I, Box, Btn, Txt, Scroll } from '../components/ui/primitives';
const AddressPage = () => {
  const navigate = useNavigate();
  const {
    addresses,
    fetchAddresses,
    addAddress,
    removeAddress,
    updateAddress,
    isLoading
  } = useUserStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Home',
    receiverName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false
  });
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);
  const handleAdd = async e => {
    await addAddress(formData);
    setIsAdding(false);
    setFormData({
      type: 'Home',
      receiverName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false
    });
  };
  const handleDelete = async id => {
    if (await confirm("Remove this address?")) {
      await removeAddress(id);
    }
  };
  const toggleDefault = async addr => {
    if (addr.isDefault) return;
    await updateAddress(addr._id, {
      isDefault: true
    });
  };
  const getIcon = type => {
    switch (type) {
      case 'Home':
        return <I icon={Home} size={20} />;
      case 'Work':
        return <I icon={Briefcase} size={20} />;
      default:
        return <I icon={MapIcon} size={20} />;
    }
  };
  return <Screen className="bg-gray-50" bottom={false}><Box className="flex-1 bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <Box className="bg-white px-6 pt-4 pb-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <Btn onPress={() => navigate('/user/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-[#843D9B]">
                    <I icon={ChevronLeft} size={24} />
                </Btn>
                <Txt className="text-xl font-bold text-[#843D9B]">Saved Addresses</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            <Box className="max-w-md mx-auto px-4 py-6">

                <React.Fragment>
                    {isAdding ? <Box key="form" className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
                            <Txt className="text-lg font-bold text-[#843D9B] mb-6">Add New Address</Txt>
                            <Box className="space-y-4">
                                <Box className="flex bg-gray-50 p-1 rounded-2xl mb-4">
                                    {['Home', 'Work', 'Other'].map(t => <Btn key={t} onPress={() => setFormData({
                ...formData,
                type: t
              })} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.type === t ? 'bg-[#843D9B] text-white shadow-lg shadow-indigo-100' : 'text-gray-400'}`}>
                                            {t}
                                        </Btn>)}
                                </Box>
                                <Input placeholder="Receiver Name" value={formData.receiverName} onChange={e => setFormData({
              ...formData,
              receiverName: e.target.value
            })} required />
                                <Input placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} required />
                                <Input placeholder="House No, Street Name" value={formData.street} onChange={e => setFormData({
              ...formData,
              street: e.target.value
            })} required />
                                <Box className="grid grid-cols-2 gap-4">
                                    <Input placeholder="City" value={formData.city} onChange={e => setFormData({
                ...formData,
                city: e.target.value
              })} required />
                                    <Input placeholder="Zip Code" value={formData.zipCode} onChange={e => setFormData({
                ...formData,
                zipCode: e.target.value
              })} required />
                                </Box>
                                <Input placeholder="State" value={formData.state} onChange={e => setFormData({
              ...formData,
              state: e.target.value
            })} required />

                                <Box className="flex gap-4 pt-4">
                                    <Button type="button" onPress={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 h-14 rounded-full font-bold">Cancel</Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1 bg-[#843D9B] h-14 rounded-full text-white font-bold shadow-lg shadow-indigo-100">Save</Button>
                                </Box>
                            </Box>
                        </Box> : <Box key="list" className="space-y-4">
                            <Btn onPress={() => setIsAdding(true)} className="w-full p-6 dashed-border rounded-3xl flex items-center justify-center gap-3 text-[#843D9B] font-bold bg-white hover:bg-indigo-50 transition-colors border-2 border-dashed border-indigo-100">
                                <I icon={Plus} size={20} /> Add New Address
                            </Btn>

                            {addresses.length === 0 && !isLoading ? <Box className="text-center py-20 px-8">
                                    <Box className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <I icon={MapPin} size={32} />
                                    </Box>
                                    <Txt className="font-bold text-gray-400">No addresses saved</Txt>
                                    <Txt className="text-gray-400 text-xs mt-1">Add your shipping details here.</Txt>
                                </Box> : addresses.map(addr => <Btn key={addr._id} onPress={() => toggleDefault(addr)} className={`block ${`bg-white p-6 rounded-3xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${addr.isDefault ? 'border-pink-500 ring-1 ring-indigo-500' : 'border-gray-100'} relative`}`}>
                                        <Box className="flex items-start justify-between">
                                            <Box className="flex gap-4">
                                                <Box className={`w-10 h-10 rounded-2xl flex items-center justify-center ${addr.isDefault ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {getIcon(addr.type)}
                                                </Box>
                                                <Box className="flex-1">
                                                    <Box className="flex items-center gap-2">
                                                        <Txt className="font-bold text-gray-900 text-sm">{addr.type}</Txt>
                                                        {addr.isDefault && <I icon={Check} size={14} className="text-[#843D9B]" />}
                                                    </Box>
                                                    <Box className="text-gray-500 text-xs mt-1 leading-relaxed">
                                                        <Txt className="font-bold text-gray-700 text-[13px]">{addr.receiverName || 'No Name'}</Txt>
                                                        <Txt>{addr.street}</Txt>
                                                        <Txt>{addr.city || 'Indore'} {addr.zipCode ? `, India - ${addr.zipCode}` : ''}</Txt>
                                                        <Txt className="mt-1 font-bold">Phone: {addr.phone}</Txt>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box className="flex items-center gap-2">
                                                {!addr.isDefault && <Box className="text-[10px] uppercase font-black text-[#843D9B] bg-indigo-50 px-3 py-1.5 rounded-md tracking-wider">
                                                        Set Default
                                                    </Box>}
                                                <Btn onPress={e => {
                  // Prevents setting default when deleting
                  handleDelete(addr._id);
                }} className="p-2 text-gray-300 hover:text-error hover:bg-indigo-50 rounded-lg transition-all z-10">
                                                    <I icon={Trash2} size={18} />
                                                </Btn>
                                            </Box>
                                        </Box>
                                    </Btn>)}
                        </Box>}
                </React.Fragment>
            </Box>
                        </Scroll>
<BottomNav />
        </Box></Screen>;
};
export default AddressPage;
