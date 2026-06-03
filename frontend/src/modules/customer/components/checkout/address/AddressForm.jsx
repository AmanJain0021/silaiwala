import React, { useState } from 'react';
import { Home, Briefcase, ChevronRight, Navigation } from 'lucide-react';
import useAddressStore from '../../../../../store/userStore';
import { validateName, validatePhone, validatePincode } from '../../../../../utils/validation';
import useAuthStore from '../../../../../store/authStore';
import useLocationStore from '../../../../../store/locationStore';
import { useGoogleLocation } from '../../../../../hooks/useGoogleLocation';

const InputField = ({ label, name, placeholder, type = "text", required, form, errors, setForm, setErrors, maxLength, prefix }) => (
    <div className="mb-3">
        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{label} {required && "*"}</label>
        <div className="relative flex items-center">
            {prefix && (
                <span className="absolute left-3 text-xs font-bold text-gray-800">
                    {prefix}
                </span>
            )}
            <input
                type={type}
                maxLength={maxLength}
                placeholder={placeholder}
                value={form[name]}
                onChange={(e) => {
                    let val = e.target.value;
                    if (name === 'phone' || name === 'zipCode') {
                        val = val.replace(/\D/g, '');
                    }
                    setForm({ ...form, [name]: val });
                    if (errors[name]) setErrors({ ...errors, [name]: null });
                }}
                className={`w-full text-xs font-semibold p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-all ${prefix ? 'pl-9' : ''} ${
                    errors[name] ? "border-red-300 focus:border-red-500 bg-indigo-50" : "border-gray-200 focus:border-primary bg-gray-50/50 focus:bg-white"
                }`}
            />
        </div>
        {errors[name] && <span className="text-[9px] text-error font-medium ml-1">{errors[name]}</span>}
    </div>
);

const AddressForm = ({ onCancel, onSuccess }) => {
    const addAddress = useAddressStore((state) => state.addAddress);
    const isLoading = useAddressStore((state) => state.isLoading);
    const user = useAuthStore((state) => state.user);
    const { detectLocation, isLocating } = useGoogleLocation();

    const [form, setForm] = useState({
        receiverName: user?.name || user?.fullName || '',
        phone: user?.phone || user?.phoneNumber || '',
        zipCode: '',
        street: '', city: '', state: '', type: 'Home',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                await addAddress(form);
                onSuccess && onSuccess();
            } catch (err) {
                console.error("Add address failed", err);
            }
        }
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl border border-gray-100 selection:bg-indigo-100 selection:text-primary">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        New Address Details
                    </h3>
                </div>
                
                <button 
                    type="button"
                    onClick={handleAutoLocation}
                    disabled={isLocating}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLocating ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    ) : (
                        <Navigation size={14} className="fill-primary/10" />
                    )}
                    {isLocating ? 'Fetching...' : 'Detect Current Location'}
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Contact Name" name="receiverName" placeholder="John Doe" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                    <InputField label="Phone Number" name="phone" type="tel" maxLength={10} prefix="+91" placeholder="9876543210" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Pincode" name="zipCode" type="tel" maxLength={6} placeholder="110001" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                    <InputField label="City" name="city" placeholder="New Delhi" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                </div>

                <InputField label="Address (House No, Area, Landmark)" name="street" placeholder="Flat 402, Block A, Main Road" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                <InputField label="State" name="state" placeholder="Delhi" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />

                {/* Type Selection */}
                <div className="mb-6">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Address Type</label>
                    <div className="flex gap-2">
                        {['Home', 'Work', 'Other'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setForm({ ...form, type })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${form.type === type
                                    ? "bg-primary text-white shadow-md ring-2 ring-indigo-100"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {type === 'Home' && <Home size={12} />}
                                {type === 'Work' && <Briefcase size={12} />}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-indigo-900/10 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark active:scale-95'}`}
                    >
                        {isLoading ? 'Saving...' : 'Save Address'} <ChevronRight size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddressForm;
