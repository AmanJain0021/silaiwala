import { create } from 'zustand';

const safeGetLocation = () => {
    try {
        return localStorage.getItem('user-location') || 'Srinagar, Kashmir - 190001';
    } catch (e) {
        return 'Srinagar, Kashmir - 190001';
    }
};

const safeGetCoordinates = () => {
    try {
        const item = localStorage.getItem('user-coordinates');
        return item ? JSON.parse(item) : { lat: 34.0837, lng: 74.7973 };
    } catch (e) {
        return { lat: 34.0837, lng: 74.7973 };
    }
};

const useLocationStore = create((set) => ({
    address: safeGetLocation(),
    coordinates: safeGetCoordinates(), // Default Srinagar
    
    setLocation: (address, lat, lng) => {
        const coords = { lat, lng };
        try {
            localStorage.setItem('user-location', address);
            localStorage.setItem('user-coordinates', JSON.stringify(coords));
        } catch (e) {}
        set({ address, coordinates: coords });
    }
}));

export default useLocationStore;
