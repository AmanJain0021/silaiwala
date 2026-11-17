// Port of modules/tailor/components/Registration/Steps3_4.jsx (converted with scripts/web2rn.js, then reviewed)
import Select from '../../../components/ui/Select';
import { rnField } from '../../../lib/rnForm';
import React from "react";
import { Input } from "../UIElements";
import ImageUploader from "../../common/ImageUploader";
import { Box, Txt, Scroll } from '../../ui/primitives';
export const Step3Docs = ({
  register,
  errors,
  setValue,
  watch,
  clearErrors
}) => {
  const field = rnField(register, watch, setValue);
  return <Box className="space-y-6 animate-in slide-in-from-right duration-300">
            <Box className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
                <Txt className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">Important</Txt>
                <Txt className="text-xs text-orange-800 font-medium leading-relaxed">Please ensure all images are clear and text is readable for faster approval.</Txt>
            </Box>

            <Input label="Aadhar Number" placeholder="12 digit number" maxLength={12} {...field('aadharNumber', {
      required: 'Aadhar is required',
      pattern: {
        value: /^\d{12}$/,
        message: 'Aadhar must be exactly 12 digits'
      },
      onChange: e => {
        const sanitized = e.target.value.replace(/\D/g, '');
        setValue('aadharNumber', sanitized, {
          shouldValidate: true
        });
        if (clearErrors && sanitized.length === 12) clearErrors('aadharNumber');
      }
    })} error={errors.aadharNumber?.message} />
            <Box className="grid grid-cols-2 gap-4">
                <Box>
                    <ImageUploader label="Aadhar Front *" value={watch('aadharFront')} onChange={file => {
          setValue('aadharFront', file, {
            shouldValidate: true
          });
          if (clearErrors && file) clearErrors('aadharFront');
        }} error={errors.aadharFront?.message} />
                    {errors.aadharFront && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.aadharFront.message}</Txt>}
                </Box>
                <Box>
                    <ImageUploader label="Aadhar Back *" value={watch('aadharBack')} onChange={file => {
          setValue('aadharBack', file, {
            shouldValidate: true
          });
          if (clearErrors && file) clearErrors('aadharBack');
        }} error={errors.aadharBack?.message} />
                    {errors.aadharBack && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.aadharBack.message}</Txt>}
                </Box>
            </Box>

            <Input label="PAN Number" placeholder="ABCDE1234F" maxLength={10} {...field('panNumber', {
      required: 'PAN is required',
      pattern: {
        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        message: 'Invalid PAN format (e.g. ABCDE1234F)'
      },
      onChange: e => {
        const uppercaseVal = e.target.value.toUpperCase();
        setValue('panNumber', uppercaseVal, {
          shouldValidate: true
        });
        if (clearErrors && uppercaseVal.length === 10) clearErrors('panNumber');
      }
    })} error={errors.panNumber?.message} />
            <Box>
                <ImageUploader label="PAN Card Image *" value={watch('panImage')} onChange={file => {
        setValue('panImage', file, {
          shouldValidate: true
        });
        if (clearErrors && file) clearErrors('panImage');
      }} error={errors.panImage?.message} />
                {errors.panImage && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.panImage.message}</Txt>}
            </Box>

            <Box>
                <ImageUploader label="Shop License (Gumasta)" value={watch('licenseImage')} onChange={file => {
        setValue('licenseImage', file, {
          shouldValidate: true
        });
        if (clearErrors && file) clearErrors('licenseImage');
      }} error={errors.licenseImage?.message} />
                {errors.licenseImage && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.licenseImage.message}</Txt>}
            </Box>
        </Box>;
};
export const Step4Portfolio = ({
  register,
  errors,
  setValue,
  watch,
  clearErrors
}) => {
  const field = rnField(register, watch, setValue);
  return <Box className="space-y-6 animate-in slide-in-from-right duration-300">
            <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                <Txt className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Showcase Your Work</Txt>
                <Txt className="text-xs text-gray-600 font-medium leading-relaxed">Upload clear photos of your best creations to attract more customers.</Txt>
            </Box>

            <Box>
                <ImageUploader label="Portfolio Image 1" value={watch('portfolio1')} onChange={file => {
        setValue('portfolio1', file, {
          shouldValidate: true
        });
        if (clearErrors && file) clearErrors('portfolio1');
      }} error={errors.portfolio1?.message} />
                {errors.portfolio1 && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.portfolio1.message}</Txt>}
            </Box>
            
            <Box>
                <ImageUploader label="Portfolio Image 2" value={watch('portfolio2')} onChange={file => {
        setValue('portfolio2', file, {
          shouldValidate: true
        });
        if (clearErrors && file) clearErrors('portfolio2');
      }} error={errors.portfolio2?.message} />
                {errors.portfolio2 && <Txt className="text-[10px] text-red-500 font-bold pl-2 mt-1">{errors.portfolio2.message}</Txt>}
            </Box>

            <Box className="space-y-4 mt-6">
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Availability Schedule</Txt>

                <Box className="grid grid-cols-2 gap-4">
                    <Box className="space-y-1">
                        <Txt className="text-[10px] font-bold text-gray-400">Working Days</Txt>
                        <Select {...field('workingDays', {
            required: 'Working days required',
            onChange: e => {
              setValue('workingDays', e.target.value, {
                shouldValidate: true
              });
              if (clearErrors && e.target.value) clearErrors('workingDays');
            }
          })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium" options={[{ value: '', label: 'Select Days' }, { value: 'mon-fri', label: 'Mon - Fri' }, { value: 'mon-sat', label: 'Mon - Sat' }, { value: 'everyday', label: 'Everyday (Mon-Sun)' }]} />
                        {errors.workingDays && <Txt className="text-[10px] text-red-500 font-bold pl-1">{errors.workingDays.message}</Txt>}
                    </Box>
                    <Box className="space-y-1">
                        <Txt className="text-[10px] font-bold text-gray-400">Daily Hours</Txt>
                        <Select {...field('workingHours', {
            required: 'Working hours required',
            onChange: e => {
              setValue('workingHours', e.target.value, {
                shouldValidate: true
              });
              if (clearErrors && e.target.value) clearErrors('workingHours');
            }
          })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium" options={[{ value: '', label: 'Select Hours' }, { value: '9-5', label: '9:00 AM - 5:00 PM' }, { value: '10-7', label: '10:00 AM - 7:00 PM' }, { value: '10-8', label: '10:00 AM - 8:00 PM' }]} />
                        {errors.workingHours && <Txt className="text-[10px] text-red-500 font-bold pl-1">{errors.workingHours.message}</Txt>}
                    </Box>
                </Box>
            </Box>
        </Box>;
};
