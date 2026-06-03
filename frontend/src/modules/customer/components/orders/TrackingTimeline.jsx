import React from 'react';
import { Check, Clock } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const TrackingTimeline = ({ states, currentIndex }) => {
    return (
        <div className="relative pl-2 py-2">
            {/* Vertical Progress Line */}
            <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-gray-100 -z-0">
                <div 
                    className="w-full bg-green-500 transition-all duration-1000 ease-in-out origin-top" 
                    style={{ height: `${(Math.min(currentIndex, states.length - 1) / (states.length - 1)) * 100}%` }}
                />
            </div>
            
            <div className="flex flex-col gap-4 relative z-10">
                {states.map((state, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                        <div key={index} className="flex items-start gap-3 group">
                            {/* Dot / Icon Container */}
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-700 bg-white border-2 shrink-0",
                                isCompleted ? "border-green-500 text-green-500 shadow-sm" : "border-gray-200 text-gray-300",
                                isCurrent && "ring-4 ring-green-100 scale-110 z-20"
                            )}>
                                {isCompleted ? (
                                    <Check size={14} strokeWidth={4} className="animate-in zoom-in duration-300" />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-0.5">
                                <div className="flex justify-between items-center gap-2">
                                    <h4 className={cn(
                                        "text-[13px] font-black uppercase tracking-wide transition-colors duration-500",
                                        isCompleted ? "text-gray-900" : "text-gray-400"
                                    )}>
                                        {state.label}
                                    </h4>
                                    <p className={cn(
                                        "text-[10px] font-bold transition-opacity duration-500 flex items-center gap-1",
                                        isCompleted ? "text-gray-500 opacity-100" : "text-gray-300 opacity-100"
                                    )}>
                                        {state.completed && state.time ? (
                                            <>{state.time}</>
                                        ) : (
                                            <span className="flex items-center gap-1"><Clock size={10} /> Pending</span>
                                        )}
                                    </p>
                                </div>
                                
                                {/* Granular sub-events / tracking history injected here */}
                                {state.subEvents && state.subEvents.length > 0 && (
                                    <div className="mt-3 mb-1 space-y-2.5">
                                        {state.subEvents.map((event, idx) => (
                                            <div key={idx} className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-600 leading-tight">{event.message}</p>
                                                    <p className="text-[9px] font-medium text-gray-400">{event.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isCurrent && (!state.subEvents || state.subEvents.length === 0) && (
                                    <p className="text-[10px] text-primary font-bold mt-1 animate-pulse">
                                        In progress...
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrackingTimeline;
