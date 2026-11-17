// <input type="date|time"> replacement: input-looking field opening the Android date/time picker.
// value/onChange use the web formats: date 'YYYY-MM-DD', time 'HH:MM'.
import React from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Btn, Txt } from './primitives';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function DateField({ value, onChange, className = '', textClassName = '', placeholder = 'dd-mm-yyyy', min, max, mode = 'date', disabled }) {
  const open = () => {
    let initial = new Date();
    if (value && mode === 'date') {
      const [y, m, d] = value.split('-').map(Number);
      if (y) initial = new Date(y, m - 1, d);
    } else if (value && mode === 'time') {
      const [h, mi] = value.split(':').map(Number);
      initial.setHours(h || 0, mi || 0, 0, 0);
    }
    DateTimePickerAndroid.open({
      value: initial,
      mode,
      is24Hour: false,
      minimumDate: min ? new Date(min) : undefined,
      maximumDate: max ? new Date(max) : undefined,
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) return;
        onChange?.(mode === 'date' ? toYMD(date) : `${pad(date.getHours())}:${pad(date.getMinutes())}`);
      },
    });
  };
  const display = value
    ? mode === 'date' ? value.split('-').reverse().join('-') : (() => { const [h, mi] = value.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${pad(((h + 11) % 12) + 1)}:${pad(mi)} ${ap}`; })()
    : placeholder;
  return (
    <Btn disabled={disabled} onPress={open} className={`block flex-row items-center ${className}`}>
      <Txt className={`text-left flex-1 ${value ? '' : 'text-gray-400'} ${textClassName}`}>{display}</Txt>
    </Btn>
  );
}

export const TimeField = (props) => <DateField placeholder="--:-- --" {...props} mode="time" />;
export default DateField;
