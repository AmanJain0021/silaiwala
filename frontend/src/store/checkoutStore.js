import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Normalize tailor id from service / basket row / extras */
const resolveTailorId = (...sources) => {
    for (const src of sources) {
        if (src == null || src === '') continue;
        if (typeof src === 'string' || typeof src === 'number') {
            const s = String(src).trim();
            if (s) return s;
            continue;
        }
        if (typeof src !== 'object') continue;

        // Explicit fields first
        if (src.tailorId) return String(src.tailorId);

        // Nested tailor on a service / basket row
        if (src.tailor != null) {
            if (typeof src.tailor === 'string' || typeof src.tailor === 'number') {
                return String(src.tailor);
            }
            const nested = src.tailor._id || src.tailor.id;
            if (nested) return String(nested);
        }

        // Tailor document itself (has shopName / isAvailable — not a service)
        const looksLikeTailor = !!(src.shopName || src.isAvailable != null);
        const looksLikeService = !!(src.title || src.basePrice != null || src.category);
        if (looksLikeTailor && !looksLikeService && (src._id || src.id)) {
            return String(src._id || src.id);
        }

        // Bare `{ _id }` / id-only object used as tailor ref
        if ((src._id || src.id) && !looksLikeService && !src.measurements) {
            return String(src._id || src.id);
        }
    }
    return null;
};

const resolveTailorName = (...sources) => {
    for (const src of sources) {
        if (!src) continue;
        if (typeof src === 'string' && src.trim()) return src.trim();
        if (typeof src === 'object') {
            // Privacy: shop name only — never personal user.name
            const name =
                src.tailorName ||
                src.shopName ||
                (typeof src.tailor === 'object' ? src.tailor?.shopName : null) ||
                src.user?.shopName ||
                null;
            if (name && String(name).trim()) return String(name).trim();
        }
    }
    return null;
};

/** Keep basket rows small so localStorage persist does not drop items. */
const leanServiceDetails = (service = {}, extras = {}) => ({
    _id: service._id || service.id || extras._id || null,
    id: service._id || service.id || extras.id || null,
    title: service.title || extras.title || 'Service',
    image: service.image || service.images?.[0] || extras.image || null,
    basePrice: service.basePrice ?? extras.basePrice ?? 0,
    tags: Array.isArray(service.tags) ? service.tags.slice(0, 10) : [],
    category: service.category
        ? {
            _id: service.category._id,
            name: service.category.name,
            measurementFields: service.category.measurementFields || [],
        }
        : extras.category || null,
    tailorId:
        resolveTailorId(extras.tailorId, extras, service.tailorId, service) || null,
    tailorName:
        resolveTailorName(extras.tailorName, extras, service.tailorName, service) || null,
    tailorCoordinates: extras.tailorCoordinates || service.tailorCoordinates || null,
});

const leanFabric = (fabric) => {
    if (!fabric) return null;
    if (typeof fabric === 'string') return fabric;
    return {
        _id: fabric._id || fabric.id || null,
        id: fabric._id || fabric.id || null,
        name: fabric.name || '',
        price: fabric.price || 0,
        image: fabric.image || fabric.images?.[0] || null,
        images: fabric.images ? fabric.images.slice(0, 1) : undefined,
    };
};

const leanStyle = (style) => {
    if (!style) return null;
    return {
        name: style.name || '',
        image: style.image || null,
        description: style.description || '',
        isCustom: !!style.isCustom,
    };
};

const leanAddons = (addons = []) =>
    (Array.isArray(addons) ? addons : []).map((a) => ({
        _id: a._id || a.id,
        id: a._id || a.id,
        name: a.name || a.title || '',
        price: Number(a.price) || 0,
    }));

const leanBasketItem = (item) => {
    if (!item) return item;
    const sd = item.serviceDetails || {};
    return {
        basketId: item.basketId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        serviceDetails: leanServiceDetails(sd, {
            tailorId: sd.tailorId,
            tailorName: sd.tailorName,
            tailorCoordinates: sd.tailorCoordinates,
            category: sd.category,
            image: sd.image,
            title: sd.title,
            basePrice: sd.basePrice,
        }),
        configuration: {
            deliveryType: item.configuration?.deliveryType || 'standard',
            fabricSource: item.configuration?.fabricSource || 'customer',
            selectedFabric: leanFabric(item.configuration?.selectedFabric),
            measurements: item.configuration?.measurements || {},
            isTailorAtHome: !!item.configuration?.isTailorAtHome,
            selectedStyle: leanStyle(item.configuration?.selectedStyle),
            addons: leanAddons(item.configuration?.addons),
            pending: !!item.configuration?.pending,
        },
        pricing: {
            base: Number(item.pricing?.base) || 0,
            delivery: Number(item.pricing?.delivery) || 0,
            fabric: Number(item.pricing?.fabric) || 0,
            addons: Number(item.pricing?.addons) || 0,
            tailorAtHome: Number(item.pricing?.tailorAtHome) || 0,
            platformFee: Number(item.pricing?.platformFee) || 0,
            taxes: Number(item.pricing?.taxes) || 0,
            gstPercentage: Number(item.pricing?.gstPercentage) || 0,
            platformFeePercentage: Number(item.pricing?.platformFeePercentage) || 0,
            total: Number(item.pricing?.total) || 0,
            deliveryDays: item.pricing?.deliveryDays || 15,
        },
    };
};

