import Screen from '../../screens/Notifications';
import { withTailorGuard } from '../../components/tailor/ProtectedRoute';
import { TAILOR_STATUS } from '../../context/tailor/AuthContext';

export default withTailorGuard(Screen, [TAILOR_STATUS.APPROVED]);
