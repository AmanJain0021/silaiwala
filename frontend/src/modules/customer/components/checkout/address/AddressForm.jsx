import React, { useState } from 'react';
import { Home, Briefcase, ChevronRight, Navigation } from 'lucide-react';
import useAddressStore from '../../../../../store/userStore';

const InputField = ({ label, name, placeholder, type = "text", required, form, errors, setForm, setErrors }) => (
    <div className="mb-3">
        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{label} {required && "*"}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={(e) => {
                setForm({ ...form, [name]: e.target.value });
                if (errors[name]) setErrors({ ...errors, [name]: null });
            }}
            className={`w-full text-xs font-semibold p-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-all ${errors[name] ? "border-red-300 focus:border-red-500 bg-indigo-50" : "border-gray-200 focus:border-primary bg-gray-50/50 focus:bg-white"
                }`}
        />
        {errors[name] && <span className="text-[9px] text-error font-medium ml-1">{errors[name]}</span>}
    </div>
);

const AddressForm = ({ onCancel, onSuccess }) => {
    const addAddress = useAddressStore((state) => state.addAddress);
    const [isLocating, setIsLocating] = useState(false);

    const [form, setForm] = useState({
        receiverName: '', phone: '', zipCode: '',
        street: '', city: '', state: '', type: 'Home'
    });

    const [errors, setErrors] = useState({});

    const handleAutoLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        setForm(prev => ({
                            ...prev,
                            street: data.display_name || '',
                            city: addr.city || addr.town || addr.village || addr.suburb || '',
                            state: addr.state || '',
                            zipCode: addr.postcode || ''
                        }));
                    }
                } catch (error) {
                    console.error("Geocoding failed:", error);
                } finally {
                    setIsLocating(false);
                }
            }, (error) => {
                alert("Location access denied. Please enter manually.");
                setIsLocating(false);
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!form.receiverName.trim()) newErrors.receiverName = "Required";
        if (!form.phone.match(/^\d{10}$/)) newErrors.phone = "Invalid Phone";
        if (!form.zipCode.match(/^\d{6}$/)) newErrors.zipCode = "Invalid Pin";
        if (!form.street.trim()) newErrors.street = "Required";
        if (!form.city.trim()) newErrors.city = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            addAddress(form);
            onSuccess && onSuccess();
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
                    <InputField label="Phone Number" name="phone" placeholder="9876543210" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Pincode" name="zipCode" placeholder="110001" required form={form} errors={errors} setForm={setForm} setErrors={setErrors} />
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
                        className="py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-indigo-900/10 hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Save Address <ChevronRight size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddressForm;
