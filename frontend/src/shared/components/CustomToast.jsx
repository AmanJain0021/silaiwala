import React from 'react';
import { resolveValue, toast } from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export const CustomToastCard = ({ t }) => {
  const messageVal = resolveValue(t.message, t);
  const isError = t.type === 'error';

  let title = '';
  let body = '';

  if (typeof messageVal === 'object' && messageVal !== null && !React.isValidElement(messageVal)) {
    title = messageVal.title || (isError ? 'Something went wrong' : 'Successful');
    body = messageVal.body || messageVal.message || '';
  } else if (typeof messageVal === 'string') {
    if (messageVal.includes('\n')) {
      const parts = messageVal.split('\n');
      title = parts[0];
      body = parts.slice(1).join(' ');
    } else {
      // Determine if text looks like a short heading or full message
      if (messageVal.length < 32 && !messageVal.endsWith('.')) {
        title = messageVal;
        body = '';
      } else {
        title = isError ? 'Something went wrong' : 'Action Successful';
        body = messageVal;
      }
    }
  } else {
    title = isError ? 'Something went wrong' : 'Successful';
  }

  return (
    <div
      className={`${
        t.visible ? 'animate-enter opacity-100 translate-y-0 scale-100' : 'animate-leave opacity-0 -translate-y-2 scale-95'
      } relative overflow-hidden bg-white text-[#0F172A] rounded-[20px] shadow-2xl shadow-[#843D9B]/15 border border-[#E9DFFE] flex items-center p-3.5 sm:p-4 gap-3.5 min-w-[290px] sm:min-w-[340px] max-w-[420px] w-full border-l-[6px] ${
        isError ? 'border-l-rose-500' : 'border-l-[#843D9B]'
      } transition-all duration-300 font-['Plus_Jakarta_Sans',sans-serif] pointer-events-auto select-none my-1`}
    >
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isError ? 'bg-rose-100 text-rose-600' : 'bg-[#F4EFFF]'
        }`}
      >
        {isError ? (
          <span className="font-extrabold text-xl leading-none text-rose-600 font-sans">!</span>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center shadow-xs">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Content text */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-bold text-sm sm:text-[15px] text-[#0F172A] tracking-tight leading-snug">
          {title}
        </h4>
        {body ? (
          <p className="text-xs font-medium text-[#64748B] mt-0.5 leading-snug break-words">
            {body}
          </p>
        ) : null}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#843D9B] hover:bg-[#F4EFFF] transition-colors shrink-0 cursor-pointer -mr-1"
        aria-label="Close notification"
      >
        <X size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default CustomToastCard;
