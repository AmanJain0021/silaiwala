// Port of components/service-detail/MeasurementSelector.jsx (logic verbatim)
import React, { useState } from 'react';
import { Ruler, Upload, User, ChevronDown, ChevronUp, CheckCircle2, Home, Shirt, BookOpen } from 'lucide-react-native';
import SelfMeasureForm from './measurement-forms/SelfMeasureForm';
import UploadSlip from './measurement-forms/UploadSlip';
import MeasurementGuideModal from './MeasurementGuideModal';
import useMeasurementStore from '../../../store/measurementStore';
import { Box, Txt, Btn, I } from '../../ui/primitives';

const MeasurementSelector = ({ selectedType, onSelectType, onMeasurementComplete, selectedSavedProfile, onSelectSavedProfile, visitPrice, isDistanceBased, measurementFields, categoryName, categoryId = null, disableHomeVisit = false, completedSelfData = null, completedSlipData = null, isVisitCoveredInOrder = false }) => {
    const { measurements, fetchMeasurements, isLoading } = useMeasurementStore();
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    
    // Local state to track if a valid measurement has been provided for each type
    const [completedMeasurements, setCompletedMeasurements] = useState({
        new: !!(completedSelfData?.isConfirmed || completedSelfData?.type === 'self'),
        upload: !!(completedSlipData?.type === 'slip' || completedSlipData?.slipImage || completedSlipData?.image || completedSlipData?.url),
        home: selectedType === 'home',
        saved: !!selectedSavedProfile || selectedType === 'saved',
    });

    React.useEffect(() => {
        if (completedSelfData?.isConfirmed || completedSelfData?.type === 'self') {
            setCompletedMeasurements(prev => (prev.new ? prev : { ...prev, new: true }));
        }
    }, [completedSelfData]);

    React.useEffect(() => {
        const hasSlip = !!(completedSlipData?.type === 'slip' || completedSlipData?.slipImage || completedSlipData?.image || completedSlipData?.url);
        if (hasSlip) {
            setCompletedMeasurements(prev => (prev.upload ? prev : { ...prev, upload: true }));
        }
    }, [completedSlipData]);

    React.useEffect(() => {
        fetchMeasurements();
    }, []); // Run ONCE on mount to prevent repeated API polling

    const handleSelfMeasureSave = async (data) => {
        const isConfirmed = !!(data && data.isConfirmed);
        
        if (isConfirmed && data.saveProfile && data.saveProfile.name) {
            try {
                const { addMeasurement, fetchMeasurements } = useMeasurementStore.getState();
                const saved = await addMeasurement({
                    profileName: data.saveProfile.name,
                    garmentType: data.garmentType || categoryName || 'Custom Fit',
                    categoryId: categoryId || null,
                    measurements: data.data,
                    notes: data.data?.notes || ''
                });
                if (saved) {
                    await fetchMeasurements();
                }
            } catch (err) {
                // console.error("Profile save error:", err);
            }
        }

        setCompletedMeasurements(prev => ({ ...prev, new: isConfirmed }));
        onMeasurementComplete(isConfirmed ? data : null);
        if (isConfirmed) {
            onSelectType(null); // Auto-close/collapse the measurement card upon confirmation
        }
    };

    const handleUploadComplete = (data) => {
        const hasUpload = !!(data && (data.url || data.slipUrl || data.file || data.image));
        setCompletedMeasurements(prev => ({ ...prev, upload: hasUpload }));
        if (hasUpload) {
            onMeasurementComplete(data);
            onSelectType(null); // Auto-close/collapse upload card upon completion
        }
    };

    const handleSavedProfileSelect = (profile) => {
        if (selectedSavedProfile?._id === profile._id && selectedType === 'saved') {
            // Toggle off / unselect if clicked again
            setCompletedMeasurements(prev => ({ ...prev, saved: false }));
            onSelectType(null);
            onSelectSavedProfile(null);
            onMeasurementComplete(null);
        } else {
            setCompletedMeasurements(prev => ({ ...prev, saved: true }));
            onSelectType('saved');
            onSelectSavedProfile(profile);
            onMeasurementComplete({
                ...(profile.measurements || {}),
                type: 'saved',
                categoryId: profile.categoryId || categoryId || null,
                garmentType: profile.garmentType || categoryName,
            });
        }
    };

    // Only this customer's profiles (API) + only matching this service/category
    const filteredMeasurements = measurements
        .filter((m) => {
            if (!m) return false;
            if (categoryId && m.categoryId) {
                return String(m.categoryId) === String(categoryId);
            }
            if (!categoryName) return false;
            if (!m.garmentType) return false;
            return m.garmentType.toLowerCase().trim() === categoryName.toLowerCase().trim();
        })
        .slice()
        .sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0) -
                new Date(a.updatedAt || a.createdAt || 0)
        );

    const expandable = (key, title, doneTitle, sub, doneSub, Icon, iconCls, doneBadge, body) => {
        const open = selectedType === key;
        const done = completedMeasurements[key];
        return (
            <Box className={`border rounded-xl overflow-hidden ${open ? 'border-primary shadow-sm' : done ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}>
                <Btn onPress={() => onSelectType(open ? null : key)} className={`flex items-center gap-3 p-3 relative text-left ${open ? 'bg-primary-soft' : done ? 'bg-green-50/40' : 'bg-white'}`}>
                    <Box className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-green-100' : iconCls.bg}`}>
                        <I icon={done ? CheckCircle2 : Icon} size={16} color={done ? '#15803d' : iconCls.color} />
                    </Box>
                    <Box className="flex-1">
                        <Box className="flex items-center gap-2 flex-wrap">
                            <Txt className="text-sm font-semibold text-gray-900">{done ? doneTitle : title}</Txt>
                            {done && <Txt className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{doneBadge}</Txt>}
                        </Box>
                        <Txt className="text-[10px] text-gray-500">{done ? doneSub : sub}</Txt>
                    </Box>
                    {done && !open ? (
                        <Btn onPress={() => onSelectType(key)} className="px-2.5 py-1 text-[10px] font-black uppercase text-primary bg-white border border-primary/20 rounded-lg shadow-2xs shrink-0">Edit / Update</Btn>
                    ) : (
                        <I icon={open ? ChevronUp : ChevronDown} size={16} color={open ? '#843D9B' : '#9ca3af'} />
                    )}
                </Btn>
                {open && body}
            </Box>
        );
    };

    return (
        <Box className="bg-white rounded-2xl p-3.5 mb-3 shadow-sm border border-gray-100">
            <Box className="flex items-center justify-between mb-3 gap-2">
                <Box className="min-w-0 flex-1">
                    <Txt className="text-sm font-bold text-gray-900">Measurement Options</Txt>
                    {!!categoryName && <Txt className="text-[10px] text-primary font-bold mt-0.5 truncate">Form for: {categoryName}</Txt>}
                </Box>
                <Btn onPress={() => setIsGuideOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white shadow-md shadow-primary/20 text-xs font-bold shrink-0">
                    <I icon={BookOpen} size={14} color="#fff" />
                    <Txt>Guide</Txt>
                </Btn>
            </Box>
            <Box className="space-y-3">
                <Btn onPress={() => setIsGuideOpen(true)} className="p-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-purple-50/80 flex items-center justify-between shadow-2xs mb-3 text-left">
                    <Box className="flex items-center gap-3 flex-1">
                        <Box className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
                            <I icon={BookOpen} size={16} color="#fff" />
                        </Box>
                        <Box className="flex-1">
                            <Txt className="text-xs font-bold text-gray-900">Need Help Taking Measurements?</Txt>
                            <Txt className="text-[10px] text-gray-500 font-medium">View step-by-step diagram, photo & video guide</Txt>
                        </Box>
                    </Box>
                    <Txt className="px-2.5 py-1 text-[10px] font-black text-primary bg-white rounded-full border border-purple-200 shadow-2xs shrink-0">Open Guide</Txt>
                </Btn>

                {filteredMeasurements.length > 0 && (
                    <Box className="space-y-2">
                        <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Your Saved Profiles for {categoryName}</Txt>
                        {filteredMeasurements.map((m) => {
                            const isSelected = selectedSavedProfile?._id === m._id && selectedType === 'saved';
                            return (
                                <Btn key={m._id} onPress={() => handleSavedProfileSelect(m)} className={`flex items-center gap-3 p-3 rounded-xl border relative overflow-hidden text-left ${isSelected ? 'border-primary bg-primary-soft shadow-sm ring-1 ring-primary' : 'border-gray-100'}`}>
                                    <Box className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                                        <I icon={User} size={16} color="#843D9B" />
                                    </Box>
                                    <Box className="flex-1 z-10">
                                        <Txt className="text-sm font-semibold text-gray-900">{m.profileName}</Txt>
                                        <Txt className="text-[10px] text-gray-500">{m.garmentType}</Txt>
                                    </Box>
                                    <Box className={`w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                        {isSelected && <Box className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </Box>
                                </Btn>
                            );
                        })}
                    </Box>
                )}

                {expandable('new', 'Enter Measurements', 'Self Measurements Saved', 'Manually enter Chest, Waist, etc.', 'Tap Edit / Update to modify your saved values', Ruler, { bg: 'bg-green-50', color: '#843D9B' }, 'Confirmed ✓',
                    <SelfMeasureForm initialData={completedSelfData?.data || completedSelfData || null} onSave={handleSelfMeasureSave} onCancel={() => onSelectType(null)} onOpenGuide={() => setIsGuideOpen(true)} measurementFields={measurementFields} categoryName={categoryName} />)}

                {expandable('upload', 'Upload Slip', 'Measurement Slip Uploaded', 'Photo of handwritten notes', 'Tap Edit / Update to re-upload slip photo', Upload, { bg: 'bg-orange-50', color: '#ea580c' }, 'Uploaded ✓',
                    <UploadSlip onUpload={handleUploadComplete} onCancel={() => onSelectType(null)} />)}

                <Btn onPress={() => { if (disableHomeVisit) return; onSelectType(selectedType === 'home' ? null : 'home'); }}
                    className={`p-3 rounded-xl border flex items-center gap-3 relative overflow-hidden text-left ${disableHomeVisit ? 'border-gray-100 bg-gray-50 opacity-50' : selectedType === 'home' ? 'border-primary bg-indigo-50 ring-1 ring-primary shadow-sm' : 'border-gray-100 bg-white'}`}>
                    <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedType === 'home' ? 'bg-primary' : 'bg-primary-soft'}`}>
                        <I icon={Home} size={16} color={selectedType === 'home' ? '#fff' : '#843D9B'} />
                    </Box>
                    <Box className="flex-1">
                        <Box className="flex items-center gap-2">
                            <Txt className="text-sm font-bold text-gray-900">Tailor at Home</Txt>
                            <Txt className="text-[8px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-widest">{isVisitCoveredInOrder ? 'Covered' : 'Premium'}</Txt>
                        </Box>
                        <Txt className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                            {disableHomeVisit ? 'Not needed — measurements already provided' : isVisitCoveredInOrder ? 'Covered in your order visit (no extra fee)' : isDistanceBased ? 'Expert will visit your location' : 'Expert visits start at base price'}
                        </Txt>
                    </Box>
                    <Box className="items-end">
                        {!isDistanceBased && !disableHomeVisit && !isVisitCoveredInOrder && <Txt className="text-[8px] text-gray-400 mb-0.5 font-black">starts @</Txt>}
                        {disableHomeVisit ? <Txt className="text-xs font-black text-primary">—</Txt>
                            : isVisitCoveredInOrder ? <Txt className="text-emerald-600 font-bold uppercase text-[10px]">Free (Shared)</Txt>
                            : <Txt className="text-xs font-black text-primary">{`₹${visitPrice || 250}`}</Txt>}
                    </Box>
                    {selectedType === 'home' && (
                        <Box className="absolute top-0 right-0 p-1 bg-primary rounded-bl-lg">
                            <I icon={CheckCircle2} size={10} color="#fff" />
                        </Box>
                    )}
                </Btn>

                <Btn onPress={() => onSelectType(selectedType === 'sample' ? null : 'sample')}
                    className={`p-3 rounded-xl border flex items-center gap-3 relative overflow-hidden text-left ${selectedType === 'sample' ? 'border-primary bg-primary-soft ring-1 ring-primary shadow-sm' : 'border-gray-100 bg-white'}`}>
                    <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedType === 'sample' ? 'bg-primary' : 'bg-primary-soft'}`}>
                        <I icon={Shirt} size={16} color={selectedType === 'sample' ? '#fff' : '#843D9B'} />
                    </Box>
                    <Box className="flex-1">
                        <Txt className="text-sm font-bold text-gray-900">Provide Sample Garment</Txt>
                        <Txt className="text-[10px] text-gray-400 font-medium leading-none mt-1">Partner will collect your best fitting clothes</Txt>
                        {selectedType === 'sample' && (
                            <Txt className="text-[9px] text-amber-600 font-semibold mt-2 bg-amber-50 p-1.5 rounded-lg border border-amber-100 leading-snug">* Note: It is your responsibility to provide the sample garment at the time of the fabric pickup.</Txt>
                        )}
                    </Box>
                    {selectedType === 'sample' && (
                        <Box className="absolute top-0 right-0 p-1 bg-primary rounded-bl-lg">
                            <I icon={CheckCircle2} size={10} color="#fff" />
                        </Box>
                    )}
                </Btn>
            </Box>
            <MeasurementGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onSelectAddMeasurements={() => onSelectType('new')}
                onBookHomeVisit={() => { if (!disableHomeVisit) onSelectType('home'); }} />
        </Box>
    );
};

export default MeasurementSelector;
