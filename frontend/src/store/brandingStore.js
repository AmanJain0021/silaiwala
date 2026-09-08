import { create } from 'zustand';
import api from '../utils/api';
import deliveryLogoDefault from '../assets/deliveryLogo.png';

export const BRANDING_DEFAULTS = {
    appName: 'SewZella',
    supportEmail: 'support@silaiwala.com',
    supportPhone: '+91 1800 123 4567',
    emergencyPhone: '+91 9999999999',
    logos: {
        customer: '/sewzella_logo.jpeg',
        tailor: '/sewzella_logo-removebg-preview.png',
        delivery: deliveryLogoDefault,
        measurementExecutive: '/sewzella_logo-removebg-preview.png',
    },
};

const useBrandingStore = create((set, get) => ({
    appName: BRANDING_DEFAULTS.appName,
    supportEmail: BRANDING_DEFAULTS.supportEmail,
    supportPhone: BRANDING_DEFAULTS.supportPhone,
    emergencyPhone: BRANDING_DEFAULTS.emergencyPhone,
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
                    supportEmail: general.supportEmail || BRANDING_DEFAULTS.supportEmail,
                    supportPhone: general.supportPhone || BRANDING_DEFAULTS.supportPhone,
                    emergencyPhone: general.emergencyPhone || BRANDING_DEFAULTS.emergencyPhone,
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
