// Port of modules/customer/components/LocationModal.jsx (Google map + places search + GPS)
import Spin from '../../components/ui/Spin';
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Search, X, ChevronLeft, Map as MapIcon, Home, Briefcase, Plus } from 'lucide-react-native';
import toast from '../../lib/toast';
import useLocationStore from '../../store/locationStore';
import { reverseGeocode } from '../../utils/reverseGeocode';
import { getCurrentPosition } from '../../lib/location';
import { Sheet } from '../ui/Sheet';
import { Box, Txt, Btn, Input, I, Scroll } from '../ui/primitives';
import PlacesSearch, { componentsToParts } from '../shared/PlacesSearch';

const DEFAULT_COORDS = { lat: 34.0837, lng: 74.7973 };
const delta = { latitudeDelta: 0.005, longitudeDelta: 0.005 };

const Spinner = () => {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.timing(r, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [r]);
  return <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 4, borderColor: '#843D9B', borderTopColor: 'transparent', transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }} />;
};

const LocationModal = ({ isOpen, onClose }) => {
  const setStoreLocation = useLocationStore((s) => s.setLocation);
  const storeAddress = useLocationStore((s) => s.address);
  const storeCoordinates = useLocationStore((s) => s.coordinates);

  const [view, setView] = useState('list');
  const initialCoords = storeCoordinates?.lat && storeCoordinates?.lng ? storeCoordinates : DEFAULT_COORDS;
  const [mapCenter, setMapCenter] = useState(initialCoords);
  const [markerPosition, setMarkerPosition] = useState(initialCoords);
  const [formattedAddress, setFormattedAddress] = useState(storeAddress || '');
  const [addressDetails, setAddressDetails] = useState({ flat: '', area: '', city: '', state: '', pincode: '', type: 'home' });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [search, setSearch] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setView('list');
      const coords = storeCoordinates?.lat && storeCoordinates?.lng ? storeCoordinates : DEFAULT_COORDS;
      setMapCenter(coords);
      setMarkerPosition(coords);
      if (storeAddress) {
        setFormattedAddress(storeAddress);
        setAddressDetails((prev) => ({ ...prev, area: storeAddress.split(',')[0] || '' }));
      }
    }
  }, [isOpen, storeCoordinates, storeAddress]);

  const handleClose = () => {
    onClose();
    setTimeout(() => setView('list'), 300);
  };

  const getAddressFromCoords = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result && (result.formattedAddress || result.area)) {
        setFormattedAddress(result.formattedAddress);
        setAddressDetails((prev) => ({
          ...prev,
          area: result.area || result.formattedAddress.split(',')[0],
          city: result.city || prev.city,
          state: result.state || prev.state,
          pincode: result.pincode || prev.pincode,
        }));
      }
    } catch (_) {
      toast.error('Could not fetch address details');
    } finally {
      setIsGeocoding(false);
    }
  };

  const moveTo = (pos) => {
    setMapCenter(pos);
    setMarkerPosition(pos);
    mapRef.current?.animateToRegion({ latitude: pos.lat, longitude: pos.lng, ...delta }, 400);
  };

  const triggerActualLocationFlow = async () => {
    setView('pre-location');
    try {
      const position = await getCurrentPosition({ timeout: 10000 });
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
      setMapCenter(newPos);
      setMarkerPosition(newPos);
      getAddressFromCoords(newPos.lat, newPos.lng);
      setView('map');
    } catch (error) {
      if (error?.code === 'denied' || error?.code === 'unavailable') setView('permission-denied');
      else {
        toast.error('Request timeout');
        setView('list');
      }
    }
  };

  const onMapPick = (coord) => {
    const pos = { lat: coord.latitude, lng: coord.longitude };
    setMapCenter(pos);
    setMarkerPosition(pos);
    getAddressFromCoords(pos.lat, pos.lng);
  };

  const openMapView = () => {
    setView('map');
    if (!formattedAddress || addressDetails.area === '') getAddressFromCoords(mapCenter.lat, mapCenter.lng);
  };

  const onPlace = (place) => {
    const newPos = { lat: place.lat, lng: place.lng };
    moveTo(newPos);
    if (place.formatted_address) {
      setFormattedAddress(place.formatted_address);
      const { city, state, pincode, locality } = componentsToParts(place.address_components);
      setAddressDetails((prev) => ({ ...prev, area: locality || place.name || place.formatted_address.split(',')[0], city, state, pincode }));
    } else {
      getAddressFromCoords(newPos.lat, newPos.lng);
    }
  };

  const handleConfirmLocation = () => {
    if (!formattedAddress && !addressDetails.area) {
      toast.error('Please select a valid location');
      return;
    }
    setView('form');
  };

  const handleSaveAddress = () => {
    if (!addressDetails.flat || !addressDetails.area) {
      toast.error('Please fill all required fields');
      return;
    }
    const finalAddress = `${addressDetails.flat}, ${formattedAddress || addressDetails.area}`;
    setStoreLocation(finalAddress, markerPosition.lat, markerPosition.lng);
    toast.success('Address saved successfully!');
    handleClose();
  };

  const typeBtn = (type, label, icon) => (
    <Btn
      key={type}
      onPress={() => setAddressDetails({ ...addressDetails, type })}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black tracking-wider ${addressDetails.type === type ? 'bg-indigo-50 border-[#843D9B] text-[#843D9B]' : 'bg-white border-gray-200 text-gray-500'}`}
    >
      <I icon={icon} size={14} />
      <Txt>{label}</Txt>
    </Btn>
  );

  return (
    <Sheet visible={!!isOpen} onClose={handleClose} className="w-full bg-white rounded-t-[2rem] shadow-2xl" style={{ height: '90%', maxHeight: 750 }}>
      <Box className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Box className="flex items-center justify-between p-4 border-b border-gray-100 z-10 bg-white shadow-sm">
          <Box className="flex items-center gap-3">
            {view !== 'list' && (
              <Btn onPress={() => setView(view === 'form' ? 'map' : 'list')} className="p-2 rounded-full">
                <I icon={ChevronLeft} size={20} />
              </Btn>
            )}
            <Txt className="text-lg font-black tracking-tight text-gray-900">
              {view === 'list' ? 'Select Location' : view === 'map' ? 'Confirm Location' : view === 'form' ? 'Enter Details' : 'Enable Location'}
            </Txt>
          </Box>
          <Btn onPress={handleClose} className="p-2 rounded-full">
            <I icon={X} size={20} color="#9ca3af" />
          </Btn>
        </Box>

        <Box className="flex-1 relative bg-gray-50/50">
          {view === 'list' && (
            <Scroll contentClassName="p-4 space-y-6">
              <Box className="space-y-3">
                <Btn onPress={triggerActualLocationFlow} className="w-full flex items-center gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-left">
                  <Box className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <I icon={Navigation} size={18} color="#843D9B" fill="rgba(132,61,155,0.1)" />
                  </Box>
                  <Box>
                    <Txt className="text-sm font-black text-[#843D9B]">Use Current Location</Txt>
                    <Txt className="text-xs text-indigo-900/60 font-medium">Using GPS</Txt>
                  </Box>
                </Btn>
                <Btn onPress={openMapView} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl text-left shadow-sm">
                  <Box className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100">
                    <I icon={MapIcon} size={18} color="#4b5563" />
                  </Box>
                  <Box>
                    <Txt className="text-sm font-black text-gray-900">Add New Address</Txt>
                    <Txt className="text-xs text-gray-500 font-medium">Search on map</Txt>
                  </Box>
                  <Box className="ml-auto p-1.5 bg-gray-100 rounded-full">
                    <I icon={Plus} size={16} color="#6b7280" />
                  </Box>
                </Btn>
              </Box>
              <Box className="pt-4 border-t border-gray-200">
                <Txt className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Saved Addresses</Txt>
                <Box className="space-y-3">
                  <Btn className="w-full flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl text-left shadow-sm">
                    <Box className="mt-0.5">
                      <I icon={Home} size={18} color="#9ca3af" />
                    </Box>
                    <Box className="flex-1 pr-4">
                      <Box className="flex items-center gap-2">
                        <Txt className="text-sm font-bold text-gray-900">Home</Txt>
                        {storeAddress === 'Srinagar, Kashmir - 190001' && (
                          <Txt className="bg-[#843D9B]/10 text-[#843D9B] text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Active</Txt>
                        )}
                      </Box>
                      <Txt className="text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">{storeAddress || 'Srinagar, Kashmir - 190001'}</Txt>
                    </Box>
                  </Btn>
                </Box>
              </Box>
            </Scroll>
          )}

          {view === 'pre-location' && (
            <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Box className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6 relative">
                <Spinner />
                <I icon={MapPin} size={32} color="#843D9B" />
              </Box>
              <Txt className="text-xl font-black text-gray-900 mb-2">Locating you...</Txt>
              <Txt className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Please allow location permissions when prompted to find your exact address.</Txt>
            </Box>
          )}

          {view === 'permission-denied' && (
            <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Box className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100">
                <I icon={MapPin} size={32} color="#ef4444" />
              </Box>
              <Txt className="text-xl font-black text-gray-900 mb-2">Location Access Denied</Txt>
              <Txt className="text-sm text-gray-500 font-medium mb-8 max-w-xs mx-auto">Please enable GPS on your device and allow location access in your settings to find tailors near you.</Txt>
              <Box className="w-full space-y-3">
                <Btn onPress={triggerActualLocationFlow} className="w-full py-3.5 bg-[#843D9B] text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(132,61,155,0.2)] uppercase tracking-widest">I've Enabled It, Try Again</Btn>
                <Btn onPress={() => setView('list')} className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-xl uppercase tracking-widest">Search Manually</Btn>
              </Box>
            </Box>
          )}

          {view === 'map' && (
            <Box className="flex-1 flex flex-col relative bg-gray-100">
              <Box className="flex-1 w-full relative bg-gray-200">
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={{ latitude: mapCenter.lat, longitude: mapCenter.lng, ...delta }}
                  onPress={(e) => onMapPick(e.nativeEvent.coordinate)}
                  toolbarEnabled={false}
                  zoomControlEnabled
                >
                  <Marker coordinate={{ latitude: markerPosition.lat, longitude: markerPosition.lng }} draggable onDragEnd={(e) => onMapPick(e.nativeEvent.coordinate)} />
                </MapView>
                <Box className="absolute top-4 left-4 right-4 z-10">
                  <PlacesSearch
                    value={search}
                    onChangeText={setSearch}
                    onPlace={onPlace}
                    placeholder="Search for area, street name..."
                    containerClassName="shadow-lg rounded-2xl"
                    left={<Box className="absolute left-4 z-10"><I icon={Search} size={18} color="#9ca3af" /></Box>}
                    inputClassName="flex-1 pl-11 pr-4 py-3.5 bg-white rounded-2xl text-sm font-bold text-gray-900"
                  />
                </Box>
              </Box>
              <Box className="bg-white p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative z-20">
                <Box className="flex items-start gap-4 mb-5">
                  <Box className="mt-1 p-2 bg-indigo-50 rounded-full">
                    <I icon={MapPin} size={20} color="#843D9B" fill="rgba(132,61,155,0.2)" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Txt className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Selected Location</Txt>
                    {isGeocoding ? <Box className="h-5 bg-gray-100 rounded w-3/4 mb-1" /> : <Txt className="text-sm font-bold text-gray-900 truncate">{addressDetails.area || 'Unknown Area'}</Txt>}
                    {isGeocoding ? <Box className="h-4 bg-gray-50 rounded w-full mt-1" /> : <Txt className="text-xs text-gray-500 font-medium truncate mt-0.5">{formattedAddress || 'Move pin to find address'}</Txt>}
                  </Box>
                </Box>
                <Btn
                  onPress={handleConfirmLocation}
                  disabled={(!formattedAddress && !addressDetails.area) || isGeocoding}
                  className="w-full py-3.5 bg-[#843D9B] text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-900/20 uppercase tracking-widest disabled:opacity-50"
                >
                  Confirm Location
                </Btn>
              </Box>
            </Box>
          )}

          {view === 'form' && (
            <>
              <Scroll contentClassName="p-4 pb-24 space-y-6">
                <Box className="h-24 rounded-2xl overflow-hidden relative border border-gray-200">
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    region={{ latitude: markerPosition.lat, longitude: markerPosition.lng, ...delta }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    toolbarEnabled={false}
                    liteMode
                  >
                    <Marker coordinate={{ latitude: markerPosition.lat, longitude: markerPosition.lng }} />
                  </MapView>
                  <Box className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent flex items-end p-3" pointerEvents="none">
                    <Txt className="text-xs font-bold text-gray-900 truncate pr-8">{formattedAddress}</Txt>
                  </Box>
                  <Btn onPress={() => setView('map')} className="absolute top-2 right-2 px-3 py-1 bg-white text-[9px] font-black text-[#843D9B] uppercase tracking-widest rounded-lg shadow-sm border border-gray-100">Change</Btn>
                </Box>
                <Box className="space-y-4">
                  <Box>
                    <Txt className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">House / Flat / Block No. *</Txt>
                    <Input value={addressDetails.flat} onChangeText={(t) => setAddressDetails({ ...addressDetails, flat: t })} placeholder="e.g. Flat 402, Block A" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 shadow-sm" />
                  </Box>
                  <Box>
                    <Txt className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Apartment / Road / Area</Txt>
                    <Input value={addressDetails.area} onChangeText={(t) => setAddressDetails({ ...addressDetails, area: t })} placeholder="e.g. Film Colony Rd" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 shadow-sm" />
                  </Box>
                  <Box className="pt-2">
                    <Txt className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2.5">Save As</Txt>
                    <Box className="flex gap-3">
                      {typeBtn('home', 'Home', Home)}
                      {typeBtn('work', 'Work', Briefcase)}
                      {typeBtn('other', 'Other', MapPin)}
                    </Box>
                  </Box>
                </Box>
              </Scroll>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <Box className="p-4 bg-white border-t border-gray-100 z-20">
                  <Btn onPress={handleSaveAddress} className="w-full py-3.5 bg-[#843D9B] text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-900/20 uppercase tracking-widest">Save Address & Proceed</Btn>
                </Box>
              </View>
            </>
          )}
        </Box>
      </Box>
    </Sheet>
  );
};

export default LocationModal;
