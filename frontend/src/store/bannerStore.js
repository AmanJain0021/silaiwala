import { create } from 'zustand';
import api from '../utils/api';
import { resolveBannerImageUrl, BANNER_LOCATIONS, isUploadedBannerImage } from '../utils/bannerImage';

const useBannerStore = create((set, get) => ({
    homeBanners: [],
    storeBanners: [],
    isHomeBannersLoading: false,
    isStoreBannersLoading: false,
    
    fetchHomeBanners: async () => {
        if (get().homeBanners.length > 0 || get().isHomeBannersLoading) return;
        set({ isHomeBannersLoading: true });
        try {
            const res = await api.get('/cms/banners/active', {
                params: { location: BANNER_LOCATIONS.HOME },
            });
            if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const activeBanners = res.data.data
                    .filter((b) => b.image && isUploadedBannerImage(b.image))
                    .map((b) => ({
                        id: b._id,
                        image: resolveBannerImageUrl(b.image),
                    }));
                set({ homeBanners: activeBanners });
            }
        } catch (error) {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                console.error('Failed to fetch home banners:', error);
            }
        } finally {
            set({ isHomeBannersLoading: false });
        }
    },

    fetchStoreBanners: async () => {
        if (get().storeBanners.length > 0 || get().isStoreBannersLoading) return;
        set({ isStoreBannersLoading: true });
        try {
            const response = await api.get('/cms/banners/active', {
                params: { location: BANNER_LOCATIONS.STORE },
            });
            if (response.data.success && Array.isArray(response.data.data)) {
                set({ storeBanners: response.data.data.filter((b) => b.image) });
            }
        } catch (error) {
            console.error('Error fetching store banners:', error);
        } finally {
            set({ isStoreBannersLoading: false });
        }
    }
}));

export default useBannerStore;
