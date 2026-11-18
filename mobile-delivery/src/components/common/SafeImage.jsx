// Port of components/Common/SafeImage.jsx
import React, { useState } from 'react';
import { Box, Img } from '../ui/primitives';
import { getImageUrl } from '../../utils/imageUrl';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';

const SafeImage = ({ src, alt, className = '', fallback = DEFAULT_FALLBACK }) => {
  const [loading, setLoading] = useState(true);
  const uri = src ? getImageUrl(src) : fallback;
  return (
    <Box className={`relative overflow-hidden bg-gray-50 ${className}`}>
      <Img src={uri} fallback={fallback} alt={alt} className="w-full h-full object-cover" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
      {loading && <Box className="absolute inset-0 bg-gray-50" pointerEvents="none" />}
    </Box>
  );
};

export default SafeImage;
