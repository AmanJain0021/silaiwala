// Port of modules/customer/components/checkout/address/AddressForm.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import { alert } from '../../../lib/alert';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Home, Briefcase, ChevronRight, Navigation, MapPin, X } from "lucide-react-native";
import useAddressStore from "../../../store/userStore";
import { validateName, validatePhone, validatePincode } from "../../../utils/validation";
import useAuthStore from "../../../store/authStore";
import useLocationStore from "../../../store/locationStore";
import useUnifiedLocation from "../../../shared/hooks/useUnifiedLocation";
import { geocodeAddress } from "../../../lib/places";
import { Box, Txt, Input, Btn, I, Scroll } from '../../ui/primitives';
const InputField = ({
  label,
  name,
  placeholder,
  type = "text",
  required,
  form,
  errors,
  setForm,
  setErrors,
  maxLength,
  prefix
}) => <Box className="mb-3">
        <Txt className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{label} {required && "*"}</Txt>
        <Box className="relative flex items-center">
            {prefix && <Txt className="absolute left-3 text-xs font-bold text-gray-800">
                    {prefix}
                </Txt>}
            <Input maxLength={maxLength} keyboardType={type === 'tel' ? 'phone-pad' : 'default'} placeholder={placeholder} value={form[name]} onChangeText={e => {
      let val = e;
      if (name === 'phone' || name === 'zipCode') {
        val = val.replace(/\D/g, '');
      }
      setForm({
        ...form,
        [name]: val
      });
      if (errors[name]) setErrors({
        ...errors,
        [name]: null
      });
    }} className={`w-full text-xs font-semibold p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-all ${prefix ? 'pl-9' : ''} ${errors[name] ? "border-red-300 focus:border-red-500 bg-indigo-50" : "border-gray-200 focus:border-primary bg-gray-50/50 focus:bg-white"}`} />
        </Box>
        {errors[name] && <Txt className="text-[9px] text-red-500 font-medium ml-1">{errors[name]}</Txt>}
    </Box>;
