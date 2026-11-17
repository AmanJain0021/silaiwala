// Port of modules/tailor/pages/VerificationStatus.jsx (converted with scripts/web2rn.js, then reviewed)
import { isPickedFile } from '../lib/files';
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { ShieldCheck, ShieldAlert, FileText, ChevronRight, Info, Loader2, Save, X } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import ImageUploader from "../components/common/ImageUploader";
import { useTailorAuth, TAILOR_STATUS } from "../context/tailor/AuthContext";
import { Box, Txt, I, Btn, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const VerificationStatus = () => {
  const navigate = useNavigate();
  const {
    status
  } = useTailorAuth();
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
      navigate('/partner', {
        replace: true
      });
    }
  }, [status, navigate]);
  const uploadBulkFiles = async filesArray => {
    const formData = new FormData();
    let hasFiles = false;
    filesArray.forEach(item => {
      if (isPickedFile(item.file)) {
        formData.append('images', item.file);
        hasFiles = true;
      }
    });
    if (!hasFiles) return [];
    try {
      formData.append('folder', 'tailor_registration');
      const res = await api.post('/upload/public/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
      const filesToUpload = localDocs.map((doc, index) => ({
        index,
        file: doc.newFile
      })).filter(item => item.file);
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
          status: 'pending',
          // Re-uploading resets status
          remarks: ''
        };
      });
      const res = await api.patch('/tailors/documents', {
        documents: updatedDocs
      });
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
    return <Box className="min-h-[400px] flex flex-col items-center justify-center gap-3 bg-gray-50">
                <Spin className="animate-spin text-[#843D9B]" size={32} />
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checking Documents...</Txt>
            </Box>;
  }
  const documents = profile?.documents || [];
  const verifiedCount = documents.filter(doc => doc.status === 'verified').length;
  const progress = documents.length > 0 ? Math.round(verifiedCount / documents.length * 100) : 0;
  const hasRejected = documents.some(doc => doc.status === 'rejected');
  return <Box className="space-y-4 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen p-4 pb-24">
            
            {/* Overall Status Banner */}
            {profile?.registrationStatus === 'rejected' && <Box className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 mb-4">
                    <I icon={ShieldAlert} className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <Box>
                        <Txt className="text-sm font-bold text-red-400">Profile Rejected</Txt>
                        <Txt className="text-xs text-red-300/80 mt-1">{profile.rejectionReason || 'Please update the rejected documents below.'}</Txt>
                    </Box>
                </Box>}

            {/* Progress Card */}
            <Box className="bg-[#843D9B] p-7 rounded-3xl text-white relative overflow-hidden">
                <Box className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <Box className="absolute right-5 bottom-5 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                <Txt className="text-[11px] font-black tracking-widest uppercase opacity-60">Verification Status</Txt>
                <Box className="mt-4 flex items-end gap-3">
                    <Txt className="text-[52px] leading-none font-black tracking-tighter">{progress}%</Txt>
                    <Txt className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] pb-2">Complete</Txt>
                </Box>
                <Box className="h-2 w-full bg-white/10 rounded-full mt-5 overflow-hidden border border-white/10">
                    <Box className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.4)]" style={{
          width: `${progress}%`
        }} />
                </Box>
            </Box>

            {/* Documents List */}
            <Box className="space-y-3">
                <Box className="flex items-center justify-between px-1">
                    <Txt className="text-[11px] font-black text-white/25 uppercase tracking-[0.2em]">Digital Registry</Txt>
                    {isEditing && <Btn onPress={() => setIsEditing(false)} className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest flex items-center gap-1">
                            <I icon={X} size={12} /> Cancel
                        </Btn>}
                </Box>
                
                {documents.length === 0 ? <Box className="bg-[#111111] p-8 rounded-3xl border-2 border-dashed border-[#2A2A2A] text-center">
                        <Txt className="text-sm font-bold text-white/25">No documents uploaded yet.</Txt>
                    </Box> : localDocs.map((doc, idx) => <Box key={idx} className={`bg-[#111111] p-4 rounded-3xl border border-[#1E1E1E] flex flex-col gap-3`}>
                            <Box className="flex items-center justify-between">
                                <Box className="flex items-center gap-3">
                                    <Box className="h-11 w-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-white/25">
                                        <I icon={FileText} size={18} />
                                    </Box>
                                    <Box>
                                        <Txt className="text-sm font-black text-white">{doc.name}</Txt>
                                        <Txt className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${doc.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {doc.status === 'verified' ? 'verified' : 'pending'}
                                        </Txt>
                                    </Box>
                                </Box>
                                {!isEditing && <Box className={`p-2 rounded-xl ${doc.status === 'verified' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                        {doc.status === 'verified' ? <I icon={ShieldCheck} className="text-emerald-400" size={18} /> : <Spin size={16} className="text-amber-400" />}
                                    </Box>}
                            </Box>
                            


                            {/* Edit Mode Upload UI */}
                            {isEditing && <Box className="mt-2">
                                    {doc.status === 'verified' ? <Box className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                                            <Txt className="text-xs text-white/40 text-center font-medium">Already verified. Cannot be changed.</Txt>
                                        </Box> : <Box className="dark-theme-uploader">

                                            <ImageUploader dark value={doc.newFile || doc.url} onChange={file => handleFileChange(idx, file)} />
                                        </Box>}
                                </Box>}
                        </Box>)}
            </Box>

            {/* Action Buttons */}
            {documents.length > 0 && !isEditing && (hasRejected || profile?.registrationStatus === 'pending' || profile?.registrationStatus === 'rejected') && <Btn onPress={() => setIsEditing(true)} className="w-full bg-[#111111] border border-[#1E1E1E] p-4 rounded-3xl flex items-center justify-between hover:border-[#843D9B]/30 transition-all group">
                    <Box className="flex items-center gap-3">
                        <Box className="h-9 w-9 bg-[#843D9B]/10 rounded-2xl flex items-center justify-center text-[#843D9B]">
                            <I icon={FileText} size={16} />
                        </Box>
                        <Txt className="text-xs font-black text-white/60 uppercase tracking-widest">Update Documents</Txt>
                    </Box>
                    <I icon={ChevronRight} size={16} className="text-white/20 group-hover:text-[#843D9B] transition-colors" />
                </Btn>}

            {isEditing && <Btn onPress={handleSave} disabled={isSaving} className="w-full bg-[#843D9B] p-4 rounded-3xl flex items-center justify-center gap-2 hover:bg-[#1e204c] transition-all disabled:opacity-50">
                    {isSaving ? <>
                            <Spin className="animate-spin text-white/60" size={18} />
                            <Txt className="text-xs font-black text-white/80 uppercase tracking-widest">Saving...</Txt>
                        </> : <>
                            <I icon={Save} size={18} className="text-white" />
                            <Txt className="text-xs font-black text-white uppercase tracking-widest">Submit Updates</Txt>
                        </>}
                </Btn>}
        </Box>;
};
export default VerificationStatus;