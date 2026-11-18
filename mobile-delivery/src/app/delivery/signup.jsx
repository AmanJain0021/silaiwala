import Screen from '../../screens/Register';
import { withDeliveryAuthLayout } from '../../components/delivery/DeliveryAuthLayout';

export default withDeliveryAuthLayout(Screen, { isSignup: true });
