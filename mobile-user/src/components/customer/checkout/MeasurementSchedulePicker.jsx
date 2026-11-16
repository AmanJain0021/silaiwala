// Port of components/checkout/summary/MeasurementSchedulePicker.jsx (logic verbatim)
import React, { useState, useEffect, useMemo } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, Zap } from 'lucide-react-native';
import { Box, Txt, Btn, I } from '../../ui/primitives';

const TIME_SLOTS = [
    { id: '10-12', label: '10:00 AM - 12:00 PM', startHour: 10, period: 'Morning' },
    { id: '12-14', label: '12:00 PM - 02:00 PM', startHour: 12, period: 'Noon' },
    { id: '14-16', label: '02:00 PM - 04:00 PM', startHour: 14, period: 'Afternoon' },
    { id: '16-18', label: '04:00 PM - 06:00 PM', startHour: 16, period: 'Evening' },
    { id: '18-20', label: '06:00 PM - 08:00 PM', startHour: 18, period: 'Night' },
];

export const formatYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MeasurementSchedulePicker = ({
    value = {},
    onChange = () => {},
}) => {
    const now = new Date();
    const todayStr = formatYYYYMMDD(now);

    // Helper: is a slot in the past for today?
    const isSlotPassed = (slot, dateStr) => {
        if (dateStr !== todayStr) return false;
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        // Give 30 min buffer before slot start
        return (slot.startHour < currentHour) || (slot.startHour === currentHour && currentMin > 30);
    };

    const allSlotsPassedToday = TIME_SLOTS.every(slot => isSlotPassed(slot, todayStr));

    // Generate next 5 quick date options
    const dateOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(now.getDate() + i);
            const dateStr = formatYYYYMMDD(d);
            let label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            if (i === 0) label = allSlotsPassedToday ? 'Today (Full)' : 'Today';
            else if (i === 1) label = 'Tomorrow';

            options.push({
                dateStr,
                label,
                subLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                isToday: i === 0,
                disabled: i === 0 && allSlotsPassedToday,
            });
        }
        return options;
    }, [allSlotsPassedToday]);

    const defaultInitialDate = value.scheduledDate || (allSlotsPassedToday ? dateOptions[1]?.dateStr : todayStr);
    const [selectedDate, setSelectedDate] = useState(defaultInitialDate);
    const [selectedSlot, setSelectedSlot] = useState(value.scheduledTimeSlot || null);
    const [isAsap, setIsAsap] = useState(value.isAsap ?? (!value.scheduledTimeSlot || value.scheduledTimeSlot === 'ASAP'));

    // If today is chosen and current slot is passed, clear or fallback to next available
    useEffect(() => {
        if (!isAsap && selectedSlot && selectedSlot !== 'ASAP') {
            const activeSlotObj = TIME_SLOTS.find(s => s.label === selectedSlot);
            if (activeSlotObj && isSlotPassed(activeSlotObj, selectedDate)) {
                // Find first valid future slot today, or fallback to tomorrow
                const firstAvailable = TIME_SLOTS.find(s => !isSlotPassed(s, selectedDate));
                if (firstAvailable) {
                    setSelectedSlot(firstAvailable.label);
                } else {
                    // All slots passed for today, switch to Tomorrow
                    const tomorrow = dateOptions[1]?.dateStr;
                    if (tomorrow) {
                        setSelectedDate(tomorrow);
                        setSelectedSlot(TIME_SLOTS[0].label);
                    }
                }
            }
        }
    }, [selectedDate, isAsap]);

    // Propagate changes to parent
    useEffect(() => {
        if (isAsap) {
            onChange({
                scheduledDate: todayStr,
                scheduledTimeSlot: 'ASAP',
                scheduledTime: null,
                isAsap: true,
            });
        } else {
            // Compute ISO datetime from selectedDate & slot
            let computedTime = null;
            if (selectedDate && selectedSlot) {
                const slotObj = TIME_SLOTS.find(s => s.label === selectedSlot);
                if (slotObj) {
                    const d = new Date(selectedDate);
                    d.setHours(slotObj.startHour, 0, 0, 0);
                    computedTime = d.toISOString();
                }
            }

            onChange({
                scheduledDate: selectedDate,
                scheduledTimeSlot: selectedSlot || TIME_SLOTS[0].label,
                scheduledTime: computedTime,
                isAsap: false,
            });
        }
    }, [selectedDate, selectedSlot, isAsap]);

    const openDatePicker = () => {
        const [y, m, d] = String(selectedDate || todayStr).split('-').map(Number);
        DateTimePickerAndroid.open({
            value: new Date(y, (m || 1) - 1, d || 1),
            mode: 'date',
            minimumDate: new Date(),
            onChange: (event, date) => {
                if (event.type !== 'set' || !date) return;
                const v = formatYYYYMMDD(date);
                if (v >= todayStr) setSelectedDate(v);
            },
        });
    };

    return (
        <Box className="bg-white rounded-3xl p-4 border border-purple-100 shadow-xs space-y-5 relative overflow-hidden text-left">
            <Box className="absolute -top-10 -right-10 w-36 h-36 bg-[#843D9B]/5 rounded-full blur-2xl" pointerEvents="none" />
            <Box className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-3.5">
                <Box className="flex items-center gap-3">
                    <Box className="w-10 h-10 rounded-2xl bg-[#843D9B]/10 flex items-center justify-center shrink-0 shadow-xs">
                        <I icon={CalendarIcon} size={20} color="#843D9B" />
                    </Box>
                    <Box className="flex-1">
                        <Box className="flex items-center gap-2 flex-wrap">
                            <Txt className="text-sm font-black text-gray-900 tracking-tight">Schedule Measurement Visit</Txt>
                            <Txt className="px-2 py-0.5 rounded-full bg-[#843D9B]/10 text-[#843D9B] text-[9px] font-black uppercase tracking-wider">At Home</Txt>
                        </Box>
                        <Txt className="text-[11px] text-gray-500 font-medium">Expert executive will visit your address at the selected date & time slot.</Txt>
                    </Box>
                </Box>
                <Btn onPress={() => {
                    const nextAsap = !isAsap;
                    setIsAsap(nextAsap);
                    if (!nextAsap && !selectedSlot) {
                        const firstValid = TIME_SLOTS.find(s => !isSlotPassed(s, selectedDate));
                        setSelectedSlot(firstValid ? firstValid.label : TIME_SLOTS[0].label);
                    }
                }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${isAsap ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-md shadow-[#843D9B]/20' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    <I icon={Zap} size={13} color={isAsap ? '#fff' : '#f59e0b'} fill={isAsap ? '#fff' : 'none'} />
                    <Txt>{isAsap ? '⚡ ASAP (Next Available)' : 'Choose Specific Slot'}</Txt>
                </Btn>
            </Box>

            {isAsap ? (
                <Box className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/80 flex items-start gap-3">
                    <I icon={Sparkles} size={18} color="#843D9B" style={{ marginTop: 2 }} />
                    <Box className="flex-1">
                        <Txt className="text-xs font-bold text-gray-900">Fastest Visit Mode Selected (ASAP)</Txt>
                        <Txt className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">The nearest available measurement executive will be assigned immediately after advance payment verification.</Txt>
                    </Box>
                </Box>
            ) : (
                <Box className="space-y-4">
                    <Box>
                        <Box className="flex items-center justify-between mb-2">
                            <Box className="flex items-center gap-1.5">
                                <I icon={CalendarIcon} size={12} color="#843D9B" />
                                <Txt className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Select Date</Txt>
                            </Box>
                            <Btn onPress={openDatePicker} className="text-[11px] font-bold text-[#843D9B] bg-purple-50/60 border border-purple-200 rounded-lg px-2 py-0.5">{selectedDate}</Btn>
                        </Box>
                        <Box className="grid grid-cols-2 gap-2">
                            {dateOptions.map((opt) => {
                                const isSelected = selectedDate === opt.dateStr;
                                return (
                                    <Btn key={opt.dateStr} disabled={opt.disabled} onPress={() => { if (!opt.disabled) setSelectedDate(opt.dateStr); }}
                                        className={`py-2.5 px-3 rounded-2xl border text-center flex flex-col items-center justify-center ${opt.disabled ? 'bg-gray-100/70 border-gray-200 opacity-60' : isSelected ? 'bg-[#843D9B] border-[#843D9B] shadow-md shadow-[#843D9B]/25' : 'bg-gray-50/70 border-gray-200/80'}`}>
                                        <Txt className={`text-[10px] font-black tracking-wider uppercase ${opt.disabled ? 'text-gray-400' : isSelected ? 'text-purple-100' : 'text-gray-400'}`}>{opt.label}</Txt>
                                        <Txt className={`text-xs font-black mt-0.5 ${opt.disabled ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-900'}`}>{opt.subLabel}</Txt>
                                    </Btn>
                                );
                            })}
                        </Box>
                    </Box>
                    <Box>
                        <Box className="flex items-center justify-between mb-2">
                            <Box className="flex items-center gap-1.5">
                                <I icon={Clock} size={12} color="#843D9B" />
                                <Txt className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Select Time Slot</Txt>
                            </Box>
                            <Txt className="text-[10px] font-bold text-gray-400">{selectedDate === todayStr ? 'Past slots disabled for today' : 'All slots available'}</Txt>
                        </Box>
                        <Box className="flex flex-col gap-2.5">
                            {TIME_SLOTS.map((slot) => {
                                const passed = isSlotPassed(slot, selectedDate);
                                const isSelected = selectedSlot === slot.label && !passed;
                                return (
                                    <Btn key={slot.id} disabled={passed} onPress={() => { if (!passed) setSelectedSlot(slot.label); }}
                                        className={`p-3 rounded-2xl border text-left flex items-center justify-between relative ${passed ? 'bg-gray-100/60 border-gray-200 opacity-60' : isSelected ? 'bg-[#843D9B]/5 border-[#843D9B] ring-2 ring-[#843D9B]/30 shadow-sm' : 'bg-white border-gray-200/90'}`}>
                                        <Box className="min-w-0 pr-2 flex-1">
                                            <Txt className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${passed ? 'bg-gray-200 text-gray-400' : isSelected ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-600'}`}>{slot.period}</Txt>
                                            <Txt className={`text-xs font-black mt-1.5 truncate ${passed ? 'text-gray-400 line-through' : isSelected ? 'text-[#843D9B]' : 'text-gray-900'}`}>{slot.label}</Txt>
                                        </Box>
                                        {passed ? (
                                            <Txt className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">Passed</Txt>
                                        ) : isSelected ? (
                                            <Box className="w-5 h-5 rounded-full bg-[#843D9B] flex items-center justify-center shrink-0">
                                                <I icon={CheckCircle2} size={13} strokeWidth={3} color="#fff" />
                                            </Box>
                                        ) : (
                                            <Box className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                                        )}
                                    </Btn>
                                );
                            })}
                        </Box>
                    </Box>
                    <Box className="p-3 bg-purple-50/60 border border-purple-100/80 rounded-2xl flex items-center justify-between">
                        <Box className="flex items-center gap-2 flex-1">
                            <I icon={CheckCircle2} size={15} color="#843D9B" />
                            <Txt className="font-semibold text-xs text-gray-700 flex-1">
                                {'Visit Confirmed for: '}
                                <Txt className="text-[#843D9B] font-black">{selectedDate}</Txt>
                                {' at '}
                                <Txt className="text-[#843D9B] font-black">{selectedSlot || TIME_SLOTS[0].label}</Txt>
                            </Txt>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default MeasurementSchedulePicker;
