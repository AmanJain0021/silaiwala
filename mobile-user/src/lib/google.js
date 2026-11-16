// Native Google sign-in (replaces @react-oauth/google). The ID token is issued for the same
// web client id the backend verifies (POST /auth/google-login { credential }).
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from './config';

let configured = false;
export const isGoogleAuthAvailable = () => !!GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('placeholder');

export async function getGoogleIdToken() {
  if (!configured) {
    GoogleSignin.configure({ webClientId: GOOGLE_CLIENT_ID, offlineAccess: false });
    configured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try { await GoogleSignin.signOut(); } catch (_) { /* allow account picker */ }
  const res = await GoogleSignin.signIn();
  if (res?.type === 'cancelled') return null;
  const idToken = res?.data?.idToken || res?.idToken;
  if (!idToken) throw new Error('Google Login Failed');
  return idToken;
}

export { statusCodes };
