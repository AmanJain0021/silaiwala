// Port of modules/tailor/components/GarmentForm.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../components/ui/Spin';
import { alert } from '../../lib/alert';
import Select from '../../components/ui/Select';
import { pickImage, readAsDataUrl } from '../../lib/files';
import { Dialog, Sheet } from '../../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Image as ImageIcon, Camera } from "lucide-react-native";
import api from "../../lib/api";
import toast from '../../lib/toast';
import { compressImage } from "../../utils/imageCompression";
import { Box, Txt, Btn, I, Input, Img, Scroll } from '../ui/primitives';
const GarmentForm = ({
  initialData,
  categories,
  onClose,
  onSubmitSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    subCategory: '',
    brand: '',
    fabric: '',
    gender: 'Unisex',
    occasion: '',
    fitType: '',
    pattern: '',
    washCare: '',
    images: [],
    variants: [] // { size, color, stock, sku }
  });
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    stock: 0,
    sku: ''
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        discountPrice: initialData.discountPrice || '',
        category: initialData.category?._id || initialData.category || '',
        subCategory: initialData.subCategory?._id || initialData.subCategory || '',
        brand: initialData.brand || '',
        fabric: initialData.fabric || '',
        gender: initialData.gender || 'Unisex',
        occasion: initialData.occasion || '',
        fitType: initialData.fitType || '',
        pattern: initialData.pattern || '',
        washCare: initialData.washCare || '',
        images: initialData.images || (initialData.image ? [initialData.image] : []),
        variants: initialData.variants || []
      });
    }
  }, [initialData]);
  const handleImageUpload = async (camera = false) => {
    const file = await pickImage({ camera });
    if (!file) return;
    setIsImageUploading(true);
    try {
      const compressedFile = await compressImage(file, 1200, 0.8);
      const uploadData = new FormData();
      uploadData.append('image', compressedFile);
      let imageUrl = '';
      try {
        const res = await api.post('/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const rawData = res.data?.data;
        imageUrl = rawData?.url || (Array.isArray(rawData) ? rawData[0] : rawData) || res.data?.url;
      } catch (err) {
        console.warn('Backend /upload failed, trying /upload/public:', err);
        try {
          const resPub = await api.post('/upload/public', uploadData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          const rawData = resPub.data?.data;
          imageUrl = rawData?.url || (Array.isArray(rawData) ? rawData[0] : rawData) || resPub.data?.url;
        } catch (pubErr) {
          console.warn('Public upload failed, using compressed Base64 fallback:', pubErr);
          imageUrl = await readAsDataUrl(compressedFile).catch(() => '');
        }
      }
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Image upload failed');
    } finally {
      setIsImageUploading(false);
    }
  };
  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };
  const removeImage = indexToRemove => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };
  const addVariant = () => {
    if (newVariant.size || newVariant.color) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant]
      }));
      setNewVariant({
        size: '',
        color: '',
        stock: 0,
        sku: ''
      });
    }
  };
  const removeVariant = indexToRemove => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, index) => index !== indexToRemove)
    }));
  };
  const handleSubmit = async e => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.name,
        // fallback for legacy
        productType: 'store_item',
        stock: formData.variants.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0)
      };
      let res;
      if (initialData?._id) {
        res = await api.patch(`/tailors/products/${initialData._id}`, payload);
      } else {
        res = await api.post('/tailors/products', payload);
      }
      if (res.data.success) {
        const msg = res.data.message;
        if (msg) toast.success(msg);else if (!initialData?._id) {
          toast.success('Submitted for admin approval. Customers will see it after approval.');
        } else {
          toast.success('Updated. Changes may need admin approval before going live.');
        }
        onSubmitSuccess();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Dialog visible={!!(true)} onClose={onClose} className={`bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <Box className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100/60">
                    <Box>
                        <Txt className="text-2xl font-black text-[#843D9B] tracking-tight leading-none">
                            {initialData ? 'Update Garment' : 'Add New Garment'}
                        </Txt>
                        <Txt className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                            Fill in comprehensive details for your ready-made garment
                        </Txt>
                    </Box>
                    <Btn onPress={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm cursor-pointer">
                        <I icon={X} size={20} />
                    </Btn>
                </Box>

                {/* Form Content */}
                <Scroll contentClassName="p-8 pt-6 space-y-8" className="flex-1 custom-scrollbar" nestedScrollEnabled>
                    
                    {/* Basic Info */}
                    <Box className="space-y-4">
                        <Txt className="text-xs font-black uppercase tracking-wider text-[#843D9B] border-b border-gray-100 pb-2">1. Basic Information</Txt>
                        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Garment Name</Txt>
                                <Input className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Designer Wedding Sherwani" value={formData.name} onChangeText={e => setFormData({
                ...formData,
                name: e
              })} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Category</Txt>
                                <Select className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 appearance-none cursor-pointer shadow-sm" value={formData.category} onChange={e => setFormData({
                ...formData,
                category: e
              })} placeholder="Select Category" options={[{ value: '', label: 'Select Category' }, ...categories.map(cat => ({ value: cat._id, label: cat.name }))]} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Brand</Txt>
                                <Input className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm" placeholder="Brand Name" value={formData.brand} onChangeText={e => setFormData({
                ...formData,
                brand: e
              })} />
                            </Box>
                            <Box className="grid grid-cols-2 gap-4">
                                <Box className="space-y-1.5">
                                    <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Selling Price</Txt>
                                    <Input className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm" placeholder="₹" value={formData.price} onChangeText={e => setFormData({
                  ...formData,
                  price: e
                })} keyboardType="numeric" />
                                </Box>
                                <Box className="space-y-1.5">
                                    <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">MRP (Discount Price)</Txt>
                                    <Input className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm" placeholder="₹" value={formData.discountPrice} onChangeText={e => setFormData({
                  ...formData,
                  discountPrice: e
                })} keyboardType="numeric" />
                                </Box>
                            </Box>
                        </Box>
                        <Box className="space-y-1.5 mt-4">
                            <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Description</Txt>
                            <Input rows="3" className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 resize-none shadow-sm placeholder:text-gray-300" placeholder="Describe the garment..." value={formData.description} onChangeText={e => setFormData({
              ...formData,
              description: e
            })} multiline />
                        </Box>
                    </Box>

                    {/* Detailed Specifications */}
                    <Box className="space-y-4">
                        <Txt className="text-xs font-black uppercase tracking-wider text-[#843D9B] border-b border-gray-100 pb-2">2. Specifications</Txt>
                        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Gender</Txt>
                                <Select className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm appearance-none cursor-pointer" value={formData.gender} onChange={e => setFormData({
                ...formData,
                gender: e
              })} options={[{ value: 'Unisex', label: 'Unisex' }, { value: 'Men', label: 'Men' }, { value: 'Women', label: 'Women' }, { value: 'Kids', label: 'Kids' }]} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Fabric</Txt>
                                <Input className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Cotton Blend" value={formData.fabric} onChangeText={e => setFormData({
                ...formData,
                fabric: e
              })} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Fit Type</Txt>
                                <Input className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Regular Fit" value={formData.fitType} onChangeText={e => setFormData({
                ...formData,
                fitType: e
              })} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Pattern</Txt>
                                <Input className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Solid" value={formData.pattern} onChangeText={e => setFormData({
                ...formData,
                pattern: e
              })} />
                            </Box>
                            <Box className="space-y-1.5">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Occasion</Txt>
                                <Input className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Casual" value={formData.occasion} onChangeText={e => setFormData({
                ...formData,
                occasion: e
              })} />
                            </Box>
                            <Box className="space-y-1.5 md:col-span-3">
                                <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Wash Care</Txt>
                                <Input className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm" placeholder="e.g. Dry Clean Only" value={formData.washCare} onChangeText={e => setFormData({
                ...formData,
                washCare: e
              })} />
                            </Box>
                        </Box>
                    </Box>

                    {/* Variants */}
                    <Box className="space-y-4">
                        <Txt className="text-xs font-black uppercase tracking-wider text-[#843D9B] border-b border-gray-100 pb-2">3. Variants & Stock</Txt>
                        
                        <Box className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                            <Box className="flex gap-4 items-end mb-6">
                                <Box className="flex-1 space-y-1.5">
                                    <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Size</Txt>
                                    <Input className="w-full px-4 py-2.5 bg-white border border-gray-100 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl text-xs font-semibold text-gray-900 shadow-sm" placeholder="S, M, L" value={newVariant.size} onChangeText={e => setNewVariant({
                  ...newVariant,
                  size: e
                })} />
                                </Box>
                                <Box className="flex-1 space-y-1.5">
                                    <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Color</Txt>
                                    <Input className="w-full px-4 py-2.5 bg-white border border-gray-100 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl text-xs font-semibold text-gray-900 shadow-sm" placeholder="Red, Blue" value={newVariant.color} onChangeText={e => setNewVariant({
                  ...newVariant,
                  color: e
                })} />
                                </Box>
                                <Box className="flex-1 space-y-1.5">
                                    <Txt className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Stock</Txt>
                                    <Input className="w-full px-4 py-2.5 bg-white border border-gray-100 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl text-xs font-semibold text-gray-900 shadow-sm" placeholder="Qty" value={newVariant.stock} onChangeText={e => setNewVariant({
                  ...newVariant,
                  stock: e
                })} keyboardType="numeric" />
                                </Box>
                                <Btn onPress={addVariant} className="h-[38px] px-5 bg-[#843D9B] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#1f2152] transition-colors cursor-pointer shadow-md shadow-[#843D9B]/15">
                                    Add
                                </Btn>
                            </Box>

                            {formData.variants.length > 0 && <Box className="space-y-2.5 mt-4">
                                    {formData.variants.map((v, i) => <Box key={i} className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.015)] animate-in slide-in-from-top-1 duration-200">
                                            <Box className="flex gap-4 text-xs font-bold text-gray-700">
                                                <Txt>Size: <Txt className="text-gray-900 font-extrabold uppercase">{v.size || 'N/A'}</Txt></Txt>
                                                <Txt>Color: <Txt className="text-gray-900 font-extrabold uppercase">{v.color || 'N/A'}</Txt></Txt>
                                                <Txt className="text-[#843D9B]">Stock: <Txt className="font-extrabold">{v.stock}</Txt></Txt>
                                            </Box>
                                            <Btn onPress={() => removeVariant(i)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer">
                                                <I icon={Trash2} size={15} />
                                            </Btn>
                                        </Box>)}
                                </Box>}
                        </Box>
                    </Box>

                    {/* Images */}
                    <Box className="space-y-4">
                        <Txt className="text-xs font-black uppercase tracking-wider text-[#843D9B] border-b border-gray-100 pb-2">4. Multiple Images</Txt>
                        
                        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {formData.images.map((img, i) => <Box key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                                    <Img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    
                                    <Btn onPress={() => removeImage(i)} className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md p-2 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md transform translate-y-2 group-hover:translate-y-0 cursor-pointer">
                                        <I icon={Trash2} size={14} />
                                    </Btn>
                                </Box>)}
                            <Btn onPress={() => handleImageUpload(false)} disabled={isImageUploading} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center relative hover:bg-gray-100/50 hover:border-gray-300 transition-colors cursor-pointer">
                                {isImageUploading ? <Spin size={24} className="text-[#843D9B]" /> : <>
                                        <I icon={ImageIcon} size={24} className="text-gray-400 mb-2" />
                                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">Upload Image</Txt>
                                    </>}
                            </Btn>
                            <Btn onPress={() => handleImageUpload(true)} disabled={isImageUploading} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center relative hover:bg-gray-100/50 hover:border-gray-300 transition-colors cursor-pointer">
                                {isImageUploading ? <Spin size={24} className="text-[#843D9B]" /> : <>
                                        <I icon={Camera} size={24} className="text-gray-400 mb-2" />
                                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">Take Photo</Txt>
                                    </>}
                            </Btn>
                        </Box>

                        <Box className="flex gap-2">
                            <Input className="flex-1 px-4 py-2.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-sm placeholder:text-gray-400" placeholder="Or Paste Image URL" value={newImageUrl} onChangeText={e => setNewImageUrl(e)} />
                            <Btn onPress={addImageUrl} className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                Add URL
                            </Btn>
                        </Box>
                    </Box>

                </Scroll>

                {/* Footer */}
                <Box className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <Btn onPress={onClose} className="px-6 py-3 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer">
                        Cancel
                    </Btn>
                    <Btn form="garment-form" disabled={isSubmitting} className="px-8 py-3 rounded-2xl text-xs font-black text-white bg-[#843D9B] hover:bg-[#1f2152] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[#843D9B]/10">
                        {isSubmitting && <Spin size={12} className="text-white" />}
                        {initialData ? 'Save Changes' : 'Publish Garment'}
                    </Btn>
                </Box>

            </Box>
</Dialog>;
};
export default GarmentForm;
