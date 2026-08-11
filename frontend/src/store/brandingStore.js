import { create } from 'zustand';
import api from '../utils/api';
import deliveryLogoDefault from '../assets/deliveryLogo.png';

export const BRANDING_DEFAULTS = {
    appName: 'SewZella',
    logos: {
        customer: '/sewzella_logo.jpeg',
        tailor: '/sewzella_logo-removebg-preview.png',
        delivery: deliveryLogoDefault,
        measurementExecutive: '/sewzella_logo-removebg-preview.png',
    },
};

const useBrandingStore = create((set, get) => ({
    appName: BRANDING_DEFAULTS.appName,
    logos: { ...BRANDING_DEFAULTS.logos },
    isLoaded: false,

    fetchBranding: async () => {
        if (get().isLoaded) return;

        try {
            const res = await api.get('/cms/settings');
            const general = res.data?.data?.general;

            if (general) {
                const appName = general.platformName || BRANDING_DEFAULTS.appName;

                set({
                    appName,
                    logos: {
                        customer: general.appLogos?.customer || BRANDING_DEFAULTS.logos.customer,
                        tailor: general.appLogos?.tailor || BRANDING_DEFAULTS.logos.tailor,
                        delivery: general.appLogos?.delivery || BRANDING_DEFAULTS.logos.delivery,
                        measurementExecutive: general.appLogos?.measurementExecutive || BRANDING_DEFAULTS.logos.measurementExecutive,
                    },
                    isLoaded: true,
                });

                if (typeof document !== 'undefined') {
                    document.title = appName;
                }
                return;
            }
        } catch (e) {
            console.error('Failed to fetch branding settings', e);
        }

        set({ isLoaded: true });
    },
}));

export default useBrandingStore;
