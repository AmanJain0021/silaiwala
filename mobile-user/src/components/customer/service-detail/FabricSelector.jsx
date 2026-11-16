// Port of components/service-detail/FabricSelector.jsx
import React, { useState, useEffect } from 'react';
import { Scissors, ShoppingBag, ChevronRight, X } from 'lucide-react-native';
import api from '../../../lib/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { Sheet } from '../../ui/Sheet';
import Spin from '../../ui/Spin';
import { Box, Txt, Btn, Img, I, Scroll } from '../../ui/primitives';

const FabricSelector = ({ selected, onSelect, selectedFabric, onSelectFabric, tailor }) => {
  const [showFabricPicker, setShowFabricPicker] = useState(false);
  const [fabrics, setFabrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tailor?._id || !showFabricPicker) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/tailors/${tailor._id}/fabrics`);
        if (response.data.success) setFabrics(response.data.data);
      } catch (_) {
        setError('Failed to load fabrics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tailor?._id, showFabricPicker]);

  const card = (on) => `p-3 rounded-xl border text-center ${on ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-gray-100'}`;

  return (
    <Box className="bg-white rounded-2xl p-3.5 mb-3 shadow-sm border border-gray-100 relative">
      <Txt className="text-sm font-bold text-gray-900 mb-3">Fabric Source</Txt>
      <Box className="grid grid-cols-2 gap-3">
        <Btn onPress={() => onSelect('customer')} className={card(selected === 'customer')}>
          <Box className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <I icon={Scissors} size={20} color="#4b5563" />
          </Box>
          <Txt className="text-xs font-bold text-gray-900 text-center">I will provide</Txt>
          <Txt className="text-[10px] text-gray-500 mt-1 text-center">Pickup from your location</Txt>
        </Btn>
        <Btn onPress={() => { onSelect('platform'); if (!selectedFabric && tailor) setShowFabricPicker(true); }} className={card(selected === 'platform')}>
          <Box className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
            <I icon={ShoppingBag} size={20} color="#843D9B" />
          </Box>
          <Txt className="text-xs font-bold text-gray-900 text-center">Buy from Tailor</Txt>
          <Txt className="text-[10px] text-gray-500 mt-1 text-center">Direct from tailor's store</Txt>
        </Btn>
      </Box>

      {selectedFabric && selected === 'platform' ? (
        <Box className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-primary/30 flex items-center gap-3">
          <Box className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
            <Img src={getImageUrl(selectedFabric.image)} alt={selectedFabric.name} className="w-full h-full object-cover" />
          </Box>
          <Box className="flex-1">
            <Txt className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Selected Fabric</Txt>
            <Txt className="text-xs font-bold text-gray-900">{selectedFabric.name}</Txt>
          </Box>
          <Box className="items-end">
            <Txt className="text-xs font-bold text-primary">₹{selectedFabric.price}</Txt>
            <Btn onPress={() => setShowFabricPicker(true)} className="text-[9px] text-primary font-bold underline mt-1">Change</Btn>
          </Box>
        </Box>
      ) : selected === 'platform' && !selectedFabric ? (
        <Box className="mt-4">
          {!tailor ? (
            <Box className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Txt className="text-[10px] text-amber-700 font-medium text-center">Please select a tailor first to see their available fabrics.</Txt>
            </Box>
          ) : (
            <Btn onPress={() => setShowFabricPicker(true)} className="w-full p-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md">
              <Txt>Select Fabric from {tailor.shopName || 'Tailor Partner'}</Txt>
              <I icon={ChevronRight} size={14} />
            </Btn>
          )}
        </Box>
      ) : null}

      <Sheet visible={showFabricPicker && !!tailor} onClose={() => setShowFabricPicker(false)} className="bg-white w-full rounded-t-3xl p-6 pb-12" backdropClassName="bg-black/50">
        <Box className="flex justify-between items-center mb-6">
          <Box className="flex-1">
            <Txt className="text-lg font-bold text-gray-900">Fabrics by {tailor?.shopName || 'Tailor Partner'}</Txt>
            <Txt className="text-xs text-gray-500">Pick a fabric for your outfit</Txt>
          </Box>
          <Btn onPress={() => setShowFabricPicker(false)} className="p-2 bg-gray-100 rounded-full">
            <I icon={X} size={20} />
          </Btn>
        </Box>
        <Scroll style={{ maxHeight: 480 }} contentClassName="pb-4">
          {isLoading ? (
            <Box className="flex flex-col items-center justify-center py-12 gap-3">
              <Spin size={32} color="#843D9B" />
              <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching Fabrics...</Txt>
            </Box>
          ) : error ? (
            <Box className="items-center py-8">
              <Txt className="text-xs text-red-500 font-medium">{error}</Txt>
              <Btn onPress={() => setShowFabricPicker(false)} className="mt-4 text-[10px] font-black uppercase text-primary underline">Go Back</Btn>
            </Box>
          ) : fabrics.length === 0 ? (
            <Box className="items-center py-12 px-6">
              <Box className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <I icon={ShoppingBag} size={24} color="#d1d5db" />
              </Box>
              <Txt className="text-gray-400 text-xs font-medium text-center">No fabrics available from this tailor at the moment.</Txt>
            </Box>
          ) : (
            <Box className="grid grid-cols-2 gap-4">
              {fabrics.map((fabric) => (
                <Btn key={fabric._id} onPress={() => { onSelectFabric(fabric); setShowFabricPicker(false); }} className={`p-2 rounded-2xl border text-left ${selectedFabric?._id === fabric._id ? 'border-primary bg-primary-soft' : 'border-gray-100'}`}>
                  <Box className="aspect-square rounded-xl overflow-hidden mb-2 border border-gray-50">
                    <Img src={getImageUrl(fabric.image || fabric.images?.[0])} alt={fabric.name} className="w-full h-full object-cover" />
                  </Box>
                  <Txt className="text-[11px] font-bold text-gray-800 truncate">{fabric.name}</Txt>
                  <Txt className="text-[10px] font-bold text-primary">₹{fabric.price}</Txt>
                </Btn>
              ))}
            </Box>
          )}
        </Scroll>
      </Sheet>
    </Box>
  );
};

export default FabricSelector;
