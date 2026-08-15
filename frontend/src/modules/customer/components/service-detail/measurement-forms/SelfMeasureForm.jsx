import React, { useState, useEffect } from 'react';
import { Info, HelpCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MeasurementInput from './MeasurementInput';
import { cn } from '../../../../../utils/cn';

const categoryFields = {
    'Kurta/Kurti': [
        { key: 'chest', label: 'Chest / Bust', placeholder: '34' },
        { key: 'waist', label: 'Waist', placeholder: '28' },
        { key: 'hips', label: 'Hips', placeholder: '36' },
        { key: 'shoulder', label: 'Shoulder', placeholder: '14' },
        { key: 'length', label: 'Full Length', placeholder: '40' },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '16' },
        { key: 'neck', label: 'Neck Depth (Front)', placeholder: '6' }
    ],
    'Shirt': [
        { key: 'chest', label: 'Chest / Bust', placeholder: '38' },
        { key: 'waist', label: 'Waist', placeholder: '34' },
        { key: 'shoulder', label: 'Shoulder', placeholder: '17' },
        { key: 'length', label: 'Full Length', placeholder: '30' },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '24' },
        { key: 'neck', label: 'Collar Size', placeholder: '15' }
    ],
    'Blouse': [
        { key: 'chest', label: 'Bust / Chest', placeholder: '34' },
        { key: 'underbust', label: 'Underbust / Lower Bust', placeholder: '30' },
        { key: 'shoulder', label: 'Shoulder', placeholder: '14' },
        { key: 'length', label: 'Blouse Length', placeholder: '14' },
        { key: 'frontNeck', label: 'Front Neck Depth', placeholder: '7' },
        { key: 'backNeck', label: 'Back Neck Depth', placeholder: '8' },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '10' }
    ],
    'Pant/Trouser': [
        { key: 'waist', label: 'Waist', placeholder: '32' },
        { key: 'hips', label: 'Hips', placeholder: '38' },
        { key: 'length', label: 'Full Length / Inseam', placeholder: '40' },
        { key: 'thigh', label: 'Thigh Width', placeholder: '22' },
        { key: 'bottom', label: 'Bottom Opening', placeholder: '14' }
    ],
    'Skirt': [
        { key: 'waist', label: 'Waist', placeholder: '28' },
        { key: 'hips', label: 'Hips', placeholder: '36' },
        { key: 'length', label: 'Full Length', placeholder: '38' }
    ],
    'Other': [
        { key: 'chest', label: 'Chest / Bust', placeholder: '34' },
        { key: 'waist', label: 'Waist', placeholder: '28' },
        { key: 'hips', label: 'Hips', placeholder: '36' },
        { key: 'shoulder', label: 'Shoulder', placeholder: '14' },
        { key: 'length', label: 'Full Length', placeholder: '40' }
    ]
};

const detectDefaultCategory = (name) => {
    if (!name) return 'Kurta/Kurti';
    const lower = name.toLowerCase();
    if (lower.includes('blouse')) return 'Blouse';
    if (lower.includes('shirt')) return 'Shirt';
    if (lower.includes('pant') || lower.includes('trouser') || lower.includes('pajama') || lower.includes('pyjama') || lower.includes('salwar') || lower.includes('palazzo') || lower.includes('skirt') || lower.includes('bottom') || lower.includes('lower')) {
        return 'Pant/Trouser';
    }
    return 'Kurta/Kurti';
};

