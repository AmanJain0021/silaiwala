// Runs once after storage hydration. The tailor app keeps its session in the tailor AuthContext
// (read synchronously from the hydrated storage), so there is nothing to rehydrate here yet.
export async function bootstrapStores() {}
