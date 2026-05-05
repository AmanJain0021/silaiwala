import React, { useState } from 'react';
import { Ruler, Upload, User, ChevronDown, ChevronUp, CheckCircle2, Home, Shirt } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import SelfMeasureForm from './measurement-forms/SelfMeasureForm';
import UploadSlip from './measurement-forms/UploadSlip';
import useMeasurementStore from '../../../../store/measurementStore';

const MeasurementSelector = ({ selectedType, onSelectType, onMeasurementComplete, selectedSavedProfile, onSelectSavedProfile, visitPrice, isDistanceBased }) => {
    const { measurements, fetchMeasurements, isLoading } = useMeasurementStore();
    
    // Local state to track if a valid measurement has been provided for each type
    const [completedMeasurements, setCompletedMeasurements] = useState({
        new: false,
        upload: false,
        home: false,
        saved: !!selectedSavedProfile
    });

    React.useEffect(() => {
        fetchMeasurements();
    }, [fetchMeasurements]);

    const handleSelfMeasureSave = (data) => {
        setCompletedMeasurements(prev => ({ ...prev, new: true }));
        onMeasurementComplete(data);
    };

    const handleUploadComplete = (data) => {
        setCompletedMeasurements(prev => ({ ...prev, upload: true }));
        onMeasurementComplete(data);
    };

    const handleSavedProfileSelect = (profile) => {
        setCompletedMeasurements(prev => ({ ...prev, saved: true }));
        onSelectType('saved');
        onSelectSavedProfile(profile);
        onMeasurementComplete(profile.measurements || profile);
    };

    return (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Measurement Options</h3>

            <div className="space-y-3">

                {/* 1. Saved Measurement Profiles */}
                {measurements.length > 0 && (
                    <div className="space-y-2">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Your Saved Profiles</p>
                         {measurements.map(m => (
                             <div
                                key={m._id}
                                onClick={() => handleSavedProfileSelect(m)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden",
                                    selectedSavedProfile?._id === m._id ? "border-primary bg-primary-soft shadow-sm" : "border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-primary z-10">
                                    <User size={16} />
                                </div>
                                <div className="flex-1 z-10">
                                    <p className="text-sm font-semibold text-gray-900">{m.profileName}</p>
                                    <p className="text-[10px] text-gray-500">{m.garmentType}</p>
                                </div>
                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center z-10", selectedSavedProfile?._id === m._id ? "border-primary" : "border-gray-300")}>
                                    {selectedSavedProfile?._id === m._id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                            </div>
                         ))}
                    </div>
                )}

                {/* 2. Enter New Measurement */}
                <div className={cn(
                    "border rounded-xl overflow-hidden transition-all",
                    selectedType === 'new' ? "border-primary shadow-sm" : "border-gray-100 hover:border-gray-200"
                )}>
                    <div
                        onClick={() => onSelectType('new')} // Just select, don't toggle form visibility directly here if we want it to stay open when selected
                        className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-all relative",
                            selectedType === 'new' ? "bg-primary-soft" : "bg-white"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-primary">
                            <Ruler size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">Enter Measurements</p>
                                {completedMeasurements.new && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Completed</span>}
                            </div>
                            <p className="text-[10px] text-gray-500">Manually enter Chest, Waist, etc.</p>
                        </div>
                        {selectedType === 'new' ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>

                    {/* Expandable Form */}
                    {selectedType === 'new' && (
                        <SelfMeasureForm
                            onSave={handleSelfMeasureSave}
                            onCancel={() => onSelectType(null)}
                        />
                    )}
                </div>


                {/* 3. Upload Measurement Slip */}
                <div className={cn(
                    "border rounded-xl overflow-hidden transition-all",
                    selectedType === 'upload' ? "border-primary shadow-sm" : "border-gray-100 hover:border-gray-200"
                )}>
                    <div
                        onClick={() => onSelectType('upload')}
                        className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-all",
                            selectedType === 'upload' ? "bg-primary-soft" : "bg-white"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Upload size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">Upload Slip</p>
                                {completedMeasurements.upload && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Uploaded</span>}
                            </div>
                            <p className="text-[10px] text-gray-500">Photo of handwritten notes</p>
                        </div>
                        {selectedType === 'upload' ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>

                    {/* Expandable Form */}
                    {selectedType === 'upload' && (
                        <UploadSlip
                            onUpload={handleUploadComplete}
                            onCancel={() => onSelectType(null)}
                        />
                    )}
                </div>

                {/* 4. Tailor at Home (Visit) */}
                <div
                    onClick={() => onSelectType('home')}
                    className={cn(
                        "group p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden",
                        selectedType === 'home' ? "border-primary bg-indigo-50 ring-1 ring-primary shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
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
                            {isDistanceBased ? 'Expert will visit your location' : 'Expert visits start at base price'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-primary flex flex-col items-end">
                            <span className="text-[8px] text-gray-400 mb-0.5">{!isDistanceBased && 'starts @'}</span>
                            ₹{visitPrice || 250}
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
                        onSelectType('sample');
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
                    </div>
                    {selectedType === 'sample' && (
                        <div className="absolute top-0 right-0 p-1 bg-primary text-white rounded-bl-lg">
                            <CheckCircle2 size={10} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MeasurementSelector;

