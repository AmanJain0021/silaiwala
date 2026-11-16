// Runs once after storage hydration: re-reads persisted state into the stores
// (they were created at import time, before storage was available).
import useAuthStore from './authStore';
import useUserStore from './userStore';
import useCartStore from './cartStore';
import useCheckoutStore from './checkoutStore';
import useLocationStore from './locationStore';

export async function bootstrapStores() {
  useAuthStore.getState().checkAuth();
  useLocationStore.getState().reload();
  await Promise.all([
    useUserStore.persist.rehydrate(),
    useCartStore.persist.rehydrate(),
    useCheckoutStore.persist.rehydrate(),
  ]);
}
