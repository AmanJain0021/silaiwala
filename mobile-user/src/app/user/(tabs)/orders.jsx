import withTabRefresh from '../../../components/common/withTabRefresh';
import { withAuth } from '../../../components/common/RequireAuth';
import Screen from '../../../screens/Orders';

export default withTabRefresh(withAuth(Screen));
