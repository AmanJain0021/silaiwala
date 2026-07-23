import React from 'react';
import { Check } from 'lucide-react';
import {
  OFFLINE_PIPELINE_STEPS,
  normalizeOfflineStatus,
  pipelineStepIndex,
  getOfflineStatusLabel,
} from '../constants/offlineOrderStatus';

/**
 * Visual production pipeline + quick status actions (admin / tailor).
 */
const OfflineProductionPipeline = ({
  currentStatus,
  onSelectStatus,
  disabled,
  compact,
}) => {
  const isCancelled = currentStatus === 'cancelled';
  const currentIdx = pipelineStepIndex(currentStatus);
  const normalizedCurrent = normalizeOfflineStatus(currentStatus);

  return (
    <div className="space-y-3">
      <div className={`${compact ? 'space-y-2' : 'space-y-0'}`}>
        {OFFLINE_PIPELINE_STEPS.map((step, idx) => {
          const isDone = !isCancelled && idx < currentIdx;
          const isCurrent = !isCancelled && step.value === normalizedCurrent;
          const isUpcoming = !isCancelled && idx > currentIdx;

          return (
            <div key={step.value} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isDone
                      ? 'bg-primary border-primary text-white'
                      : isCurrent
                        ? 'bg-white border-primary text-primary'
                        : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                </div>
                {idx < OFFLINE_PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[12px] my-0.5 ${
                      isDone ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className={`flex-1 pb-3 ${compact ? 'pb-2' : ''}`}>
                <button
                  type="button"
                  disabled={disabled || isCancelled}
                  onClick={() => onSelectStatus?.(step.value)}
                  className={`text-left w-full rounded-xl border px-3 py-2 transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : isUpcoming
                        ? 'border-gray-100 bg-white hover:border-primary/40'
                        : 'border-gray-100 bg-gray-50'
                  } ${onSelectStatus && !isCancelled ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isCurrent ? 'text-primary' : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-gray-500 mt-0.5">Current stage</p>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <p className="text-xs font-bold text-red-600 text-center py-2">Order cancelled</p>
      )}

      {onSelectStatus && !isCancelled && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelectStatus('cancelled')}
            className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:underline disabled:opacity-50"
          >
            Mark cancelled
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-[10px] text-gray-400">
            Now: {getOfflineStatusLabel(currentStatus)}
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineProductionPipeline;
