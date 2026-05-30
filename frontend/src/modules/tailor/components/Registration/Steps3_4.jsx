import React from 'react';
import { Input } from '../UIElements';
import ImageUploader from '../../../../components/Common/ImageUploader';

export const Step3Docs = ({ register, errors, setValue, watch }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
                <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">Important</p>
                <p className="text-xs text-orange-800 font-medium leading-relaxed">Please ensure all images are clear and text is readable for faster approval.</p>
            </div>

            <Input
                label="Aadhar Number"
                placeholder="12 digit number"
                maxLength={12}
                {...register('aadharNumber', { 
                    required: 'Aadhar is required',
                    pattern: {
                        value: /^\d{12}$/,
                        message: 'Aadhar must be exactly 12 digits'
                    },
                    onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                    }
                })}
                error={errors.aadharNumber?.message}
            />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ImageUploader
                        label="Aadhar Front"
                        value={watch('aadharFront')}
                        onChange={(file) => setValue('aadharFront', file, { shouldValidate: true })}
                    />
                    {errors.aadharFront && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.aadharFront.message}</p>}
                </div>
                <div>
                    <ImageUploader
                        label="Aadhar Back"
                        value={watch('aadharBack')}
                        onChange={(file) => setValue('aadharBack', file, { shouldValidate: true })}
                    />
                    {errors.aadharBack && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.aadharBack.message}</p>}
                </div>
            </div>

            <Input
                label="PAN Number"
                placeholder="ABCDE1234F"
                maxLength={10}
                {...register('panNumber', { 
                    required: 'PAN is required',
                    pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Invalid PAN format (e.g. ABCDE1234F)'
                    },
                    onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase();
                    }
                })}
                error={errors.panNumber?.message}
            />
            <div>
                <ImageUploader
                    label="PAN Card Image"
                    value={watch('panImage')}
                    onChange={(file) => setValue('panImage', file, { shouldValidate: true })}
                />
                {errors.panImage && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.panImage.message}</p>}
            </div>

            <div>
                <ImageUploader
                    label="Shop License (Gumasta)"
                    value={watch('licenseImage')}
                    onChange={(file) => setValue('licenseImage', file, { shouldValidate: true })}
                />
                {errors.licenseImage && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.licenseImage.message}</p>}
            </div>
        </div>
    );
};

export const Step4Portfolio = ({ register, errors, setValue, watch }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Showcase Your Work</p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">Upload clear photos of your best creations to attract more customers.</p>
            </div>

            <div>
                <ImageUploader
                    label="Portfolio Image 1"
                    value={watch('portfolio1')}
                    onChange={(file) => setValue('portfolio1', file, { shouldValidate: true })}
                />
                {errors.portfolio1 && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.portfolio1.message}</p>}
            </div>
            
            <div>
                <ImageUploader
                    label="Portfolio Image 2"
                    value={watch('portfolio2')}
                    onChange={(file) => setValue('portfolio2', file, { shouldValidate: true })}
                />
                {errors.portfolio2 && <p className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.portfolio2.message}</p>}
            </div>

            <div className="space-y-4 mt-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Availability Schedule</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400">Working Days</label>
                        <select
                            {...register('workingDays', { required: 'Working days required' })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                        >
                            <option value="">Select Days</option>
                            <option value="mon-fri">Mon - Fri</option>
                            <option value="mon-sat">Mon - Sat</option>
                            <option value="everyday">Everyday (Mon-Sun)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400">Daily Hours</label>
                        <select
                            {...register('workingHours', { required: 'Working hours required' })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                        >
                            <option value="">Select Hours</option>
                            <option value="9-5">9:00 AM - 5:00 PM</option>
                            <option value="10-7">10:00 AM - 7:00 PM</option>
                            <option value="10-8">10:00 AM - 8:00 PM</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
