// Launch route: logged-in customers land on /user, others on the onboarding (/welcome).
import { Redirect } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/user' : '/welcome'} />;
}
