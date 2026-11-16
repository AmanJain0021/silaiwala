// Port of modules/customer/pages/Measurements.jsx (converted with scripts/web2rn.js, then reviewed)
import { confirm } from '../lib/alert';
import Select from '../components/ui/Select';
import Screen from '../components/common/Screen';
import React, { useEffect, useMemo, useState } from "react";
import { Ruler, Plus, Trash2, ChevronLeft, Shirt as ShirtIcon, Edit2 } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import toast from '../lib/toast';
import useMeasurementStore from "../store/measurementStore";
import BottomNav from "../components/customer/BottomNav";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import api from "../lib/api";
import { isHeadingField, getInputFields } from "../utils/measurementFields";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const FALLBACK_FIELDS = [{
  key: 'chest',
  label: 'Chest',
  placeholder: '0.0',
  isRequired: true
}, {
  key: 'waist',
  label: 'Waist',
  placeholder: '0.0',
  isRequired: true
}, {
  key: 'length',
  label: 'Length',
  placeholder: '0.0',
  isRequired: true
}, {
  key: 'shoulder',
  label: 'Shoulder',
  placeholder: '0.0',
  isRequired: true
}];
const emptyForm = () => ({
  profileName: '',
  garmentType: '',
  categoryId: null,
  unit: 'inches',
  notes: '',
  measurements: {}
});
const MeasurementsPage = () => {
  const navigate = useNavigate();
  const {
    measurements,
    isLoading,
    fetchMeasurements,
    addMeasurement,
    deleteMeasurement,
    updateMeasurement
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
        const res = await api.get('/products/categories', {
          params: {
            type: 'service'
          }
        });
        if (res.data.success) {
          const list = (res.data.data || []).filter(c => c?.name);
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
  const selectedCategory = useMemo(() => serviceCategories.find(c => String(c._id) === String(formData.categoryId)) || null, [serviceCategories, formData.categoryId]);
  const activeFields = useMemo(() => {
    const fields = selectedCategory?.measurementFields;
    if (Array.isArray(fields) && fields.length > 0) {
      return fields.filter(f => f.label && (isHeadingField(f) || f.key));
    }
    return FALLBACK_FIELDS;
  }, [selectedCategory]);
  const inputFields = useMemo(() => getInputFields(activeFields), [activeFields]);
  const handleServiceSelect = categoryId => {
    const cat = serviceCategories.find(c => String(c._id) === String(categoryId));
    setFormData(prev => ({
      ...prev,
      categoryId: cat?._id || null,
      garmentType: cat?.name || '',
      measurements: {} // reset values when service changes
    }));
  };
  const handleAdd = async e => {
    if (!formData.profileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }
    if (!formData.categoryId || !formData.garmentType) {
      toast.error('Please select a service / garment type');
      return;
    }
    const missingRequired = inputFields.filter(f => {
      if (f.isRequired === false) return false;
      const v = formData.measurements[f.key];
      return v === undefined || v === null || v === '' || Number.isNaN(Number(v));
    });
    if (missingRequired.length > 0) {
      toast.error(`Please fill: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }
    try {
      const payload = {
        profileName: formData.profileName.trim(),
        garmentType: formData.garmentType,
        categoryId: formData.categoryId,
        unit: formData.unit || 'inches',
        notes: formData.notes || '',
        measurements: formData.measurements
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
  const handleEdit = m => {
    setEditingId(m._id);
    const matched = serviceCategories.find(c => String(c._id) === String(m.categoryId)) || serviceCategories.find(c => c.name?.toLowerCase().trim() === String(m.garmentType || '').toLowerCase().trim());
    setFormData({
      profileName: m.profileName || '',
      garmentType: matched?.name || m.garmentType || '',
      categoryId: matched?._id || m.categoryId || null,
      unit: m.unit || 'inches',
      notes: m.notes || '',
      measurements: m.measurements || {}
    });
    setIsAdding(true);
  };
  const handleDelete = async id => {
    if (await confirm('Are you sure you want to delete this profile?')) {
      await deleteMeasurement(id);
      toast.success('Profile deleted');
    }
  };
  const handleMeasureChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value === '' ? '' : parseFloat(value)
      }
    }));
  };
  return <Screen className="bg-gray-50" bottom={false}><Box className="flex-1 bg-gray-50 text-gray-900 font-sans">
            <Box className="bg-white px-6 pt-4 pb-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <Btn onPress={() => navigate('/user/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-primary">
                    <I icon={ChevronLeft} size={24} />
                </Btn>
                <Txt className="text-xl font-bold text-primary">My Measurements</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            <Box className="max-w-md mx-auto px-4 py-6">
                <React.Fragment>
                    {isAdding ? <Box key="form" className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mb-8">
                            <Box className="flex items-center justify-between mb-8">
                                <Txt className="text-lg font-bold text-primary">
                                    {editingId ? 'Edit Profile' : 'New Profile'}
                                </Txt>
                                <Btn onPress={resetForm} className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Cancel
                                </Btn>
                            </Box>

                            <Box className="space-y-6">
                                <Box className="space-y-2">
                                    <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                        Profile Name
                                    </Txt>
                                    <Input placeholder="e.g. My Regular Fit" value={formData.profileName} onChange={e => setFormData({
                ...formData,
                profileName: e.target.value
              })} required />
                                </Box>

                                <Box className="space-y-2">
                                    <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                        Service / Garment Type
                                    </Txt>
                                    <Select className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 transition-all text-sm" value={formData.categoryId || ''} onChange={v => handleServiceSelect(v)} disabled={loadingCategories} title="Service / Garment Type"
                                        placeholder={loadingCategories ? 'Loading services…' : 'Select a service'}
                                        options={[{ value: '', label: loadingCategories ? 'Loading services…' : 'Select a service' }, ...serviceCategories.map(cat => ({ value: cat._id, label: cat.name }))]} />
                                    <Txt className="text-[10px] text-gray-400 font-medium ml-1">
                                        Measurement form below matches the service admin configured.
                                    </Txt>
                                </Box>

                                {formData.categoryId ? <Box className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        {activeFields.map((field, idx) => {
                if (isHeadingField(field)) {
                  return <Box key={`heading-${idx}-${field.label}`} className="col-span-2 pt-2 first:pt-0">
                                                        <Txt className="text-[10px] font-black uppercase tracking-[0.14em] text-primary border-b border-primary/15 pb-1.5">
                                                            {field.label}
                                                        </Txt>
                                                    </Box>;
                }
                return <Box key={field.key || idx} className="space-y-2">
                                                <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                                    {field.label}
                                                    {field.isRequired !== false ? '' : ' (optional)'}
                                                </Txt>
                                                <Input type="number" step="0.1" placeholder={field.placeholder || '0.0'} value={formData.measurements[field.key] === undefined || formData.measurements[field.key] === '' ? '' : formData.measurements[field.key]} onChange={e => handleMeasureChange(field.key, e.target.value)} required={field.isRequired !== false} />
                                            </Box>;
              })}
                                    </Box> : <Box className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                        <Txt className="text-xs text-gray-400 font-semibold">
                                            Select a service above to load its measurement form
                                        </Txt>
                                    </Box>}

                                <Button className="w-full bg-primary h-14 rounded-full text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all" type="submit" disabled={isLoading || !formData.categoryId}>
                                    {isLoading ? 'Saving...' : editingId ? 'Update Profile' : 'Save Profile'}
                                </Button>
                            </Box>
                        </Box> : <Box key="list" className="space-y-4">
                            <Box className="bg-primary p-6 rounded-[2rem] text-white shadow-lg shadow-primary/20 mb-8 relative overflow-hidden">
                                <Box className="absolute top-0 right-0 p-4 opacity-10">
                                    <I icon={Ruler} size={120} />
                                </Box>
                                <Txt className="text-lg font-bold mb-1">Your measurement profiles</Txt>
                                <Txt className="text-white/70 text-xs mb-4 max-w-[220px]">
                                    Only you can see these. Each profile is saved for one service type.
                                </Txt>
                                <Btn onPress={() => setIsAdding(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all">
                                    <I icon={Plus} size={16} /> Add New Profile
                                </Btn>
                            </Box>

                            {measurements.length === 0 && !isLoading ? <Box className="text-center py-20 px-10">
                                    <Box className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <I icon={Ruler} size={32} />
                                    </Box>
                                    <Txt className="font-bold text-gray-400 mb-1">No profiles yet</Txt>
                                    <Txt className="text-gray-400 text-xs">
                                        Save your first body measurement profile for a service.
                                    </Txt>
                                </Box> : measurements.map((m, idx) => <Box key={m._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                        <Box className="flex items-center gap-4 min-w-0">
                                            <Box className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <I icon={ShirtIcon} size={20} />
                                            </Box>
                                            <Box className="min-w-0">
                                                <Txt className="font-bold text-gray-900 text-sm truncate">
                                                    {m.profileName}
                                                </Txt>
                                                <Box className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Txt className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                        {m.garmentType}
                                                    </Txt>
                                                    <Txt className="text-[10px] text-gray-400">
                                                        • {Object.keys(m.measurements || {}).filter(k => k !== 'measurementLayout').length} metrics
                                                    </Txt>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box className="flex items-center gap-2 shrink-0">
                                            <Btn onPress={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                <I icon={Edit2} size={16} />
                                            </Btn>
                                            <Btn onPress={() => handleDelete(m._id)} className="p-2 text-gray-300 hover:text-error hover:bg-red-50 rounded-lg transition-all">
                                                <I icon={Trash2} size={16} />
                                            </Btn>
                                        </Box>
                                    </Box>)}
                        </Box>}
                </React.Fragment>
            </Box>

                        </Scroll>
<BottomNav />
        </Box></Screen>;
};
export default MeasurementsPage;
