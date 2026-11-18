// Port of modules/measurement-executive/components/measurement-sheet/ReferenceImages.jsx (converted with scripts/web2rn.js, then reviewed)
import { pickImage } from '../../../lib/files';
import { Alert } from 'react-native';
import React from "react";
import { Camera, X } from "lucide-react-native";
import { Box, Txt, Img, Btn, I, Input, Scroll } from '../../ui/primitives';
const ReferenceImages = ({
  images = [],
  onAddPhotos,
  onRemovePhoto
}) => {
  // web: <input type="file" accept="image/*" multiple>, whose phone picker offers the camera and the gallery
  const addFromCamera = async () => {
    const file = await pickImage({
      camera: true
    });
    if (file) onAddPhotos([file]);
  };
  const addFromGallery = async () => {
    const files = await pickImage({
      multiple: true
    });
    if (files.length > 0) onAddPhotos(files);
  };
  const handleAddPhoto = () => Alert.alert('Add Photo', undefined, [{
    text: 'Cancel',
    style: 'cancel'
  }, {
    text: 'Gallery',
    onPress: addFromGallery
  }, {
    text: 'Camera',
    onPress: addFromCamera
  }]);
  return <Box className="w-full">
            <Txt className="text-xs font-bold text-gray-800 tracking-tight mb-2.5">
                Reference Images <Txt className="text-gray-400 font-normal">(Optional)</Txt>
            </Txt>

            <Scroll contentClassName="flex items-center gap-3 pb-1" className="scrollbar-hide" horizontal>
                {/* Uploaded / Default Images */}
                {images.map((img, idx) => {
        const src = typeof img === 'string' ? img : img.uri;
        return <Box key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm flex-shrink-0 group bg-gray-50">
                            <Img src={src} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" fallback="/assets/images/kameez_ref.jpg" />

                            {/* Circular X / Remove Button */}
                            <Btn onPress={() => onRemovePhoto(idx)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-md">
                                <I icon={X} size={12} strokeWidth={2.5} />
                            </Btn>
                        </Box>;
      })}

                {/* Dashed "+ Add Photo" Card */}
                <Btn onPress={handleAddPhoto} className="w-24 h-24 rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#6C2E9C] bg-white hover:bg-purple-50/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all flex-shrink-0 active:scale-95">
                    <Box className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C2E9C]">
                        <I icon={Camera} size={19} strokeWidth={2} />
                    </Box>
                    <Txt className="text-[10px] font-bold text-[#6C2E9C] tracking-tight">
                        Add Photo
                    </Txt>
                    
                </Btn>
            </Scroll>
        </Box>;
};
export default ReferenceImages;
