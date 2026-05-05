import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileText, ChevronRight, Info, Loader2 } from 'lucide-react';
import api from '../services/api';

const VerificationStatus = () => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                const res = await api.get('/tailors/me');
                if (res.data.success) setProfile(res.data.data);
            } catch (error) {
                console.error('Error fetching verification status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVerification();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 bg-[#0A0A0A]">
                <Loader2 className="animate-spin text-[#2D2F6E]" size={32} />
                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Checking Documents...</p>
            </div>
        );
    }

    const documents = profile?.documents || [];
    const verifiedCount = documents.filter(doc => doc.status === 'verified').length;
    const progress = documents.length > 0 ? Math.round((verifiedCount / 4) * 100) : 0;

    return (
        <div className="space-y-4 animate-in fade-in duration-500 bg-[#0A0A0A] min-h-screen p-4">

            {/* Progress Card */}
            <div className="bg-[#2D2F6E] p-7 rounded-3xl text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-5 bottom-5 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                <h4 className="text-[11px] font-black tracking-widest uppercase opacity-60">Verification Status</h4>
                <div className="mt-4 flex items-end gap-3">
                    <span className="text-[52px] leading-none font-black tracking-tighter">{progress}%</span>
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] pb-2">Complete</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full mt-5 overflow-hidden border border-white/10">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
                <h4 className="text-[11px] font-black text-white/25 uppercase tracking-[0.2em] px-1">Digital Registry</h4>
                {documents.length === 0 ? (
                    <div className="bg-[#111111] p-8 rounded-3xl border-2 border-dashed border-[#2A2A2A] text-center">
                        <p className="text-sm font-bold text-white/25">No documents uploaded yet.</p>
                    </div>
                ) : (
                    documents.map((doc, idx) => (
                        <div key={idx} className="bg-[#111111] p-4 rounded-3xl border border-[#1E1E1E] flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-white/25">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{doc.name}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                                            doc.status === 'verified' ? 'text-emerald-400' :
                                            doc.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                                        }`}>
                                            {doc.status}
                                        </p>
                                    </div>
                                </div>
                                <div className={`p-2 rounded-xl ${
                                    doc.status === 'verified' ? 'bg-emerald-500/10' :
                                    doc.status === 'rejected' ? 'bg-red-500/10' : 'bg-amber-500/10'
                                }`}>
                                    {doc.status === 'verified' ? (
                                        <ShieldCheck className="text-emerald-400" size={18} />
                                    ) : doc.status === 'rejected' ? (
                                        <ShieldAlert className="text-red-400" size={18} />
                                    ) : (
                                        <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>
                            </div>
                            {doc.status === 'rejected' && doc.remarks && (
                                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <Info size={13} className="text-red-400 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-300 leading-tight">Reason: {doc.remarks}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Update Button */}
            <button className="w-full bg-[#111111] border border-[#1E1E1E] p-4 rounded-3xl flex items-center justify-between hover:border-[#2D2F6E]/30 transition-all group">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-[#2D2F6E]/10 rounded-2xl flex items-center justify-center text-[#2D2F6E]">
                        <FileText size={16} />
                    </div>
                    <span className="text-xs font-black text-white/60 uppercase tracking-widest">Update Documents</span>
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-[#2D2F6E] transition-colors" />
            </button>
        </div>
    );
};

export default VerificationStatus;
