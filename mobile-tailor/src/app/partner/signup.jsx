import Screen from '../../screens/Registration';
import { withTailorAuthLayout } from '../../components/tailor/TailorAuthLayout';

export default withTailorAuthLayout(Screen, { isSignup: true });
