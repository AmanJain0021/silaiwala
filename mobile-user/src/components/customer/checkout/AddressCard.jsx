// Port of modules/customer/components/checkout/address/AddressCard.jsx (converted with scripts/web2rn.js, then reviewed)
import { confirm } from '../../../lib/alert';
import React, { useState } from "react";
import { Home, Briefcase, MapPin, MoreVertical, Trash2, Edit2, CheckCircle2 } from "lucide-react-native";
import { cn } from "../../../lib/cn";
import useAddressStore from "../../../store/userStore";
import { Btn, Box, Txt, I, Scroll } from '../../ui/primitives';
const AddressCard = ({
  address,
  isSelected,
  onSelect,
  onEdit
}) => {
  const removeAddress = useAddressStore(state => state.removeAddress);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const Icon = address.type === 'Work' ? Briefcase : Home;
  return <Btn onPress={onSelect} className={`block ${cn("relative p-4 rounded-xl border transition-all cursor-pointer bg-white group hover:shadow-sm", isSelected ? "border-primary ring-1 ring-primary bg-indigo-50" : "border-gray-200 hover:border-gray-300")}`}>
            <Box className="flex items-start justify-between mb-2">
                <Box className="flex items-center gap-2">
                    <Box className={cn("w-8 h-8 rounded-full flex items-center justify-center", isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                        <I icon={Icon} size={14} />
                    </Box>
                    <Box>
                        <Txt className="text-sm font-bold text-gray-900">{address.receiverName}</Txt>
                        <Txt className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{address.type}</Txt>
                    </Box>
                </Box>

                {isSelected ? <Box className="text-primary">
                        <I icon={CheckCircle2} size={20} fill="#843D9B" className="text-white" />
                    </Box> : <Box className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-gray-400" />}
            </Box>

            <Txt className="text-xs text-gray-600 leading-relaxed mb-3 pl-10">
                {address.street}

                {address.city} - {address.zipCode}, {address.state}
            </Txt>

            <Box className="text-xs font-medium text-gray-800 pl-10">
                Phone: {address.phone}
            </Box>

            {/* Actions Menu */}
            <Box className="absolute top-4 right-4 flex gap-2">
                <Btn onPress={e => {
        onEdit && onEdit();
      }} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-primary rounded-full transition-colors shadow-sm">
                    <I icon={Edit2} size={16} />
                </Btn>
                <Btn onPress={async e => {
        if (await confirm('Are you sure you want to delete this address?')) {
          removeAddress(address._id);
        }
      }} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors shadow-sm">
                    <I icon={Trash2} size={16} />
                </Btn>
            </Box>
        </Btn>;
};
export default AddressCard;
