// Runs once after storage hydration: re-reads the persisted executive session (the store was created before storage was ready).
import useAuthStore from './authStore';

export async function bootstrapStores() {
  useAuthStore.getState().checkAuth();
}
