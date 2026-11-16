// Port of service-detail/measurement-forms/SelfMeasureForm.jsx (logic verbatim)
import React, { useState, useEffect } from 'react';
import { Info, Check } from 'lucide-react-native';
import toast from '../../../../lib/toast';
import MeasurementInput from './MeasurementInput';
import Select from '../../../ui/Select';
import { isHeadingField, getFieldKey as resolveFieldKey, getInputFields } from '../../../../utils/measurementFields';
import { Box, Txt, Btn, I, Input } from '../../../ui/primitives';

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
        { key: 'hips', label: 'Hips', placeholder: '36' },
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
        const empty = {
            chest: '', waist: '', hips: '', shoulder: '', length: '',
            sleeveLength: '', neck: '', underbust: '', frontNeck: '',
            backNeck: '', thigh: '', bottom: '', notes: ''
        };
        if (categoryName) {
            setSelectedCategory(detectDefaultCategory(categoryName));
        }
        // Prefer fresh fields for this garment; only hydrate when parent passes initialData
        if (initialData && typeof initialData === 'object' && Object.keys(initialData).length > 0) {
            setValues({ ...empty, ...initialData });
        } else {
            setValues(empty);
        }
        setErrors({});
        setSaveProfile(false);
        setProfileName('');
    }, [categoryName]);

    useEffect(() => {
        if (initialData && typeof initialData === 'object') {
            setValues(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // Active fields list: custom admin-defined measurementFields OR hardcoded category fallback
    const activeFields = (measurementFields && measurementFields.length > 0)
        ? measurementFields
        : (categoryFields[selectedCategory] || categoryFields['Other']);

    const inputFields = getInputFields(activeFields);

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
        inputFields.forEach(field => {
            const key = resolveFieldKey(field);
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
            inputFields.forEach(f => {
                const key = resolveFieldKey(f);
                if (values[key] !== undefined && values[key] !== '') {
                    filteredValues[key] = values[key];
                }
            });

            onSave({
                type: 'self',
                data: filteredValues,
                saveProfile: saveProfile ? { name: profileName } : null,
                garmentType: categoryName || selectedCategory,
                isConfirmed: true
            });
            toast.success("Measurements confirmed ✓");
        } else {
            toast.error("Please fill all required measurement fields");
        }
    };

    return (
        <Box className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4">
            {(!measurementFields || measurementFields.length === 0) && (
                <Box className="mb-4">
                    <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1">Clothing Category</Txt>
                    <Select value={selectedCategory} onChange={(v) => { setSelectedCategory(v); setErrors({}); }} options={Object.keys(categoryFields)} title="Clothing Category"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm" textClassName="text-xs font-bold text-gray-800" />
                </Box>
            )}
            <Box className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex items-start justify-between gap-3">
                <Box className="flex gap-3 flex-1">
                    <I icon={Info} size={18} color="#843D9B" style={{ marginTop: 2 }} />
                    <Box className="flex-1">
                        <Txt className="text-xs font-bold text-gray-800">Standard Size Guide {(!measurementFields || measurementFields.length === 0) && `(${selectedCategory})`}</Txt>
                        <Txt className="text-[10px] text-primary mt-0.5 leading-relaxed">Measure comfortably. Don't pull the tape too tight. All units are in inches.</Txt>
                    </Box>
                </Box>
                {onOpenGuide && (
                    <Btn onPress={onOpenGuide} className="shrink-0 text-[10px] font-black text-primary bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg shadow-2xs">📐 Guide</Btn>
                )}
            </Box>
            <Box className="grid grid-cols-2 gap-x-3 gap-y-4 mb-6">
                {activeFields.map((field, idx) => {
                    if (isHeadingField(field)) {
                        return (
                            <Box key={`heading-${idx}-${field.label}`} className={`col-span-2 ${idx === 0 ? '' : 'pt-2'}`}>
                                <Txt className="text-[10px] font-black uppercase tracking-[0.14em] text-primary border-b border-primary/15 pb-1.5">{field.label}</Txt>
                            </Box>
                        );
                    }
                    const key = resolveFieldKey(field);
                    return (
                        <MeasurementInput key={`${key}-${idx}`} label={field.label || field.name || key} placeholder={field.placeholder || 'e.g. 34'} value={values[key] || ''} onChange={(v) => handleChange(key, v)} error={errors[key]} />
                    );
                })}
            </Box>
            <Box className="mb-6">
                <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1">Specific Instructions (Optional)</Txt>
                <Input multiline numberOfLines={3} value={values.notes} onChangeText={(t) => setValues((prev) => ({ ...prev, notes: t }))}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-[#843D9B] shadow-sm min-h-[72px] placeholder:text-gray-300"
                    placeholder="E.g., I prefer a loose fit around the waist. Please add pockets." />
            </Box>
            <Box className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 mb-8 shadow-sm">
                <Btn onPress={() => setSaveProfile(!saveProfile)} hitSlop={8} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 ${saveProfile ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-gray-200 bg-white'}`}>
                    {saveProfile && <I icon={Check} size={12} strokeWidth={3.5} color="#fff" />}
                </Btn>
                <Box className="flex-1">
                    <Txt onPress={() => setSaveProfile(!saveProfile)} className="text-xs font-bold text-gray-800">Save this measurement profile</Txt>
                    {saveProfile && (
                        <Input value={profileName} autoFocus onChangeText={(t) => { setProfileName(t); if (errors.profileName) setErrors((prev) => ({ ...prev, profileName: null })); }}
                            placeholder="Profile Name (e.g. My Summer Fit)"
                            className={`mt-2 w-full text-[11px] font-bold border-b-2 py-1.5 ${errors.profileName ? 'border-red-300 placeholder:text-red-300' : 'border-gray-100'}`} />
                    )}
                </Box>
            </Box>
            <Box className="flex gap-3">
                <Btn onPress={onCancel} className="flex-1 py-3.5 rounded-xl border-2 border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">Cancel</Btn>
                <Btn onPress={handleSave} className="flex-[2] py-3.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">Confirm Measurements</Btn>
            </Box>
        </Box>
    );
};

export default SelfMeasureForm;
