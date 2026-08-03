import React, { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, Package, Layers, Scissors, Shirt, Box, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const DefaultIcons = {
    'pending': Package,
    'fabric-received': Layers,
    'cutting': Scissors,
    'stitching': Shirt,
    'completed': Box,
    'ready-for-delivery': ShoppingBag,
    'out-for-delivery': Truck,
    'delivered': CheckCircle2
};

const TrackingTimeline = ({ states = [], currentIndex = 0 }) => {
    const [expandedStages, setExpandedStages] = useState({
        'fabric-received': true,
        'out-for-delivery': true
    });

    const toggleExpand = (stageKey) => {
        setExpandedStages(prev => ({
            ...prev,
            [stageKey]: !prev[stageKey]
        }));
    };

    if (!states || states.length === 0) return null;

    // Check if the entire timeline is completed
    const isAllCompleted = states.every(s => s.completed);

    const progressPercentage = Math.min(100, Math.max(0, (currentIndex / (states.length - 1)) * 100));

    return (
        <div className="relative px-1 py-2 font-sans">
            <div className="relative">
                {/* Background Vertical Line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gray-100 z-0" />
                
                {/* Active Progress Line (Turns Emerald Green when order is fully delivered) */}
                <div 
                    className={cn(
                        "absolute left-[19px] top-6 w-[2px] transition-all duration-700 ease-in-out z-0 origin-top",
                        isAllCompleted ? "bg-emerald-500" : "bg-[#843D9B]"
                    )}
                    style={{ height: `${progressPercentage}%` }}
                />

                <div className="flex flex-col gap-5 relative z-10">
                    {states.map((state, index) => {
                        const isStageDone = !!state.completed;

                        // A stage is completed if it's done AND (before current index OR all stages completed)
                        const isCompleted = isStageDone && (index < currentIndex || isAllCompleted);
                        // A stage is current ONLY IF it's the active in-progress stage and order isn't fully completed
                        const isCurrent = isStageDone && !isAllCompleted && index === currentIndex;
                        const isFuture = !isStageDone;

                        const hasSubEvents = state.subEvents && state.subEvents.length > 0;
                        const isExpanded = expandedStages[state.key] !== false;

                        const IconComp = state.icon || DefaultIcons[state.key] || Package;

                        return (
                            <div key={state.key || index} className="flex flex-col">
                                <div className="flex items-center justify-between gap-3 group">
                                    {/* Left Node */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 border-2",
                                            isCompleted && "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm",
                                            isCurrent && "bg-[#843D9B] border-[#843D9B] text-white ring-4 ring-[#843D9B]/15 scale-105 shadow-md",
                                            isFuture && "bg-gray-50 border-gray-200 text-gray-300 opacity-60"
                                        )}>
                                            {isCompleted ? (
                                                <Check size={18} strokeWidth={3} />
                                            ) : (
                                                <IconComp size={18} strokeWidth={2.2} />
                                            )}
                                        </div>

                                        {/* Label & Description */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn(
                                                "text-xs sm:text-sm font-black tracking-tight transition-colors leading-tight",
                                                isCompleted && "text-emerald-800 font-bold",
                                                isCurrent && "text-[#843D9B]",
                                                isFuture && "text-gray-400"
                                            )}>
                                                {state.label}
                                            </h4>
                                            <p className={cn(
                                                "text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 truncate",
                                                isCompleted && "text-emerald-600 font-semibold",
                                                isCurrent && "text-gray-500",
                                                isFuture && "text-gray-300"
                                            )}>
                                                {state.desc || (isCompleted ? 'Completed' : 'Pending')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Timestamp & Expand Toggle */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-bold",
                                            isCompleted && "text-emerald-600 font-extrabold",
                                            isCurrent && "text-[#843D9B]",
                                            isFuture && "text-gray-300"
                                        )}>
                                            {state.completed && state.time ? (
                                                state.time
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-300">
                                                    <Clock size={10} /> Pending
                                                </span>
                                            )}
                                        </span>

                                        {hasSubEvents ? (
                                            <button 
                                                onClick={() => toggleExpand(state.key)}
                                                className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-[#843D9B]/10 hover:text-[#843D9B] flex items-center justify-center transition-colors"
                                                title="Toggle Details"
                                            >
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        ) : (
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                                isCompleted && "bg-emerald-500 text-white shadow-sm",
                                                isCurrent && "bg-[#843D9B] text-white shadow-sm",
                                                isFuture && "bg-gray-100 text-gray-300"
                                            )}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expandable Activity Log Box */}
                                {hasSubEvents && isExpanded && (
                                    <div className={cn(
                                        "ml-13 mt-2 mb-1 p-3.5 rounded-2xl border space-y-2.5 animate-in fade-in duration-300",
                                        isCompleted ? "bg-emerald-50/50 border-emerald-100" : "bg-gray-50/80 border-gray-100"
                                    )}>
                                        {state.subEvents.map((event, idx) => (
                                            <div key={idx} className="flex items-start justify-between gap-3 text-[10px] sm:text-[11px]">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                                        isCompleted ? "bg-emerald-500" : "bg-[#843D9B]"
                                                    )} />
                                                    <span className="font-semibold text-gray-700 leading-snug">
                                                        {event.message}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "font-bold shrink-0 text-[10px]",
                                                    isCompleted ? "text-emerald-700" : "text-[#843D9B]"
                                                )}>
                                                    {event.time}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TrackingTimeline;
