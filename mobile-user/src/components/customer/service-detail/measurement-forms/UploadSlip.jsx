// Port of measurement-forms/UploadSlip.jsx — gallery / camera picker, kept as a data URL like the web (FileReader).
import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon, Camera } from 'lucide-react-native';
import { pickImage, fileToDataUrl } from '../../../../lib/files';
import { Box, Txt, Btn, Img, I, Input } from '../../../ui/primitives';

const UploadSlip = ({ onUpload, onCancel }) => {
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (camera) => {
    const file = await pickImage({ base64: true, camera });
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Max 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Only JPG/PNG images allowed');
      return;
    }
    setError('');
    setPreview(fileToDataUrl(file));
  };

  const handleSubmit = () => {
    if (!preview) {
      setError('Please upload an image first');
      return;
    }
    onUpload({ type: 'slip', image: preview, slipImage: preview, notes });
  };

  const tile = (camera) => (
    <Btn onPress={() => handleFile(camera)} className={`flex-1 aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-white ${error ? 'border-rose-300 bg-rose-50' : 'border-gray-200'}`}>
      <Box className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
        <I icon={camera ? Camera : ImageIcon} size={18} color="#843D9B" />
      </Box>
      <Txt className="text-[10px] font-black uppercase tracking-widest text-gray-500">{camera ? 'Camera' : 'Gallery'}</Txt>
    </Btn>
  );

  return (
    <Box className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4">
      {!preview ? (
        <Box className="flex gap-3 mb-4">
          {tile(false)}
          {tile(true)}
        </Box>
      ) : (
        <Box className="relative w-full aspect-[4/3] rounded-xl border-2 border-gray-200 mb-4 overflow-hidden bg-gray-50">
          <Img src={preview} alt="Measurement Slip" className="w-full h-full object-contain" />
          <Btn onPress={() => setPreview(null)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md z-10">
            <I icon={X} size={16} color="#f43f5e" />
          </Btn>
        </Box>
      )}
      {!!error && <Txt className="text-[11px] font-bold text-rose-500 text-center mb-4 uppercase tracking-wider">{error}</Txt>}
      <Box className="mb-6">
        <Txt className="text-xs font-medium text-gray-700 ml-1 mb-1">Additional Notes for Tailor</Txt>
        <Input multiline numberOfLines={3} value={notes} onChangeText={setNotes} placeholder="E.g., Please ignore the crossed out numbers on the slip."
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[72px] placeholder:text-gray-300" />
      </Box>
      <Box className="flex gap-3">
        <Btn onPress={onCancel} className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold">Cancel</Btn>
        <Btn onPress={handleSubmit} disabled={!preview} className={`flex-1 py-2.5 rounded-full text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 ${preview ? 'bg-primary' : 'bg-gray-300'}`}>
          <I icon={FileText} size={14} />
          <Txt>Use This Slip</Txt>
        </Btn>
      </Box>
    </Box>
  );
};

export default UploadSlip;
