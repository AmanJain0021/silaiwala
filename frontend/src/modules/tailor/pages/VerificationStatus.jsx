import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, ChevronRight, Info, Loader2, Save, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../../components/Common/ImageUploader';
import { useTailorAuth, TAILOR_STATUS } from '../context/AuthContext';

const VerificationStatus = () => {
    const navigate = useNavigate();
    const { status } = useTailorAuth();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [localDocs, setLocalDocs] = useState([]);

    const fetchVerification = async () => {
        try {
            const res = await api.get('/tailors/me');
            if (res.data.success) {
                setProfile(res.data.data);
                setLocalDocs(res.data.data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVerification();
    }, []);

    useEffect(() => {
        if (status === TAILOR_STATUS.APPROVED) {
            navigate('/partner', { replace: true });
        }
    }, [status, navigate]);

    const uploadBulkFiles = async (filesArray) => {
        const formData = new FormData();
        let hasFiles = false;
        
        filesArray.forEach(item => {
            if (item.file instanceof File) {
                formData.append('images', item.file);
                hasFiles = true;
            }
        });
        
        if (!hasFiles) return [];
        
        try {
            formData.append('folder', 'tailor_registration');
            const res = await api.post('/upload/public/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.data || [];
        } catch (error) {
            console.error('Bulk file upload failed:', error);
            return [];
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Find which docs have new File objects
            const filesToUpload = localDocs
                .map((doc, index) => ({ index, file: doc.newFile }))
                .filter(item => item.file);

            let uploadedUrls = [];
            if (filesToUpload.length > 0) {
                uploadedUrls = await uploadBulkFiles(filesToUpload);
                if (uploadedUrls.length !== filesToUpload.length) {
                    toast.error("Some images failed to upload.");
                    setIsSaving(false);
                    return;
                }
            }

            // Construct new documents array
            let urlIndex = 0;
            const updatedDocs = localDocs.map((doc, i) => {
                const isUploaded = filesToUpload.find(f => f.index === i);
                return {
                    name: doc.name,
                    url: isUploaded ? uploadedUrls[urlIndex++] : doc.url,
                    status: 'pending', // Re-uploading resets status
                    remarks: ''
                };
            });

            const res = await api.patch('/tailors/documents', { documents: updatedDocs });
            if (res.data.success) {
                toast.success('Documents submitted for review!');
                setProfile(res.data.data);
                setLocalDocs(res.data.data.documents || []);
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update documents');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (index, file) => {
        const newDocs = [...localDocs];
        newDocs[index].newFile = file;
        setLocalDocs(newDocs);
    };

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
    const progress = documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0;
    const hasRejected = documents.some(doc => doc.status === 'rejected');

    return (
        <div className="space-y-4 animate-in fade-in duration-500 bg-[#0A0A0A] min-h-screen p-4 pb-24">
            
            {/* Overall Status Banner */}
            {profile?.registrationStatus === 'rejected' && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 mb-4">
                    <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-red-400">Profile Rejected</h4>
                        <p className="text-xs text-red-300/80 mt-1">{profile.rejectionReason || 'Please update the rejected documents below.'}</p>
                    </div>
                </div>
            )}

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
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-black text-white/25 uppercase tracking-[0.2em]">Digital Registry</h4>
                    {isEditing && (
                        <button onClick={() => setIsEditing(false)} className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest flex items-center gap-1">
                            <X size={12} /> Cancel
                        </button>
                    )}
                </div>
                
                {documents.length === 0 ? (
                    <div className="bg-[#111111] p-8 rounded-3xl border-2 border-dashed border-[#2A2A2A] text-center">
                        <p className="text-sm font-bold text-white/25">No documents uploaded yet.</p>
                    </div>
                ) : (
                    localDocs.map((doc, idx) => (
                        <div key={idx} className={`bg-[#111111] p-4 rounded-3xl border border-[#1E1E1E] flex flex-col gap-3`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-white/25">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{doc.name}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                                            doc.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {doc.status === 'verified' ? 'verified' : 'pending'}
                                        </p>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <div className={`p-2 rounded-xl ${
                                        doc.status === 'verified' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                    }`}>
                                        {doc.status === 'verified' ? (
                                            <ShieldCheck className="text-emerald-400" size={18} />
                                        ) : (
                                            <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>
                                )}
                            </div>
                            


                            {/* Edit Mode Upload UI */}
                            {isEditing && (
                                <div className="mt-2">
                                    {doc.status === 'verified' ? (
                                        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                                            <p className="text-xs text-white/40 text-center font-medium">Already verified. Cannot be changed.</p>
                                        </div>
                                    ) : (
                                        <div className="dark-theme-uploader">

                                            <ImageUploader
                                                value={doc.newFile || doc.url}
                                                onChange={(file) => handleFileChange(idx, file)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Action Buttons */}
            {documents.length > 0 && !isEditing && (hasRejected || profile?.registrationStatus === 'pending' || profile?.registrationStatus === 'rejected') && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-[#111111] border border-[#1E1E1E] p-4 rounded-3xl flex items-center justify-between hover:border-[#2D2F6E]/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#2D2F6E]/10 rounded-2xl flex items-center justify-center text-[#2D2F6E]">
                            <FileText size={16} />
                        </div>
                        <span className="text-xs font-black text-white/60 uppercase tracking-widest">Update Documents</span>
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-[#2D2F6E] transition-colors" />
                </button>
            )}

            {isEditing && (
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#2D2F6E] p-4 rounded-3xl flex items-center justify-center gap-2 hover:bg-[#1e204c] transition-all disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin text-white/60" size={18} />
                            <span className="text-xs font-black text-white/80 uppercase tracking-widest">Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} className="text-white" />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Submit Updates</span>
                        </>
                    )}
                </button>
            )}
            
            <style>{`
                .dark-theme-uploader label { color: rgba(255,255,255,0.4); }
                .dark-theme-uploader .bg-gray-50 { background-color: #1A1A1A; border-color: #2A2A2A; }
                .dark-theme-uploader .text-gray-700 { color: rgba(255,255,255,0.8); }
                .dark-theme-uploader .text-gray-400 { color: rgba(255,255,255,0.4); }
                .dark-theme-uploader .bg-indigo-50 { background-color: #2D2F6E20; }
                .dark-theme-uploader .text-indigo-500 { color: #2D2F6E; }
                .dark-theme-uploader .hover\\:bg-\\[\\#F8F9FD\\]:hover { background-color: #1a1a24; }
            `}</style>
        </div>
    );
};

export default VerificationStatus;
