// Native replacement for the web's <GoogleMap onClick> + <Marker> location picker
// (react-native-maps, Google provider). Tap the map to set the pin; same default centre/zoom as the web.
import React, { useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const INDIA = { latitude: 20.5937, longitude: 78.9629 };

export default function LocationPickerMap({ latitude, longitude, onPick, style }) {
  const ref = useRef(null);
  const has = latitude != null && longitude != null && latitude !== '' && longitude !== '';
  const center = has ? { latitude: Number(latitude), longitude: Number(longitude) } : INDIA;
  useEffect(() => {
    ref.current?.animateCamera?.({ center, zoom: has ? 15 : 4 }, { duration: 300 });
  }, [center.latitude, center.longitude, has]);
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={[{ width: '100%', height: '100%' }, style]}
      initialCamera={{ center, zoom: has ? 15 : 4, heading: 0, pitch: 0 }}
      toolbarEnabled={false}
      zoomControlEnabled
      onPress={(e) => onPick?.(e.nativeEvent.coordinate)}
    >
      {has ? <Marker coordinate={center} /> : null}
    </MapView>
  );
}
