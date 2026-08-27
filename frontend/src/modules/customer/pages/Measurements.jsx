import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Plus, Trash2, ChevronLeft, Shirt as ShirtIcon, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useMeasurementStore from '../../../store/measurementStore';
import BottomNav from '../components/BottomNav';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../utils/api';
import { isHeadingField, getInputFields } from '../../../utils/measurementFields';

const FALLBACK_FIELDS = [
    { key: 'chest', label: 'Chest', placeholder: '0.0', isRequired: true },
    { key: 'waist', label: 'Waist', placeholder: '0.0', isRequired: true },
    { key: 'length', label: 'Length', placeholder: '0.0', isRequired: true },
    { key: 'shoulder', label: 'Shoulder', placeholder: '0.0', isRequired: true },
];

const emptyForm = () => ({
    profileName: '',
    garmentType: '',
    categoryId: null,
    unit: 'inches',
    notes: '',
    measurements: {},
});

const MeasurementsPage = () => {
    const navigate = useNavigate();
    const {
        measurements,
        isLoading,
        fetchMeasurements,
        addMeasurement,
        deleteMeasurement,
        updateMeasurement,
    } = useMeasurementStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [serviceCategories, setServiceCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [formData, setFormData] = useState(emptyForm());

    useEffect(() => {
        fetchMeasurements();

        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await api.get('/products/categories', { params: { type: 'service' } });
                if (res.data.success) {
                    const list = (res.data.data || []).filter((c) => c?.name);
                    setServiceCategories(list);
                }
            } catch (error) {
                console.error('Error fetching service categories:', error);
                toast.error('Could not load services');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [fetchMeasurements]);

    const selectedCategory = useMemo(
        () => serviceCategories.find((c) => String(c._id) === String(formData.categoryId)) || null,
        [serviceCategories, formData.categoryId]
    );

    const activeFields = useMemo(() => {
        const fields = selectedCategory?.measurementFields;
        if (Array.isArray(fields) && fields.length > 0) {
            return fields.filter((f) => f.label && (isHeadingField(f) || f.key));
        }
        return FALLBACK_FIELDS;
    }, [selectedCategory]);

    const inputFields = useMemo(() => getInputFields(activeFields), [activeFields]);

    const handleServiceSelect = (categoryId) => {
        const cat = serviceCategories.find((c) => String(c._id) === String(categoryId));
        setFormData((prev) => ({
            ...prev,
            categoryId: cat?._id || null,
            garmentType: cat?.name || '',
            measurements: {}, // reset values when service changes
        }));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.profileName.trim()) {
            toast.error('Please enter a profile name');
            return;
        }
        if (!formData.categoryId || !formData.garmentType) {
            toast.error('Please select a service / garment type');
            return;
        }

        const missingRequired = inputFields.filter((f) => {
            if (f.isRequired === false) return false;
            const v = formData.measurements[f.key];
            return v === undefined || v === null || v === '' || Number.isNaN(Number(v));
        });
        if (missingRequired.length > 0) {
            toast.error(`Please fill: ${missingRequired.map((f) => f.label).join(', ')}`);
            return;
        }

        try {
            const payload = {
                profileName: formData.profileName.trim(),
                garmentType: formData.garmentType,
                categoryId: formData.categoryId,
                unit: formData.unit || 'inches',
                notes: formData.notes || '',
                measurements: formData.measurements,
            };
            if (editingId) {
                await updateMeasurement(editingId, payload);
                toast.success('Profile updated');
            } else {
                await addMeasurement(payload);
                toast.success('Profile saved for this service');
            }
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save profile');
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData(emptyForm());
    };

    const handleEdit = (m) => {
        setEditingId(m._id);
        const matched =
            serviceCategories.find((c) => String(c._id) === String(m.categoryId)) ||
            serviceCategories.find(
                (c) => c.name?.toLowerCase().trim() === String(m.garmentType || '').toLowerCase().trim()
            );
        setFormData({
            profileName: m.profileName || '',
            garmentType: matched?.name || m.garmentType || '',
            categoryId: matched?._id || m.categoryId || null,
            unit: m.unit || 'inches',
            notes: m.notes || '',
            measurements: m.measurements || {},
        });
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this profile?')) {
            await deleteMeasurement(id);
            toast.success('Profile deleted');
        }
    };

    const handleMeasureChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            measurements: {
                ...prev.measurements,
                [field]: value === '' ? '' : parseFloat(value),
            },
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 font-sans">
            <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate('/user/profile')}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-primary"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-primary">My Measurements</h1>
            </header>

            <div className="max-w-md mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mb-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-primary">
                                    {editingId ? 'Edit Profile' : 'New Profile'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                        Profile Name
                                    </label>
                                    <Input
                                        placeholder="e.g. My Regular Fit"
                                        value={formData.profileName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, profileName: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                        Service / Garment Type
                                    </label>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 transition-all text-sm"
                                        value={formData.categoryId || ''}
                                        onChange={(e) => handleServiceSelect(e.target.value)}
                                        required
                                        disabled={loadingCategories}
                                    >
                                        <option value="">
                                            {loadingCategories ? 'Loading services…' : 'Select a service'}
                                        </option>
                                        {serviceCategories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 font-medium ml-1">
                                        Measurement form below matches the service admin configured.
                                    </p>
                                </div>

                                {formData.categoryId ? (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        {activeFields.map((field, idx) => {
                                            if (isHeadingField(field)) {
                                                return (
                                                    <div
                                                        key={`heading-${idx}-${field.label}`}
                                                        className="col-span-2 pt-2 first:pt-0"
                                                    >
                                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary border-b border-primary/15 pb-1.5">
                                                            {field.label}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return (
                                            <div key={field.key || idx} className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                                    {field.label}
                                                    {field.isRequired !== false ? '' : ' (optional)'}
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder={field.placeholder || '0.0'}
                                                    value={
                                                        formData.measurements[field.key] === undefined ||
                                                        formData.measurements[field.key] === ''
                                                            ? ''
                                                            : formData.measurements[field.key]
                                                    }
                                                    onChange={(e) =>
                                                        handleMeasureChange(field.key, e.target.value)
                                                    }
                                                    required={field.isRequired !== false}
                                                />
                                            </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                        <p className="text-xs text-gray-400 font-semibold">
                                            Select a service above to load its measurement form
                                        </p>
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-primary h-14 rounded-full text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                    type="submit"
                                    disabled={isLoading || !formData.categoryId}
                                >
                                    {isLoading
                                        ? 'Saving...'
                                        : editingId
                                          ? 'Update Profile'
                                          : 'Save Profile'}
                                </Button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="bg-primary p-6 rounded-[2rem] text-white shadow-lg shadow-primary/20 mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Ruler size={120} />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Your measurement profiles</h3>
                                <p className="text-white/70 text-xs mb-4 max-w-[220px]">
                                    Only you can see these. Each profile is saved for one service type.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(true)}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all"
                                >
                                    <Plus size={16} /> Add New Profile
                                </button>
                            </div>

                            {measurements.length === 0 && !isLoading ? (
                                <div className="text-center py-20 px-10">
                                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <Ruler size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-400 mb-1">No profiles yet</h4>
                                    <p className="text-gray-400 text-xs">
                                        Save your first body measurement profile for a service.
                                    </p>
                                </div>
                            ) : (
                                measurements.map((m, idx) => (
                                    <motion.div
                                        key={m._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <ShirtIcon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">
                                                    {m.profileName}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                        {m.garmentType}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        • {Object.keys(m.measurements || {}).filter((k) => k !== 'measurementLayout').length} metrics
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(m)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(m._id)}
                                                className="p-2 text-gray-300 hover:text-error hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </div>
    );
};

export default MeasurementsPage;
