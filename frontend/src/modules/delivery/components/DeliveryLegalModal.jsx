import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DeliveryLegalModal({ isOpen, onClose, type = 'terms' }) {
  if (!isOpen) return null;

  const isPrivacy = type.toLowerCase().includes('privacy');
  const title = isPrivacy ? "Delivery Partner Privacy Policy" : "Delivery Partner Terms & Conditions";
  const legalUrl = isPrivacy ? "/delivery/legal/privacy-policy" : "/delivery/legal/terms-and-conditions";

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D2F6F] to-[#843D9B] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">{title}</h2>
              <p className="text-xs text-indigo-100 font-medium">SewZella Delivery Partner Legal Terms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-slate-600 text-sm leading-relaxed custom-scrollbar">
          {isPrivacy ? (
            <>
              <p className="font-semibold text-slate-800">Effective Date: January 1, 2026</p>
              <p>SewZella ("we", "our", or "us") values your privacy. This policy details how we collect, use, and protect your information when enrolling and serving as a Delivery Partner.</p>
              
              <h3 className="text-base font-bold text-slate-900 mt-4">1. Information Collection</h3>
              <p>We collect personal details (name, phone number, national ID), vehicle details (driver's license, vehicle registration), real-time GPS location during active shifts for order routing, and bank details for payouts.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">2. Use of Information</h3>
              <p>Your details are strictly used to process registration, assign delivery orders, calculate payouts, and ensure safety across the SewZella logistics network.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">3. Data Sharing & Security</h3>
              <p>We implement strict security measures. We do not sell your personal data. Limited location data is shared with customers only while an order is actively in transit.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-800">Effective Date: January 1, 2026</p>
              <p>Welcome to SewZella. By registering and operating as a Delivery Partner, you agree to comply with these Terms and Conditions.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">1. Partner Eligibility</h3>
              <p>You must be at least 18 years old, possess a valid driver's license, active mobile number, valid vehicle documents, and submit truthful registration details.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">2. Service Standards</h3>
              <p>Partners must accept assigned orders promptly, maintain accurate online/offline status, observe traffic safety rules, and handle items with care.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">3. Earnings & Payouts</h3>
              <p>Payouts and incentives are calculated per completed delivery and deposited into your registered bank account or wallet according to schedule.</p>

              <h3 className="text-base font-bold text-slate-900 mt-4">4. Account Conduct & Safety</h3>
              <p>Violations of safety guidelines, misconduct, or account sharing may lead to immediate suspension or deactivation of partner status.</p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href={legalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#843D9B] hover:underline flex items-center gap-1"
          >
            Open full page in new tab <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#843D9B] hover:bg-[#6e3082] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
