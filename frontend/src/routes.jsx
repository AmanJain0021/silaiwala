import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import TailorLayout from './layouts/TailorLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './modules/auth/pages/Login';
import Signup from './modules/auth/pages/Signup';

// Tailor Module Pages
import TailorLogin from './modules/tailor/pages/Login';
import TailorRegistration from './modules/tailor/pages/Registration';
import { UnderReview, RejectedPage } from './modules/tailor/pages/StatusPages';
import TailorProtectedRoute from './modules/tailor/components/ProtectedRoute';
import TailorAuthLayout from './modules/tailor/layouts/TailorAuthLayout';
import { TAILOR_STATUS } from './modules/tailor/context/AuthContext';
import TailorOverview from './modules/tailor/pages/Overview';
import TailorOrders from './modules/tailor/pages/Orders';
import TailorProducts from './modules/tailor/pages/Products';
import DeliveryDetails from './modules/tailor/pages/DeliveryDetails';
import VerificationStatus from './modules/tailor/pages/VerificationStatus';
import SubscriptionSettings from './modules/tailor/pages/Subscription';
import ProfileSettings from './modules/tailor/pages/ProfileSettings';
import TailorWithdraw from './modules/tailor/pages/Withdraw';
import TailorNotifications from './modules/tailor/pages/Notifications';
import WalletPage from './modules/common/pages/WalletPage';
import TailorEarnings from './modules/tailor/pages/TailorEarnings';
import MeasurementList from './modules/tailor/pages/MeasurementList';
import MeasurementDetail from './modules/tailor/pages/MeasurementDetail';
import PartnerLanding from './modules/tailor/pages/PartnerLanding';

// Customer Pages
import CustomerHome from './modules/customer/pages/Home';
import ServicesPage from './modules/customer/pages/Services';
import ServiceDetailPage from './modules/customer/pages/ServiceDetail';
import StorePage from './modules/customer/pages/Store'; // NEW
import StoreProductDetail from './modules/customer/pages/StoreProductDetail'; // NEW
import OrdersPage from './modules/customer/pages/Orders'; // NEW
import ProfilePage from './modules/customer/pages/Profile'; // NEW
import EditProfile from './modules/customer/pages/EditProfile'; // NEW
import CheckoutAddress from './modules/customer/pages/CheckoutAddress'; // NEW
import CheckoutSummary from './modules/customer/pages/CheckoutSummary'; // NEW
import OrderSuccess from './modules/customer/pages/OrderSuccess'; // NEW
import OrderTracking from './modules/customer/pages/OrderTracking'; // NEW
import CartPage from './modules/customer/pages/Cart'; // NEW
import WishlistPage from './modules/customer/pages/Wishlist'; // NEW
import TailorProfile from './modules/customer/pages/TailorProfile'; // NEW
import TailorListing from './modules/customer/pages/TailorListing'; // NEW
import TailorSelection from './modules/customer/pages/TailorSelection'; // NEW
import CustomerProtectedRoute from './modules/customer/components/CustomerProtectedRoute';
import CustomerMainLayout from './modules/customer/layouts/CustomerMainLayout';
import CustomerOnboarding from './modules/customer/pages/Onboarding';
import { NotificationProvider as CustomerNotificationProvider } from './modules/customer/context/NotificationContext';

// Delivery Pages
import DeliveryDashboard from './modules/delivery/pages/Dashboard/DeliveryDashboard';
import DeliveryTasks from './modules/delivery/pages/Tasks/Tasks';
import DeliveryHistory from './modules/delivery/pages/History/DeliveryHistory';
import DeliveryProfile from './modules/delivery/pages/Profile/DeliveryProfile';
import DeliveryLogin from './modules/delivery/pages/Login';
import DeliverySignup from './modules/delivery/pages/Signup';
import DeliveryForgotPassword from './modules/delivery/pages/ForgotPassword';
import DeliveryResetPassword from './modules/delivery/pages/ResetPassword';
import DeliveryLayout from './modules/delivery/layouts/DeliveryLayout';
import DeliveryAuthLayout from './modules/delivery/layouts/DeliveryAuthLayout';
import DeliveryProtectedRoute from './modules/delivery/components/DeliveryProtectedRoute';
import DeliveryWallet from './modules/delivery/pages/Wallet/DeliveryWallet';

// Admin Pages
import AdminDashboard from './modules/admin/pages/Dashboard';
import AdminOrders from './modules/admin/pages/Orders';
import AdminTailors from './modules/admin/pages/Tailors';
import AdminDelivery from './modules/admin/pages/Delivery';
import AdminCustomers from './modules/admin/pages/Customers';
import AdminServices from './modules/admin/pages/Services';
import AdminStore from './modules/admin/pages/Store';
import AdminFinance from './modules/admin/pages/Finance';
import AdminCMS from './modules/admin/pages/CMS';
import AdminReports from './modules/admin/pages/Reports';
import AdminSettings from './modules/admin/pages/Settings';
import AdminLogin from './modules/admin/pages/Login';
import AdminStyleAddons from './modules/admin/pages/StyleAddons';
import AdminBulkOrders from './modules/admin/pages/BulkOrders';
import AdminProtectedRoute from './modules/admin/components/AdminProtectedRoute';

import ReferEarn from './modules/customer/pages/ReferEarn'; // NEW
import FabricDetail from './modules/customer/pages/FabricDetail'; // NEW
import Measurements from './modules/customer/pages/Measurements'; // NEW
import SavedAddresses from './modules/customer/pages/SavedAddresses'; // NEW
import Support from './modules/customer/pages/Support'; // NEW
import CMSContent from './modules/customer/pages/CMSContent'; // NEW
import Embellishments from './modules/customer/pages/Embellishments'; // NEW
import MyReviews from './modules/customer/pages/MyReviews'; // NEW
import BulkOrderRequest from './modules/customer/pages/BulkOrderRequest'; // NEW
import MyBulkOrders from './modules/customer/pages/MyBulkOrders'; // NEW
import EmbroideryPage from './modules/customer/pages/Embroidery'; // NEW

