import Screen from '../../../../screens/TailorOrderChat';
import { withTailorGuard } from '../../../../components/tailor/ProtectedRoute';
import { TAILOR_STATUS } from '../../../../context/tailor/AuthContext';

export default withTailorGuard(Screen, [TAILOR_STATUS.APPROVED]);
