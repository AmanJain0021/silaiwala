import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const TIME_SLOTS = [
    { id: '10-12', label: '10:00 AM - 12:00 PM', startHour: 10, period: 'Morning' },
    { id: '12-14', label: '12:00 PM - 02:00 PM', startHour: 12, period: 'Noon' },
    { id: '14-16', label: '02:00 PM - 04:00 PM', startHour: 14, period: 'Afternoon' },
    { id: '16-18', label: '04:00 PM - 06:00 PM', startHour: 16, period: 'Evening' },
    { id: '18-20', label: '06:00 PM - 08:00 PM', startHour: 18, period: 'Night' },
];

const formatYYYYMMDD = (date) => {
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

    return (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-purple-100 shadow-xs space-y-5 relative overflow-hidden text-left">
            {/* Ambient subtle decorative background glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#843D9B]/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center shrink-0 shadow-xs">
                        <CalendarIcon size={20} className="text-[#843D9B]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                                Schedule Measurement Visit
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#843D9B]/10 text-[#843D9B] text-[9px] font-black uppercase tracking-wider">
                                At Home
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                            Expert executive will visit your address at the selected date & time slot.
                        </p>
                    </div>
                </div>

                {/* ASAP Toggle Button */}
                <button
                    type="button"
                    onClick={() => {
                        const nextAsap = !isAsap;
                        setIsAsap(nextAsap);
                        if (!nextAsap && !selectedSlot) {
                            const firstValid = TIME_SLOTS.find(s => !isSlotPassed(s, selectedDate));
                            setSelectedSlot(firstValid ? firstValid.label : TIME_SLOTS[0].label);
                        }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isAsap
                            ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-md shadow-[#843D9B]/20'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                    <Zap size={13} className={isAsap ? 'fill-white text-white' : 'text-amber-500'} />
                    <span>{isAsap ? '⚡ ASAP (Next Available)' : 'Choose Specific Slot'}</span>
                </button>
            </div>

            {/* If ASAP selected, show minimal notification badge */}
            {isAsap ? (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/80 flex items-start gap-3">
                    <Sparkles size={18} className="text-[#843D9B] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-900">
                            Fastest Visit Mode Selected (ASAP)
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                            The nearest available measurement executive will be assigned immediately after advance payment verification.
                        </p>
                    </div>
                </div>
            ) : (
                /* Date & Slot selection */
                <div className="space-y-4">
                    {/* 1. Date Selection Pills */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarIcon size={12} className="text-[#843D9B]" /> Select Date
                            </label>
                            <input
                                type="date"
                                min={todayStr}
                                value={selectedDate}
                                onChange={(e) => {
                                    if (e.target.value >= todayStr) {
                                        setSelectedDate(e.target.value);
                                    }
                                }}
                                className="text-[11px] font-bold text-[#843D9B] bg-purple-50/60 border border-purple-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {dateOptions.map((opt) => {
                                const isSelected = selectedDate === opt.dateStr;
                                return (
                                    <button
                                        key={opt.dateStr}
                                        type="button"
                                        disabled={opt.disabled}
                                        onClick={() => {
                                            if (!opt.disabled) setSelectedDate(opt.dateStr);
                                        }}
                                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                                            opt.disabled
                                                ? 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : isSelected
                                                ? 'bg-[#843D9B] border-[#843D9B] text-white shadow-md shadow-[#843D9B]/25 scale-[1.02] cursor-pointer'
                                                : 'bg-gray-50/70 border-gray-200/80 text-gray-700 hover:border-purple-300 hover:bg-purple-50/40 cursor-pointer'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-black tracking-wider uppercase ${
                                            opt.disabled ? 'text-gray-400' : isSelected ? 'text-purple-100' : 'text-gray-400'
                                        }`}>
                                            {opt.label}
                                        </span>
                                        <span className={`text-xs font-black mt-0.5 ${
                                            opt.disabled ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {opt.subLabel}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Time Slot Chips */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} className="text-[#843D9B]" /> Select Time Slot
                            </label>
                            <span className="text-[10px] font-bold text-gray-400">
                                {selectedDate === todayStr ? 'Past slots disabled for today' : 'All slots available'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {TIME_SLOTS.map((slot) => {
                                const passed = isSlotPassed(slot, selectedDate);
                                const isSelected = selectedSlot === slot.label && !passed;

                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        disabled={passed}
                                        onClick={() => {
                                            if (!passed) setSelectedSlot(slot.label);
                                        }}
                                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all relative ${
                                            passed
                                                ? 'bg-gray-100/60 border-gray-200 text-gray-300 cursor-not-allowed opacity-60'
                                                : isSelected
                                                ? 'bg-[#843D9B]/5 border-[#843D9B] ring-2 ring-[#843D9B]/30 shadow-sm cursor-pointer'
                                                : 'bg-white border-gray-200/90 hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer text-gray-800'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                                passed
                                                    ? 'bg-gray-200 text-gray-400'
                                                    : isSelected
                                                    ? 'bg-[#843D9B] text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {slot.period}
                                            </span>
                                            <p className={`text-xs font-black mt-1.5 truncate ${
                                                passed ? 'text-gray-400 line-through' : isSelected ? 'text-[#843D9B]' : 'text-gray-900'
                                            }`}>
                                                {slot.label}
                                            </p>
                                        </div>

                                        {passed ? (
                                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">
                                                Passed
                                            </span>
                                        ) : isSelected ? (
                                            <div className="w-5 h-5 rounded-full bg-[#843D9B] text-white flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={13} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary banner */}
                    <div className="p-3 bg-purple-50/60 border border-purple-100/80 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle2 size={15} className="text-[#843D9B] shrink-0" />
                            <span className="font-semibold">
                                Visit Confirmed for: <strong className="text-[#843D9B] font-black">{selectedDate}</strong> at <strong className="text-[#843D9B] font-black">{selectedSlot || TIME_SLOTS[0].label}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeasurementSchedulePicker;
