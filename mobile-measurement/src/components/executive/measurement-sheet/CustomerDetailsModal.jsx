// Port of modules/measurement-executive/components/measurement-sheet/CustomerDetailsModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import { Linking } from 'react-native';
import React from "react";
import { X, Phone, MapPin, Navigation, Package, ExternalLink } from "lucide-react-native";
import { Box, Txt, Btn, I, Scroll } from '../../ui/primitives';
const CustomerDetailsModal = ({
  isOpen,
  onClose,
  request
}) => {
  if (!isOpen || !request) return null;
  const customer = request.customer;
  const customerAddress = request.customerAddress;
  const order = request.order;
  const mapsUrl = request.customerLocation?.coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${request.customerLocation.coordinates[1]},${request.customerLocation.coordinates[0]}` : null;
  return <Dialog visible={!!(true)} onClose={onClose} className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100    max-h-[90vh] custom-scrollbar`}>
<Box className="flex-shrink flex flex-col overflow-hidden"><Scroll className="flex-shrink" contentClassName="p-6" nestedScrollEnabled>
                <Box className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <Box className="flex items-center gap-2">
                        <Box className="w-8 h-8 rounded-full bg-purple-100 text-[#581C87] flex items-center justify-center font-bold text-sm">
                            {customer?.name?.charAt(0) || 'C'}
                        </Box>
                        <Box>
                            <Txt className="text-base font-bold text-gray-900">{customer?.name || 'Customer Details'}</Txt>
                            <Txt className="text-[11px] text-gray-400 font-medium">Order #{order?.orderId || 'SZ12568'}</Txt>
                        </Box>
                    </Box>
                    <Btn onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer">
                        <I icon={X} size={16} />
                    </Btn>
                </Box>

                <Box className="space-y-4">
                    {/* Phone */}
                    <Box className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <Box className="flex items-center gap-3">
                            <Box className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#581C87]">
                                <I icon={Phone} size={16} />
                            </Box>
                            <Box>
                                <Txt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</Txt>
                                <Txt className="text-sm font-semibold text-gray-800">{customer?.phoneNumber || 'N/A'}</Txt>
                            </Box>
                        </Box>
                        {customer?.phoneNumber && <Btn onPress={() => Linking.openURL(`tel:${customer.phoneNumber}`)} className="px-3 py-1.5 bg-purple-100 text-[#581C87] hover:bg-[#581C87] hover:text-white rounded-xl text-xs font-bold transition-all">
                                Call
                            </Btn>}
                    </Box>

                    {/* Address */}
                    <Box className="p-3.5 bg-gray-50 rounded-2xl flex items-start gap-3">
                        <Box className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                            <I icon={MapPin} size={16} />
                        </Box>
                        <Box className="flex-1 min-w-0">
                            <Txt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer Address</Txt>
                            <Txt className="text-xs font-medium text-gray-800 leading-relaxed mt-0.5">
                                {customerAddress?.street ? `${customerAddress.street}, ` : ''}
                                {customerAddress?.city || ''} {customerAddress?.state || ''} {customerAddress?.zipCode || ''}
                            </Txt>
                            {mapsUrl && <Btn onPress={() => Linking.openURL(mapsUrl)} className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-[#581C87] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#4A154B] transition-colors">
                                    <I icon={Navigation} size={13} />
                                    <Txt>Open in Google Maps</Txt>
                                    <I icon={ExternalLink} size={11} className="opacity-70" />
                                </Btn>}
                        </Box>
                    </Box>

                    {/* Order Details */}
                    {order?.items?.length > 0 && <Box className="p-3.5 bg-gray-50 rounded-2xl">
                            <Box className="flex items-center gap-2 mb-2">
                                <I icon={Package} size={15} className="text-[#581C87]" />
                                <Txt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Items Ordered</Txt>
                            </Box>
                            <Box className="space-y-1.5">
                                {order.items.map((item, idx) => <Box key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-gray-100">
                                        <Txt className="font-semibold text-gray-800">
                                            {item.service?.title || item.service?.name || `Item ${idx + 1}`}
                                        </Txt>
                                        <Txt className="text-gray-500 font-medium">
                                            Qty: {item.quantity || 1}
                                        </Txt>
                                    </Box>)}
                            </Box>
                        </Box>}
                </Box>
            </Scroll></Box>
</Dialog>;
};
export default CustomerDetailsModal;