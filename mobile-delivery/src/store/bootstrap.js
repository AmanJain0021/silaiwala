// Runs once after storage hydration: re-reads the persisted delivery session into the stores
// (they were created at import time, before storage was available).
import useAuthStore from './authStore';
import { useDeliveryAuthStore } from './deliveryStore';

export async function bootstrapStores() {
  useAuthStore.getState().checkAuth();
  await useDeliveryAuthStore.persist.rehydrate();
}
