// Places autocomplete input + suggestion list (native stand-in for Google's Autocomplete widget dropdown).
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { placesAutocomplete, placeDetails } from '../../lib/places';
import { Box, Txt, Btn, Input, I } from '../ui/primitives';

export const componentsToParts = (components = []) => {
  let city = '', state = '', pincode = '', locality = '';
  components.forEach((comp) => {
    if (comp.types.includes('locality')) city = comp.long_name;
    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
    if (comp.types.includes('postal_code')) pincode = comp.long_name;
    if (comp.types.includes('sublocality_level_1') || comp.types.includes('route')) locality = comp.long_name;
  });
  return { city, state, pincode, locality };
};

/**
 * value/onChangeText: controlled text; onPlace(place) with { lat, lng, formatted_address, name, address_components }.
 * renderInput lets callers keep the web's input styling.
 */
export default function PlacesSearch({ value, onChangeText, onPlace, placeholder, inputClassName, containerClassName = '', listClassName = 'bg-white rounded-2xl border border-gray-100 shadow-lg mt-2 overflow-hidden', left, right }) {
  const [text, setText] = useState(value ?? '');
  const [items, setItems] = useState([]);
  const timer = useRef(null);
  const controlled = value !== undefined;
  const current = controlled ? value : text;

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (t) => {
    if (!controlled) setText(t);
    onChangeText?.(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { setItems(await placesAutocomplete(t)); } catch (_) { setItems([]); }
    }, 300);
  };

  const pick = async (item) => {
    Keyboard.dismiss();
    setItems([]);
    if (!controlled) setText(item.description);
    onChangeText?.(item.description);
    try {
      const place = await placeDetails(item.placeId);
      onPlace?.(place);
    } catch (_) { /* keep typed text */ }
  };

  return (
    <Box className={containerClassName}>
      <Box className="relative flex items-center">
        {left}
        <Input value={current} onChangeText={change} placeholder={placeholder} className={inputClassName} autoCorrect={false} returnKeyType="search" />
        {right}
      </Box>
      {items.length > 0 && (
        <Box className={listClassName}>
          {items.map((it) => (
            <Btn key={it.placeId} onPress={() => pick(it)} className="w-full flex flex-row items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 text-left">
              <I icon={MapPin} size={14} color="#9ca3af" style={{ marginTop: 2 }} />
              <Box className="flex-1">
                <Txt className="text-xs font-bold text-gray-800" numberOfLines={1}>{it.main}</Txt>
                {!!it.secondary && <Txt className="text-[10px] text-gray-500" numberOfLines={1}>{it.secondary}</Txt>}
              </Box>
            </Btn>
          ))}
        </Box>
      )}
    </Box>
  );
}
