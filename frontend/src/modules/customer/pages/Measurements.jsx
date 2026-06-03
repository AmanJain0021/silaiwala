import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Ruler, Plus, Trash2, ChevronLeft, Save, 
    MoreVertical, Check, Info, Shirt as ShirtIcon, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useMeasurementStore from '../../../store/measurementStore';
import BottomNav from '../components/BottomNav';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../utils/api';

const DEFAULT_GARMENT_TYPES = ["Shirt", "Pant", "Suit", "Kurta", "Blouse", "Skirt", "Other"];

const MeasurementsPage = () => {
    const navigate = useNavigate();
    const { 
        measurements, isLoading, fetchMeasurements, 
        addMeasurement, deleteMeasurement, updateMeasurement 
    } = useMeasurementStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [garmentCategories, setGarmentCategories] = useState(DEFAULT_GARMENT_TYPES);
    const [selectedGarment, setSelectedGarment] = useState("Shirt");
    const [formData, setFormData] = useState({
        profileName: '',
        garmentType: 'Shirt',
        unit: 'inches',
        notes: '',
        measurements: {}
    });

    useEffect(() => {
        fetchMeasurements();
        
        const fetchCategories = async () => {
            try {
                const res = await api.get('/products/categories?type=garment');
                if (res.data.success && res.data.data.length > 0) {
                    setGarmentCategories(res.data.data.map(c => c.name));
                }
            } catch (error) {
                console.error("Error fetching garment categories:", error);
            }
        };
        fetchCategories();
    }, [fetchMeasurements]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateMeasurement(editingId, formData);
            } else {
                await addMeasurement(formData);
            }
            resetForm();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            profileName: '',
            garmentType: 'Shirt',
            unit: 'inches',
            notes: '',
            measurements: {}
        });
    };

    const handleEdit = (m) => {
        setEditingId(m._id);
        setFormData({
            profileName: m.profileName,
            garmentType: m.garmentType,
            unit: m.unit || 'inches',
            notes: m.notes || '',
            measurements: m.measurements || {}
        });
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this profile?")) {
            await deleteMeasurement(id);
        }
    };

    const handleMeasureChange = (field, value) => {
        setFormData({
            ...formData,
            measurements: {
                ...formData.measurements,
                [field]: parseFloat(value) || 0
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <button 
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
                                <h3 className="text-lg font-bold text-primary">{editingId ? 'Edit Profile' : 'New Profile'}</h3>
                                <button 
                                    onClick={resetForm}
                                    className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Profile Name</label>
                                    <Input 
                                        placeholder="e.g. My Regular Fit"
                                        value={formData.profileName}
                                        onChange={(e) => setFormData({...formData, profileName: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Garment Type</label>
                                    <select 
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary outline-none bg-gray-50 transition-all text-sm appearance-none"
                                        value={formData.garmentType}
                                        onChange={(e) => setFormData({...formData, garmentType: e.target.value})}
                                    >
                                        {garmentCategories.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Chest</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.0"
                                            value={formData.measurements.chest || ''}
                                            onChange={(e) => handleMeasureChange('chest', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Waist</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.0"
                                            value={formData.measurements.waist || ''}
                                            onChange={(e) => handleMeasureChange('waist', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Length</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.0"
                                            value={formData.measurements.length || ''}
                                            onChange={(e) => handleMeasureChange('length', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Shoulder</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.0"
                                            value={formData.measurements.shoulder || ''}
                                            onChange={(e) => handleMeasureChange('shoulder', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    className="w-full bg-primary h-14 rounded-full text-white font-bold shadow-lg shadow-indigo-900/10 hover:bg-primary-dark transition-all"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : editingId ? 'Update Profile' : 'Save Profile'}
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
                            {/* Stats/Intro */}
                            <div className="bg-primary p-6 rounded-[2rem] text-white shadow-lg shadow-indigo-900/20 mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Ruler size={120} />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Stay Fit, Fit Well.</h3>
                                <p className="text-indigo-100/60 text-xs mb-4 max-w-[200px]">Save your body profiles once and use them for any tailor order.</p>
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all"
                                >
                                    <Plus size={16} /> Add New Profile
                                </button>
                            </div>

                            {measurements.length === 0 && !isLoading ? (
                                <div className="text-center py-20 px-10">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <Ruler size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-400 mb-1">No profiles yet</h4>
                                    <p className="text-gray-400 text-xs">Save your first body measurement profile to get started.</p>
                                </div>
                            ) : (
                                measurements.map((m, idx) => (
                                    <motion.div 
                                        key={m._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all active:scale-95 cursor-default"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
                                                <ShirtIcon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{m.profileName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{m.garmentType}</span>
                                                    <span className="text-[10px] text-gray-400">• {Object.keys(m.measurements).length} metrics</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(m)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(m._id)}
                                                className="p-2 text-gray-300 hover:text-error hover:bg-indigo-50 rounded-lg transition-all"
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
