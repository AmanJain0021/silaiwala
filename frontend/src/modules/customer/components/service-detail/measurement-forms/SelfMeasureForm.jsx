import React, { useState, useEffect } from 'react';
import { Info, HelpCircle, Save } from 'lucide-react';
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

const SelfMeasureForm = ({ initialData, onSave, onCancel }) => {
    const [selectedCategory, setSelectedCategory] = useState('Kurta/Kurti');
    const [values, setValues] = useState({
        chest: '', waist: '', hips: '', shoulder: '', length: '',
        sleeveLength: '', neck: '', underbust: '', frontNeck: '',
        backNeck: '', thigh: '', bottom: '', notes: ''
    });

    const [errors, setErrors] = useState({});
    const [saveProfile, setSaveProfile] = useState(false);
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        if (initialData) {
            setValues(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (field, value) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setValues(prev => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        }
    };

    const validate = () => {
        const newErrors = {};
        const currentFields = categoryFields[selectedCategory] || categoryFields['Other'];
        
        currentFields.forEach(field => {
            if (!values[field.key]) {
                newErrors[field.key] = 'Required';
            } else {
                const num = parseFloat(values[field.key]);
                if (num < 5 || num > 100) {
                    newErrors[field.key] = 'Invalid range';
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
            const currentFields = categoryFields[selectedCategory] || categoryFields['Other'];
            const filteredValues = { notes: values.notes };
            currentFields.forEach(f => {
                filteredValues[f.key] = values[f.key];
            });

            onSave({
                type: 'self',
                data: filteredValues,
                saveProfile: saveProfile ? { name: profileName } : null,
                garmentType: selectedCategory
            });
        }
    };

    return (
        <div className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4 animate-in slide-in-from-top-2 duration-300">

            {/* Category Dropdown Selector */}
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

            {/* Helper Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4 flex gap-3">
                <Info size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-xs font-bold text-gray-800">Standard Size Guide ({selectedCategory})</h4>
                    <p className="text-[10px] text-primary mt-0.5 leading-relaxed">
                        Measure comfortably. Don't pull the tape too tight. All units are in inches.
                    </p>
                </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {(categoryFields[selectedCategory] || categoryFields['Other']).map(field => (
                    <MeasurementInput
                        key={field.key}
                        label={field.label}
                        placeholder={field.placeholder}
                        value={values[field.key] || ''}
                        onChange={(v) => handleChange(field.key, v)}
                        error={errors[field.key]}
                    />
                ))}
            </div>

            {/* Notes Section */}
            <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 ml-1 mb-1 block">
                    Specific Instructions (Optional)
                </label>
                <textarea
                    value={values.notes}
                    onChange={(e) => setValues(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-[#e6f4f1] transition-all placeholder:text-gray-300 resize-none"
                    rows={3}
                    placeholder="E.g., I prefer a loose fit around the waist. Please add pockets."
                />
            </div>

            {/* Save Profile Toggle */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 mb-6">
                <div
                    onClick={() => setSaveProfile(!saveProfile)}
                    className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center cursor-pointer mt-0.5",
                        saveProfile ? "bg-primary border-primary" : "border-gray-300 bg-white"
                    )}
                >
                    {saveProfile && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white rotate-[-45deg] mb-0.5" />}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 cursor-pointer" onClick={() => setSaveProfile(!saveProfile)}>
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
                                "mt-2 w-full text-xs border-b border-gray-200 py-1 outline-none focus:border-primary bg-transparent",
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
                    className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={14} />
                    Confirm Measurements
                </button>
            </div>

        </div>
    );
};

export default SelfMeasureForm;
