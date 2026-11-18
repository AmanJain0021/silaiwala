import Screen from '../../screens/Signup';
import { withExecutiveAuthLayout } from '../../components/executive/MeasurementExecutiveAuthLayout';

export default withExecutiveAuthLayout(Screen, { isSignup: true });