const SelfMeasureForm = ({ initialData, onSave, onCancel, onOpenGuide, measurementFields, categoryName }) => {
    const [selectedCategory, setSelectedCategory] = useState(() => detectDefaultCategory(categoryName));
    const [values, setValues] = useState({
        chest: '', waist: '', hips: '', shoulder: '', length: '',
        sleeveLength: '', neck: '', underbust: '', frontNeck: '',
        backNeck: '', thigh: '', bottom: '', notes: ''
    });

    const [errors, setErrors] = useState({});
    const [saveProfile, setSaveProfile] = useState(false);
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        if (categoryName) {
            setSelectedCategory(detectDefaultCategory(categoryName));
        }
    }, [categoryName]);

    useEffect(() => {
        if (initialData) {
            setValues(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // Active fields list: custom admin-defined measurementFields OR hardcoded category fallback
    const activeFields = (measurementFields && measurementFields.length > 0)
        ? measurementFields
        : (categoryFields[selectedCategory] || categoryFields['Other']);



    const getFieldKey = (field) => field.key || field.id || field.name || field.label;

    const handleChange = (fieldKey, value) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setValues(prev => ({ ...prev, [fieldKey]: value }));
            if (errors[fieldKey]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldKey];
                    return newErrors;
                });
            }
        }
    };

    const validate = () => {
        const newErrors = {};
        activeFields.forEach(field => {
            const key = getFieldKey(field);
            if (field.isRequired !== false) {
                const val = values[key];
                if (val === undefined || val === null || String(val).trim() === '') {
                    newErrors[key] = 'Required';
                } else {
                    const num = parseFloat(val);
                    if (isNaN(num) || num <= 0 || num > 500) {
                        newErrors[key] = 'Invalid range (1-500)';
                    }
                }
            }
        });

        if (saveProfile && !profileName.trim()) {
            newErrors.profileName = 'Name your profile';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            const filteredValues = { notes: values.notes || '' };
            activeFields.forEach(f => {
                const key = getFieldKey(f);
                if (values[key] !== undefined && values[key] !== '') {
                    filteredValues[key] = values[key];
                }
            });

            onSave({
                type: 'self',
                data: filteredValues,
                saveProfile: saveProfile ? { name: profileName } : null,
                garmentType: selectedCategory,
                isConfirmed: true
            });
            toast.success("Measurements confirmed ✓");
        } else {
            toast.error("Please fill all required measurement fields");
        }
    };

    return (
        <div className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4 animate-in slide-in-from-top-2 duration-300">

            {/* Category Dropdown Selector (Only shown if custom admin fields are NOT provided) */}
            {(!measurementFields || measurementFields.length === 0) && (
                <div className="mb-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">
                        Clothing Category
                    </label>
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setErrors({});
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-[#e6f4f1] transition-all cursor-pointer shadow-sm"
                    >
                        {Object.keys(categoryFields).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Helper Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <Info size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-gray-800">Standard Size Guide {(!measurementFields || measurementFields.length === 0) && `(${selectedCategory})`}</h4>
                        <p className="text-[10px] text-primary mt-0.5 leading-relaxed">
                            Measure comfortably. Don't pull the tape too tight. All units are in inches.
                        </p>
                    </div>
                </div>
                {onOpenGuide && (
                    <button
                        type="button"
                        onClick={onOpenGuide}
                        className="shrink-0 text-[10px] font-black text-purple-700 bg-purple-100 hover:bg-purple-200 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                        📐 Guide
                    </button>
                )}
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 mb-6">
                {activeFields.map(field => {
                    const key = getFieldKey(field);
                    return (
                        <MeasurementInput
                            key={key}
                            label={field.label || field.name || key}
                            placeholder={field.placeholder || 'e.g. 34'}
                            value={values[key] || ''}
                            onChange={(v) => handleChange(key, v)}
                            error={errors[key]}
                        />
                    );
                })}
            </div>

            {/* Notes Section */}
            <div className="mb-6">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">
                    Specific Instructions (Optional)
                </label>
                <textarea
                    value={values.notes}
                    onChange={(e) => setValues(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-[#843D9B] outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-300 resize-none shadow-sm"
                    rows={3}
                    placeholder="E.g., I prefer a loose fit around the waist. Please add pockets."
                />
            </div>

            {/* Save Profile Toggle */}
            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 mb-8 shadow-sm">
                <div
                    onClick={() => setSaveProfile(!saveProfile)}
                    className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer mt-0.5 transition-all",
                        saveProfile ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-gray-200 bg-white"
                    )}
                >
                    {saveProfile && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white rotate-[-45deg] mb-0.5" />}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800 cursor-pointer" onClick={() => setSaveProfile(!saveProfile)}>
                        Save this measurement profile
                    </p>
                    {saveProfile && (
                        <input
                            type="text"
                            value={profileName}
                            onChange={(e) => {
                                setProfileName(e.target.value);
                                if (errors.profileName) setErrors(prev => ({ ...prev, profileName: null }));
                            }}
                            placeholder="Profile Name (e.g. My Summer Fit)"
                            className={cn(
                                "mt-2 w-full text-[11px] font-bold border-b-2 border-gray-100 py-1.5 outline-none focus:border-primary bg-transparent transition-colors",
                                errors.profileName ? "border-red-300 placeholder:text-red-300" : ""
                            )}
                            autoFocus
                        />
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-[2] py-3.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-primary-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Confirm Measurements
                </button>
            </div>

        </div>
    );
};

export default SelfMeasureForm;