const useCheckoutStore = create(
    persist(
        (set, get) => ({
            serviceItems: [],
            buyNowItem: null,
            isBuyNowMode: false,
            checkoutType: null,
            appliedCoupon: null,
            /** Once basket starts, all extra garments must use this tailor only */
            lockedTailorId: null,
            lockedTailorName: null,

            serviceDetails: null,
            configuration: null,
            pricing: null,
            addons: [],

            addServiceItem: (item) =>
                set((state) => {
                    const lean = leanBasketItem(item);
                    const tailorId =
                        resolveTailorId(
                            lean.serviceDetails,
                            state.lockedTailorId,
                            state.serviceItems[0]?.serviceDetails
                        ) || null;
                    const tailorName =
                        resolveTailorName(
                            lean.serviceDetails,
                            state.lockedTailorName,
                            state.serviceItems[0]?.serviceDetails
                        ) || null;
                    if (tailorId && lean.serviceDetails) {
                        lean.serviceDetails.tailorId = tailorId;
                        lean.serviceDetails.tailorName = tailorName;
                    }
                    return {
                        serviceItems: [...state.serviceItems, lean],
                        checkoutType: 'service',
                        isBuyNowMode: false,
                        buyNowItem: null,
                        lockedTailorId: state.lockedTailorId || tailorId,
                        lockedTailorName: state.lockedTailorName || tailorName,
                    };
                }),

            setCheckoutType: (type) => set({ checkoutType: type }),

            setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon || null }),

            clearAppliedCoupon: () => set({ appliedCoupon: null }),

            removeServiceItem: (index) =>
                set((state) => {
                    const next = state.serviceItems.filter((_, i) => i !== index);
                    return {
                        serviceItems: next,
                        lockedTailorId: next.length ? state.lockedTailorId : null,
                        lockedTailorName: next.length ? state.lockedTailorName : null,
                    };
                }),

            updateServiceItem: (index, item) =>
                set((state) => ({
                    serviceItems: state.serviceItems.map((row, i) =>
                        i === index ? leanBasketItem({ ...row, ...item, basketId: row.basketId }) : row
                    ),
                })),

            /**
             * Resolve + persist the tailor lock from basket / extras.
             * Call whenever adding first item or opening "add another" catalog.
             */
            ensureLockedTailor: (extras = {}) => {
                const state = get();
                const tid =
                    resolveTailorId(
                        state.lockedTailorId,
                        extras.tailorId,
                        extras,
                        state.serviceItems[0]?.serviceDetails
                    ) || null;
                const tname =
                    resolveTailorName(
                        state.lockedTailorName,
                        extras.tailorName,
                        extras,
                        state.serviceItems[0]?.serviceDetails
                    ) || null;
                if (tid && (String(state.lockedTailorId || '') !== String(tid) || !state.lockedTailorName)) {
                    set({
                        lockedTailorId: tid,
                        lockedTailorName: tname || state.lockedTailorName || null,
                    });
                }
                return {
                    tailorId: tid || state.lockedTailorId || null,
                    tailorName: tname || state.lockedTailorName || null,
                };
            },

            getLockedTailor: () => {
                const state = get();
                const tid =
                    resolveTailorId(
                        state.lockedTailorId,
                        state.serviceItems[0]?.serviceDetails
                    ) || null;
                const tname =
                    resolveTailorName(
                        state.lockedTailorName,
                        state.serviceItems[0]?.serviceDetails
                    ) || null;
                return { tailorId: tid, tailorName: tname };
            },

            /**
             * When user picks another garment from catalog while basket has items,
             * add it to basket immediately (pending) so it shows up right away,
             * then open the process page to complete measurements.
             * Returns { index, item, created }.
             */
            selectServiceIntoBasket: (service, extras = {}) => {
                const sid = String(service?._id || service?.id || '');
                const state = get();
                const lockedId = resolveTailorId(
                    state.lockedTailorId,
                    extras.tailorId,
                    state.serviceItems[0]?.serviceDetails
                );

                const serviceTailorId = resolveTailorId(service, extras.tailorId, extras);

                // Hard lock: another tailor's service cannot join this order
                if (lockedId && serviceTailorId && String(lockedId) !== String(serviceTailorId)) {
                    return { index: -1, item: null, created: false, blocked: true };
                }

                const existingPendingIdx = state.serviceItems.findIndex((row) => {
                    const id = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
                    return id === sid && row.configuration?.pending;
                });

                if (existingPendingIdx >= 0) {
                    return {
                        index: existingPendingIdx,
                        item: state.serviceItems[existingPendingIdx],
                        created: false,
                        blocked: false,
                    };
                }

                const tailorId = lockedId || serviceTailorId || null;
                const tailorName =
                    resolveTailorName(
                        state.lockedTailorName,
                        extras.tailorName,
                        extras,
                        service
                    ) || null;

                const base = Number(service?.basePrice) || 0;
                const draft = leanBasketItem({
                    serviceDetails: leanServiceDetails(service, {
                        tailorId,
                        tailorName,
                    }),
                    configuration: {
                        deliveryType: 'standard',
                        fabricSource: 'customer',
                        selectedFabric: null,
                        measurements: {},
                        isTailorAtHome: false,
                        selectedStyle: null,
                        addons: [],
                        pending: true,
                    },
                    pricing: {
                        base,
                        delivery: 0,
                        fabric: 0,
                        addons: 0,
                        tailorAtHome: 0,
                        platformFee: 0,
                        taxes: 0,
                        total: base,
                        deliveryDays: 15,
                    },
                });

                set((s) => ({
                    serviceItems: [...s.serviceItems, draft],
                    checkoutType: 'service',
                    isBuyNowMode: false,
                    buyNowItem: null,
                    lockedTailorId: s.lockedTailorId || tailorId,
                    lockedTailorName: s.lockedTailorName || tailorName,
                }));

                const next = get().serviceItems;
                return {
                    index: next.length - 1,
                    item: next[next.length - 1],
                    created: true,
                    blocked: false,
                };
            },

            initializeCheckout: (data) =>
                set({
                    serviceDetails: data.service
                        ? leanServiceDetails(data.service, {
                              tailorId: data.tailorId || null,
                              tailorName: data.tailorName || null,
                          })
                        : null,
                    configuration: data.config || null,
                    pricing: data.pricing || null,
                    addons: leanAddons(data.addons || []),
                }),

            setTailor: (id, name) =>
                set((state) => {
                    if (state.isBuyNowMode && state.buyNowItem) {
                        return {
                            buyNowItem: leanBasketItem({
                                ...state.buyNowItem,
                                serviceDetails: {
                                    ...state.buyNowItem.serviceDetails,
                                    tailorId: id,
                                    tailorName: name,
                                },
                            }),
                        };
                    }

                    return {
                        serviceDetails: state.serviceDetails
                            ? { ...state.serviceDetails, tailorId: id, tailorName: name }
                            : { tailorId: id, tailorName: name },
                        serviceItems: state.serviceItems.map((item) => ({
                            ...item,
                            serviceDetails: {
                                ...item.serviceDetails,
                                tailorId: id,
                                tailorName: name,
                            },
                        })),
                    };
                }),

            setBuyNowMode: (isBuyNowMode, buyNowItem = null) =>
                set((state) => ({
                    isBuyNowMode,
                    buyNowItem: buyNowItem ? leanBasketItem(buyNowItem) : null,
                    checkoutType: isBuyNowMode ? 'service' : state.checkoutType,
                })),

            clearCheckout: () =>
                set({
                    serviceItems: [],
                    buyNowItem: null,
                    isBuyNowMode: false,
                    serviceDetails: null,
                    configuration: null,
                    pricing: null,
                    addons: [],
                    checkoutType: null,
                    lockedTailorId: null,
                    lockedTailorName: null,
                    appliedCoupon: null,
                }),

            clearDrafting: () =>
                set({
                    serviceDetails: null,
                    configuration: null,
                    pricing: null,
                    addons: [],
                }),
        }),
        {
            name: 'checkout-session-storage',
            partialize: (state) => ({
                serviceItems: state.serviceItems,
                buyNowItem: state.buyNowItem,
                isBuyNowMode: state.isBuyNowMode,
                serviceDetails: state.serviceDetails,
                configuration: state.configuration,
                pricing: state.pricing,
                addons: state.addons,
                checkoutType: state.checkoutType,
                lockedTailorId: state.lockedTailorId,
                lockedTailorName: state.lockedTailorName,
                appliedCoupon: state.appliedCoupon,
            }),
            merge: (persisted, current) => {
                const serviceItems = Array.isArray(persisted?.serviceItems)
                    ? persisted.serviceItems.map((row) => leanBasketItem(row))
                    : [];
                const lockedTailorId =
                    resolveTailorId(
                        persisted?.lockedTailorId,
                        serviceItems[0]?.serviceDetails
                    ) || null;
                const lockedTailorName =
                    resolveTailorName(
                        persisted?.lockedTailorName,
                        serviceItems[0]?.serviceDetails
                    ) || null;
                return {
                    ...current,
                    ...(persisted || {}),
                    serviceItems,
                    lockedTailorId,
                    lockedTailorName,
                };
            },
        }
    )
);

export default useCheckoutStore;
export { leanBasketItem, leanServiceDetails, resolveTailorId, resolveTailorName };
