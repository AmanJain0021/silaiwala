import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCheckoutStore = create(
    persist(
        (set, get) => ({
            // Session Data
            serviceItems: [],    // Array of { serviceDetails, configuration, pricing, addons, basketId }
            buyNowItem: null,    // Single item for 'Book Now' flow
            isBuyNowMode: false, // Flag to determine checkout flow mode
            checkoutType: null,  // 'service' or 'cart' to distinguish checkout flows
            
            // Drafting State
            serviceDetails: null, // Current drafting { id, title, image, basePrice, tailorId, tailorName }
            configuration: null,  // Current drafting { deliveryType, fabricSource, measurements, instructions }
            pricing: null,        // Current drafting { base, delivery, taxes, total, deliveryDays }
            addons: [],           // Current drafting Array of addon objects

            // Actions
            addServiceItem: (item) => set((state) => ({
                serviceItems: [...state.serviceItems, item],
                checkoutType: 'service'
            })),

            setCheckoutType: (type) => set({ checkoutType: type }),

            removeServiceItem: (index) => set((state) => ({
                serviceItems: state.serviceItems.filter((_, i) => i !== index)
            })),

            initializeCheckout: (data) => set({
                serviceDetails: data.service ? {
                    ...data.service,
                    tailorId: data.tailorId || null,
                    tailorName: data.tailorName || null
                } : null,
                configuration: data.config || null,
                pricing: data.pricing || null,
                addons: data.addons || []
            }),

            setTailor: (id, name) => set((state) => {
                if (state.isBuyNowMode && state.buyNowItem) {
                    return {
                        buyNowItem: {
                            ...state.buyNowItem,
                            serviceDetails: {
                                ...state.buyNowItem.serviceDetails,
                                tailorId: id,
                                tailorName: name
                            }
                        }
                    };
                }

                // Keep draft + every basket item in sync so the selected tailor
                // is what CheckoutSummary actually posts to /orders.
                return {
                    serviceDetails: state.serviceDetails
                        ? { ...state.serviceDetails, tailorId: id, tailorName: name }
                        : { tailorId: id, tailorName: name },
                    serviceItems: state.serviceItems.map((item) => ({
                        ...item,
                        serviceDetails: {
                            ...item.serviceDetails,
                            tailorId: id,
                            tailorName: name
                        }
                    }))
                };
            }),

            setBuyNowMode: (isBuyNowMode, buyNowItem = null) => set((state) => ({
                isBuyNowMode,
                buyNowItem,
                checkoutType: isBuyNowMode ? 'service' : state.checkoutType
            })),

            clearCheckout: () => set({
                serviceItems: [],
                buyNowItem: null,
                isBuyNowMode: false,
                serviceDetails: null,
                configuration: null,
                pricing: null,
                addons: [],
                checkoutType: null
            }),
            
            clearDrafting: () => set({
                serviceDetails: null,
                configuration: null,
                pricing: null,
                addons: []
            })
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
                checkoutType: state.checkoutType
            }),
        }
    )
);

export default useCheckoutStore;
