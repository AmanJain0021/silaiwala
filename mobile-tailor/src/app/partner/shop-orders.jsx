import Screen from '../../screens/TailorShopOrders';
import { withTailorLayout } from '../../components/tailor/TailorLayout';
import { withTailorGuard } from '../../components/tailor/ProtectedRoute';
import { TAILOR_STATUS } from '../../context/tailor/AuthContext';

export default withTailorGuard(withTailorLayout(Screen), [TAILOR_STATUS.APPROVED]);
