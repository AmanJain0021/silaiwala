// Port of shared/components/PlacesAutocompleteField.jsx (Google Places REST suggestions instead of the JS widget)
import React from 'react';
import { MapPin, X } from 'lucide-react-native';
import PlacesSearch, { componentsToParts } from './PlacesSearch';
import { Box, Txt, Btn, I } from '../ui/primitives';

const PlacesAutocompleteField = ({ label, placeholder, required, value, error, onChange, onClear, onPlaceSelect }) => {
  const onPlace = (place) => {
    const { city, state, pincode } = componentsToParts(place.address_components);
    const address = place.formatted_address || place.name;
    onChange(address);
    onPlaceSelect({ address, city, state, pincode, latitude: place.lat, longitude: place.lng });
  };
  return (
    <Box className="mb-3 relative z-[100]">
      {!!label && <Txt className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label} {required && '*'}</Txt>}
      <PlacesSearch
        value={value}
        onChangeText={onChange}
        onPlace={onPlace}
        placeholder={placeholder}
        left={<Box className="absolute left-3 z-10" pointerEvents="none"><I icon={MapPin} size={14} color="#818cf8" /></Box>}
        right={value ? (
          <Btn onPress={() => (onClear ? onClear() : onChange(''))} className="absolute right-2 z-10" hitSlop={8}>
            <I icon={X} size={14} color="#9ca3af" />
          </Btn>
        ) : null}
        inputClassName={`flex-1 text-xs font-semibold p-2.5 pl-9 pr-8 rounded-lg border ${error ? 'border-red-300 bg-indigo-50' : 'border-gray-200 bg-gray-50/50'}`}
        listClassName="bg-white rounded-xl border border-gray-100 shadow-lg mt-1 overflow-hidden"
      />
      {!!error && <Txt className="text-[9px] text-red-500 font-medium ml-1">{error}</Txt>}
    </Box>
  );
};

export default PlacesAutocompleteField;