const AppRoutes = () => {
    return (
        <Routes>
            {/* ... Auth Routes ... */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Partner Landing Page */}
            <Route path="/partner/welcome" element={<PartnerLanding />} />

            {/* Partner Public Auth Routes */}
            <Route element={<TailorAuthLayout />}>
                <Route path="/partner/login" element={<TailorLogin />} />
                <Route path="/partner/signup" element={<TailorRegistration />} />
                <Route path="/partner/register" element={<Navigate to="/partner/signup" replace />} />
            </Route>

            {/* Delivery Auth Routes - Using custom design */}
            <Route element={<DeliveryAuthLayout />}>
                <Route path="/delivery/login" element={<DeliveryLogin />} />
                <Route path="/delivery/signup" element={<DeliverySignup />} />
                <Route path="/delivery/forgot-password" element={<DeliveryForgotPassword />} />
                <Route path="/delivery/reset-password" element={<DeliveryResetPassword />} />
            </Route>

            {/* Customer Public Routes */}
            <Route path="/welcome" element={<CustomerOnboarding />} />

            {/* Customer Routes */}
            <Route element={<CustomerProtectedRoute />}>
                <Route element={<CustomerNotificationProvider />}>
                    <Route element={<CustomerMainLayout />}>
                        <Route index element={<CustomerHome />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/services/:id" element={<ServiceDetailPage />} />
                        <Route path="/embellishments" element={<Embellishments />} />

                        {/* New Store & Nav Routes */}
                        <Route path="/store" element={<StorePage />} />
                        <Route path="/store/product/:id" element={<StoreProductDetail />} />
                        <Route path="/fabric/:id" element={<FabricDetail />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/edit" element={<EditProfile />} />
                        <Route path="/profile/measurements" element={<Measurements />} />
                        <Route path="/profile/addresses" element={<SavedAddresses />} />
                        <Route path="/refer" element={<ReferEarn />} />
                        {/* Fixed path from /tailor/:id to /shop/:id to avoid conflict or keep it customer centric */}
                        <Route path="/tailor/:id" element={<TailorProfile />} />
                        <Route path="/tailors" element={<TailorListing />} />

                        {/* Checkout Flow */}
                        <Route path="/checkout/tailor" element={<TailorSelection />} />
                        <Route path="/checkout/address" element={<CheckoutAddress />} />
                        <Route path="/checkout/summary" element={<CheckoutSummary />} />
                        <Route path="/checkout/success" element={<OrderSuccess />} />
                        <Route path="/orders/:id/track" element={<OrderTracking />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/legal/:slug" element={<CMSContent />} />

                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/reviews" element={<MyReviews />} />
                        <Route path="/bulk-order" element={<BulkOrderRequest />} />
                        <Route path="/bulk-orders" element={<MyBulkOrders />} />
                        <Route path="/embroidery" element={<EmbroideryPage />} />
                    </Route>
                </Route>
            </Route>

            {/* Tailor/Partner Public Routes */}
            <Route path="/partner/under-review" element={<UnderReview />} />
            <Route path="/partner/rejected" element={<RejectedPage />} />

            {/* Tailor/Partner Protected Routes */}
            <Route element={<TailorProtectedRoute requiredStatus={[TAILOR_STATUS.APPROVED]} />}>
                <Route element={<TailorLayout />}>
                    <Route path="/partner" element={<TailorOverview />} />
                    <Route path="/partner/orders" element={<TailorOrders />} />
                    <Route path="/partner/portfolio" element={<TailorProducts />} />
                    <Route path="/partner/earnings" element={<TailorEarnings />} />
                    <Route path="/partner/wallet" element={<TailorEarnings />} />
                    <Route path="/partner/products" element={<TailorProducts />} />
                    <Route path="/partner/delivery" element={<DeliveryDetails />} />
                    <Route path="/partner/verification" element={<VerificationStatus />} />
                    <Route path="/partner/subscription" element={<SubscriptionSettings />} />
                    <Route path="/partner/settings" element={<ProfileSettings />} />
                    <Route path="/partner/measurements" element={<MeasurementList />} />
                    <Route path="/partner/measurements/:id" element={<MeasurementDetail />} />
                </Route>
                {/* Full screen tailor views separated from layout nav */}
                <Route path="/partner/withdraw" element={<TailorWithdraw />} />
                <Route path="/partner/notifications" element={<TailorNotifications />} />
            </Route>

            {/* Delivery Routes */}
            <Route element={<DeliveryProtectedRoute />}>
                <Route element={<DeliveryLayout />}>
                    <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                    <Route path="/delivery/tasks" element={<DeliveryTasks />} />
                    <Route path="/delivery/history" element={<DeliveryHistory />} />
                    <Route path="/delivery/wallet" element={<DeliveryWallet />} />
                    <Route path="/delivery/profile" element={<DeliveryProfile />} />
                </Route>
            </Route>

            {/* Admin Module */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminProtectedRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/tailors" element={<AdminTailors />} />
                    <Route path="/admin/delivery" element={<AdminDelivery />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/services" element={<AdminServices />} />
                    <Route path="/admin/store" element={<AdminStore />} />
                    <Route path="/admin/finance" element={<AdminFinance />} />
                    <Route path="/admin/cms" element={<AdminCMS />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/style-addons" element={<AdminStyleAddons />} />
                    <Route path="/admin/bulk-orders" element={<AdminBulkOrders />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
