import React, { useState } from 'react';
import { Ruler, Upload, User, ChevronDown, ChevronUp, CheckCircle2, Home, Shirt, BookOpen } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import SelfMeasureForm from './measurement-forms/SelfMeasureForm';
import UploadSlip from './measurement-forms/UploadSlip';
import MeasurementGuideModal from './MeasurementGuideModal';
import useMeasurementStore from '../../../../store/measurementStore';

const MeasurementSelector = ({ selectedType, onSelectType, onMeasurementComplete, selectedSavedProfile, onSelectSavedProfile, visitPrice, isDistanceBased, measurementFields, categoryName, disableHomeVisit = false, completedSelfData = null, completedSlipData = null }) => {
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
                    measurements: data.data,
                    notes: data.data?.notes || ''
                });
                if (saved) {
                    await fetchMeasurements();
                }
            } catch (err) {
                console.error("Profile save error:", err);
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
            onMeasurementComplete(profile.measurements || profile);
        }
    };

    const filteredMeasurements = measurements.filter(m => {
        if (!categoryName) return true;
        if (!m.garmentType) return false;
        const a = m.garmentType.toLowerCase().trim();
        const b = categoryName.toLowerCase().trim();
        if (a === b) return true;
        // Soft match: pajama/pant/trouser family, kurta/kurti, etc.
        const family = (s) => {
            if (/pajama|pyjama|pant|trouser|salwar|palazzo|lower|bottom|skirt/.test(s)) return 'bottom';
            if (/kurta|kurti|kameez/.test(s)) return 'kurta';
            if (/shirt/.test(s)) return 'shirt';
            if (/blouse/.test(s)) return 'blouse';
            return s;
        };
        return family(a) === family(b);
    });

    return (
        <div className="bg-white rounded-2xl p-3.5 mb-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 gap-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">Measurement Options</h3>
                    {categoryName && (
                        <p className="text-[10px] text-primary font-bold mt-0.5 truncate">
                            Form for: {categoryName}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setIsGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-dark active:scale-95 text-white shadow-md shadow-primary/20 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                    <BookOpen size={14} className="text-white" />
                    <span>Guide</span>
                </button>
            </div>

            <div className="space-y-3">

                {/* Quick Visual Measurement Guide Option Card */}
                <div
                    onClick={() => setIsGuideOpen(true)}
                    className="group p-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-purple-50/80 cursor-pointer transition-all flex items-center justify-between hover:border-purple-300 shadow-2xs mb-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                Need Help Taking Measurements?
                            </h4>
                            <p className="text-[10px] text-gray-500 font-medium">
                                View step-by-step diagram, photo & video guide
                            </p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-black text-purple-700 bg-white rounded-full border border-purple-200 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
                        Open Guide
                    </span>
                </div>

                {/* 1. Saved Measurement Profiles */}
                {filteredMeasurements.length > 0 && (
                    <div className="space-y-2">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Your Saved Profiles for {categoryName}</p>
                         {filteredMeasurements.map(m => {
                             const isSelected = selectedSavedProfile?._id === m._id && selectedType === 'saved';
                             return (
                                 <div
                                    key={m._id}
                                    onClick={() => handleSavedProfileSelect(m)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden",
                                        isSelected ? "border-primary bg-primary-soft shadow-sm ring-1 ring-primary" : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-primary z-10">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <p className="text-sm font-semibold text-gray-900">{m.profileName}</p>
                                        <p className="text-[10px] text-gray-500">{m.garmentType}</p>
                                    </div>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-all", isSelected ? "border-primary bg-primary" : "border-gray-300")}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                             );
                         })}
                    </div>
                )}

                {/* 2. Enter New Measurement */}
                <div className={cn(
                    "border rounded-xl overflow-hidden transition-all",
                    selectedType === 'new' ? "border-primary shadow-sm" : (completedMeasurements.new ? "border-green-200 bg-green-50/20" : "border-gray-100 hover:border-gray-200")
                )}>
                    <div
                        onClick={() => {
                            if (selectedType === 'new') {
                                onSelectType(null);
                            } else {
                                onSelectType('new');
                            }
                        }}
                        className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-all relative",
                            selectedType === 'new' ? "bg-primary-soft" : (completedMeasurements.new ? "bg-green-50/40" : "bg-white")
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            completedMeasurements.new ? "bg-green-100 text-green-700" : "bg-green-50 text-primary"
                        )}>
                            {completedMeasurements.new ? <CheckCircle2 size={16} /> : <Ruler size={16} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {completedMeasurements.new ? 'Self Measurements Saved' : 'Enter Measurements'}
                                </p>
                                {completedMeasurements.new && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                        Confirmed ✓
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500">
                                {completedMeasurements.new ? 'Tap Edit / Update to modify your saved values' : 'Manually enter Chest, Waist, etc.'}
                            </p>
                        </div>
                        {completedMeasurements.new && selectedType !== 'new' ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectType('new');
                                }}
                                className="px-2.5 py-1 text-[10px] font-black uppercase text-primary bg-white border border-primary/20 rounded-lg shadow-2xs hover:bg-primary hover:text-white transition-all shrink-0 cursor-pointer"
                            >
                                Edit / Update
                            </button>
                        ) : (
                            selectedType === 'new' ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />
                        )}
                    </div>

                    {/* Expandable Form */}
                    {selectedType === 'new' && (
                        <SelfMeasureForm
                            initialData={completedSelfData?.data || completedSelfData || null}
                            onSave={handleSelfMeasureSave}
                            onCancel={() => onSelectType(null)}
                            onOpenGuide={() => setIsGuideOpen(true)}
                            measurementFields={measurementFields}
                            categoryName={categoryName}
                        />
                    )}
                </div>


                {/* 3. Upload Measurement Slip */}
                <div className={cn(
                    "border rounded-xl overflow-hidden transition-all",
                    selectedType === 'upload' ? "border-primary shadow-sm" : (completedMeasurements.upload ? "border-green-200 bg-green-50/20" : "border-gray-100 hover:border-gray-200")
                )}>
                    <div
                        onClick={() => {
                            if (selectedType === 'upload') {
                                onSelectType(null);
                            } else {
                                onSelectType('upload');
                            }
                        }}
                        className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-all relative",
                            selectedType === 'upload' ? "bg-primary-soft" : (completedMeasurements.upload ? "bg-green-50/40" : "bg-white")
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            completedMeasurements.upload ? "bg-green-100 text-green-700" : "bg-orange-50 text-orange-600"
                        )}>
                            {completedMeasurements.upload ? <CheckCircle2 size={16} /> : <Upload size={16} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {completedMeasurements.upload ? 'Measurement Slip Uploaded' : 'Upload Slip'}
                                </p>
                                {completedMeasurements.upload && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                        Uploaded ✓
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500">
                                {completedMeasurements.upload ? 'Tap Edit / Update to re-upload slip photo' : 'Photo of handwritten notes'}
                            </p>
                        </div>
                        {completedMeasurements.upload && selectedType !== 'upload' ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectType('upload');
                                }}
                                className="px-2.5 py-1 text-[10px] font-black uppercase text-primary bg-white border border-primary/20 rounded-lg shadow-2xs hover:bg-primary hover:text-white transition-all shrink-0 cursor-pointer"
                            >
                                Edit / Update
                            </button>
                        ) : (
                            selectedType === 'upload' ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />
                        )}
                    </div>

                    {/* Expandable Form */}
                    {selectedType === 'upload' && (
                        <UploadSlip
                            onUpload={handleUploadComplete}
                            onCancel={() => onSelectType(null)}
                        />
                    )}
                </div>

                {/* 4. Tailor at Home (Visit) — disabled once self/saved measurements are confirmed */}
                <div
                    onClick={() => {
                        if (disableHomeVisit) return;
                        if (selectedType === 'home') {
                            onSelectType(null);
                        } else {
                            onSelectType('home');
                        }
                    }}
                    className={cn(
                        "group p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden",
                        disableHomeVisit
                            ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            : selectedType === 'home'
                                ? "border-primary bg-indigo-50 ring-1 ring-primary shadow-sm cursor-pointer"
                                : "border-gray-100 bg-white hover:border-gray-200 cursor-pointer"
                    )}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        selectedType === 'home' ? "bg-primary text-white" : "bg-primary-soft text-primary"
                    )}>
                        <Home size={16} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">Tailor at Home</h4>
                            <span className="text-[8px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Premium</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                            {disableHomeVisit
                                ? 'Not needed — measurements already provided'
                                : isDistanceBased
                                    ? 'Expert will visit your location'
                                    : 'Expert visits start at base price'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-primary flex flex-col items-end">
                            <span className="text-[8px] text-gray-400 mb-0.5">{!isDistanceBased && !disableHomeVisit && 'starts @'}</span>
                            {disableHomeVisit ? '—' : `₹${visitPrice || 250}`}
                        </p>
                    </div>
                    {selectedType === 'home' && (
                        <div className="absolute top-0 right-0 p-1 bg-primary text-white rounded-bl-lg">
                            <CheckCircle2 size={10} />
                        </div>
                    )}
                </div>

                {/* 5. Provide Sample Garment */}
                <div
                    onClick={() => {
                        if (selectedType === 'sample') {
                            onSelectType(null);
                        } else {
                            onSelectType('sample');
                        }
                    }}
                    className={cn(
                        "group p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden",
                        selectedType === 'sample' ? "border-primary bg-primary-soft ring-1 ring-primary shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        selectedType === 'sample' ? "bg-primary text-white" : "bg-primary-soft text-primary"
                    )}>
                        <Shirt size={16} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">Provide Sample Garment</h4>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                            Partner will collect your best fitting clothes
                        </p>
                        {selectedType === 'sample' && (
                            <p className="text-[9px] text-amber-600 font-semibold mt-2 bg-amber-50 p-1.5 rounded-lg border border-amber-100 leading-snug">
                                * Note: It is your responsibility to provide the sample garment at the time of the fabric pickup.
                            </p>
                        )}
                    </div>
                    {selectedType === 'sample' && (
                        <div className="absolute top-0 right-0 p-1 bg-primary text-white rounded-bl-lg">
                            <CheckCircle2 size={10} />
                        </div>
                    )}
                </div>

            </div>

            {/* Measurement Guide Modal */}
            <MeasurementGuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                onSelectAddMeasurements={() => onSelectType('new')}
                onBookHomeVisit={() => {
                    if (!disableHomeVisit) onSelectType('home');
                }}
            />
        </div>
    );
};

export default MeasurementSelector;

