import storage from '../lib/storage';
import { create } from 'zustand';

const safeGetLocation = () => {
    try {
        return storage.getItem('user-location') || 'Srinagar, Kashmir - 190001';
    } catch (e) {
        return 'Srinagar, Kashmir - 190001';
    }
};

const safeGetCoordinates = () => {
    try {
        const item = storage.getItem('user-coordinates');
        return item ? JSON.parse(item) : { lat: 34.0837, lng: 74.7973 };
    } catch (e) {
        return { lat: 34.0837, lng: 74.7973 };
    }
};

const useLocationStore = create((set) => ({
    reload: () => set({ address: safeGetLocation(), coordinates: safeGetCoordinates() }),
    address: safeGetLocation(),
    coordinates: safeGetCoordinates(), // Default Srinagar
    
    setLocation: (address, lat, lng) => {
        const coords = { lat, lng };
        try {
            storage.setItem('user-location', address);
            storage.setItem('user-coordinates', JSON.stringify(coords));
        } catch (e) {}
        set({ address, coordinates: coords });
    }
}));

export default useLocationStore;