import PlacesAutocompleteField from "../../shared/PlacesAutocompleteField";
const AddressForm = ({
  onCancel,
  onSuccess,
  initialData = null
}) => {
  const addAddress = useAddressStore(state => state.addAddress);
  const updateAddress = useAddressStore(state => state.updateAddress);
  const isLoading = useAddressStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const {
    detectLocation,
    isLocating
  } = useUnifiedLocation({
    fetchAddress: true
  });
  const isLoaded = true;
  const cleanPhone = p => {
    if (!p) return '';
    let cleaned = p.toString().replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };
  const [form, setForm] = useState(initialData ? {
    ...initialData,
    receiverName: initialData.receiverName || '',
    phone: cleanPhone(initialData.phone) || '',
    zipCode: initialData.zipCode || '',
    street: initialData.street || '',
    city: initialData.city || '',
    state: initialData.state || '',
    type: initialData.type || 'Home',
    location: initialData.location || null
  } : {
    receiverName: user?.name || user?.fullName || '',
    phone: cleanPhone(user?.phone || user?.phoneNumber) || '',
    zipCode: '',
    street: '',
    city: '',
    state: '',
    type: 'Home',
    location: null
  });
  const [errors, setErrors] = useState({});
  const handleAutoLocation = async () => {
    try {
      const data = await detectLocation();
      if (data) {
        setForm(prev => ({
          ...prev,
          street: data.address,
          city: data.city || '',
          state: data.state || '',
          zipCode: data.pincode || '',
          location: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude]
          }
        }));
        useLocationStore.getState().setLocation(data.address, data.latitude, data.longitude);
      }
    } catch (error) {
      console.error(error);
      alert("Could not fetch address details automatically. Please enter manually.");
    }
  };
  const handlePlaceSelect = useCallback(placeData => {
    setForm(prev => ({
      ...prev,
      street: placeData.address,
      // Note: the shared component returns 'address'
      city: placeData.city || prev.city,
      state: placeData.state || prev.state,
      zipCode: placeData.pincode || prev.zipCode,
      location: {
        type: 'Point',
        coordinates: [placeData.longitude, placeData.latitude]
      }
    }));

    // Clear any street errors
    setErrors(prev => ({
      ...prev,
      street: null
    }));
  }, []);
  const validate = () => {
    const newErrors = {};
    const nameErr = validateName(form.receiverName, "Contact Name");
    if (nameErr) newErrors.receiverName = nameErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) newErrors.phone = phoneErr;
    const pinErr = validatePincode(form.zipCode);
    if (pinErr) newErrors.zipCode = pinErr;
    if (!form.street.trim()) newErrors.street = "Required";
    if (!form.city.trim()) newErrors.city = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async e => {
    if (validate()) {
      setErrors({});
      let finalForm = {
        ...form
      };
      try {
        // If coordinates are missing, try to geocode the address
        if (!finalForm.location?.coordinates?.[0] || !finalForm.location?.coordinates?.[1]) {
          const addressString = `${finalForm.street}, ${finalForm.city}, ${finalForm.state}, ${finalForm.zipCode}`;
          const geoResult = await geocodeAddress(addressString);
          if (geoResult) {
            finalForm.location = { type: 'Point', coordinates: [geoResult.lng, geoResult.lat] };
          }
        }
        if (initialData && initialData._id) {
          await updateAddress(initialData._id, finalForm);
        } else {
          await addAddress(finalForm);
        }
        onSuccess && onSuccess();
      } catch (err) {
        console.error("Save address failed", err);
      }
    }
  };
  return <Box className="bg-white rounded-[2rem] p-6 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl border border-gray-100 selection:bg-indigo-100 selection:text-primary">
            <Box className="flex flex-col gap-4 mb-6">
                <Box className="flex justify-between items-center">
                    <Txt className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-1.5 h-6 bg-primary rounded-full" />
                        {initialData ? 'Edit Address Details' : 'New Address Details'}
                    </Txt>
                </Box>
                
                <Btn onPress={handleAutoLocation} disabled={isLocating} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50">
                    {isLocating ? <Spin size={14} className="text-primary" /> : <I icon={Navigation} size={14} className="fill-primary/10" />}
                    {isLocating ? 'Fetching...' : 'Detect Current Location'}
                </Btn>
            </Box>

            <Box>
                <Box className="grid grid-cols-2 gap-3">
                    <InputField label="Contact Name" name="receiverName" placeholder="John Doe" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                    <InputField label="Phone Number" name="phone" type="tel" maxLength={10} prefix="+91" placeholder="9876543210" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                </Box>

                <Box className="grid grid-cols-2 gap-3">
                    <InputField label="Pincode" name="zipCode" type="tel" maxLength={6} placeholder="110001" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                    <InputField label="City" name="city" placeholder="New Delhi" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                </Box>

                {/* Google Places Autocomplete Address Field */}
                {isLoaded ? <PlacesAutocompleteField label="Address (House No, Area, Landmark)" name="street" placeholder="Start typing your address..." required value={form.street} error={errors.street} onChange={val => {
        setForm({
          ...form,
          street: val
        });
        if (errors.street) setErrors({
          ...errors,
          street: null
        });
      }} onClear={() => {
        setForm({
          ...form,
          street: ''
        });
      }} onPlaceSelect={handlePlaceSelect} /> : <InputField label="Address (House No, Area, Landmark)" name="street" placeholder="Flat 402, Block A, Main Road" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />}

                {/* Show coordinates badge if location is set */}
                {form.location?.coordinates?.[0] && form.location?.coordinates?.[1] && <Box className="mb-3 flex items-center gap-2">
                        <Txt className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                            <I icon={MapPin} size={10} className="text-emerald-500" />
                            GPS: {Number(form.location.coordinates[1]).toFixed(5)}, {Number(form.location.coordinates[0]).toFixed(5)}
                        </Txt>
                    </Box>}

                <InputField label="State" name="state" placeholder="Delhi" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />

                {/* Type Selection */}
                <Box className="mb-6">
                    <Txt className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Address Type</Txt>
                    <Box className="flex gap-2">
                        {['Home', 'Work', 'Other'].map(type => <Btn key={type} onPress={() => setForm({
            ...form,
            type
          })} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${form.type === type ? "bg-primary text-white shadow-md ring-2 ring-indigo-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                                {type === 'Home' && <I icon={Home} size={12} />}
                                {type === 'Work' && <I icon={Briefcase} size={12} />}
                                {type}
                            </Btn>)}
                    </Box>
                </Box>

                <Box className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <Btn onPress={onCancel} disabled={isLoading} className="py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                        Cancel
                    </Btn>
                    <Btn onPress={handleSubmit} disabled={isLoading} className={`py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-indigo-900/10 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark active:scale-95'}`}>
                        {isLoading ? 'Saving...' : 'Save Address'} <I icon={ChevronRight} size={14} />
                    </Btn>
                </Box>
            </Box>
        </Box>;
};
export default AddressForm;
