import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AuthProvider as TailorAuthProvider } from './modules/tailor/context/AuthContext';
import { NotificationProvider as TailorNotificationProvider } from './modules/tailor/context/NotificationContext';

const TailorContextWrapper = () => (
    <TailorAuthProvider>
        <TailorNotificationProvider>
            <Outlet />
        </TailorNotificationProvider>
    </TailorAuthProvider>
);

// Layouts
import AuthLayout from './layouts/AuthLayout';
import TailorLayout from './layouts/TailorLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
const Login = React.lazy(() => import('./modules/auth/pages/Login'));
const Signup = React.lazy(() => import('./modules/auth/pages/Signup'));

// Tailor Module Pages
const TailorLogin = React.lazy(() => import('./modules/tailor/pages/Login'));
const TailorRegistration = React.lazy(() => import('./modules/tailor/pages/Registration'));
import { UnderReview, RejectedPage } from './modules/tailor/pages/StatusPages';
import TailorProtectedRoute from './modules/tailor/components/ProtectedRoute';
import TailorAuthLayout from './modules/tailor/layouts/TailorAuthLayout';
import { TAILOR_STATUS } from './modules/tailor/context/AuthContext';
const TailorOverview = React.lazy(() => import('./modules/tailor/pages/Overview'));
const TailorOrders = React.lazy(() => import('./modules/tailor/pages/Orders'));
const TailorProducts = React.lazy(() => import('./modules/tailor/pages/Products'));
const DeliveryDetails = React.lazy(() => import('./modules/tailor/pages/DeliveryDetails'));
const VerificationStatus = React.lazy(() => import('./modules/tailor/pages/VerificationStatus'));
const SubscriptionSettings = React.lazy(() => import('./modules/tailor/pages/Subscription'));
const ProfileSettings = React.lazy(() => import('./modules/tailor/pages/ProfileSettings'));
const TailorWithdraw = React.lazy(() => import('./modules/tailor/pages/Withdraw'));
const TailorNotifications = React.lazy(() => import('./modules/tailor/pages/Notifications'));
const WalletPage = React.lazy(() => import('./modules/common/pages/WalletPage'));
const TailorEarnings = React.lazy(() => import('./modules/tailor/pages/TailorEarnings'));
const MeasurementList = React.lazy(() => import('./modules/tailor/pages/MeasurementList'));
const MeasurementDetail = React.lazy(() => import('./modules/tailor/pages/MeasurementDetail'));
const PartnerLanding = React.lazy(() => import('./modules/tailor/pages/PartnerLanding'));

// Customer Pages
const CustomerHome = React.lazy(() => import('./modules/customer/pages/Home'));
const ServicesPage = React.lazy(() => import('./modules/customer/pages/Services'));
const ServiceDetailPage = React.lazy(() => import('./modules/customer/pages/ServiceDetail'));
const StorePage = React.lazy(() => import('./modules/customer/pages/Store')); // NEW
const StoreProductDetail = React.lazy(() => import('./modules/customer/pages/StoreProductDetail')); // NEW
const OrdersPage = React.lazy(() => import('./modules/customer/pages/Orders')); // NEW
const ProfilePage = React.lazy(() => import('./modules/customer/pages/Profile')); // NEW
const EditProfile = React.lazy(() => import('./modules/customer/pages/EditProfile')); // NEW
const CheckoutAddress = React.lazy(() => import('./modules/customer/pages/CheckoutAddress')); // NEW
const CheckoutSummary = React.lazy(() => import('./modules/customer/pages/CheckoutSummary')); // NEW
const OrderSuccess = React.lazy(() => import('./modules/customer/pages/OrderSuccess')); // NEW
const OrderTracking = React.lazy(() => import('./modules/customer/pages/OrderTracking')); // NEW
const CartPage = React.lazy(() => import('./modules/customer/pages/Cart')); // NEW
const WishlistPage = React.lazy(() => import('./modules/customer/pages/Wishlist')); // NEW
const TailorProfile = React.lazy(() => import('./modules/customer/pages/TailorProfile')); // NEW
const TailorListing = React.lazy(() => import('./modules/customer/pages/TailorListing')); // NEW
const TailorSelection = React.lazy(() => import('./modules/customer/pages/TailorSelection')); // NEW
import CustomerProtectedRoute from './modules/customer/components/CustomerProtectedRoute';
import CustomerMainLayout from './modules/customer/layouts/CustomerMainLayout';
const CustomerOnboarding = React.lazy(() => import('./modules/customer/pages/Onboarding'));
import { NotificationProvider as CustomerNotificationProvider } from './modules/customer/context/NotificationContext';

// Delivery Pages
const DeliveryDashboard = React.lazy(() => import('./modules/delivery/pages/Dashboard/DeliveryDashboard'));
const DeliveryTasks = React.lazy(() => import('./modules/delivery/pages/Tasks/Tasks'));
const DeliveryHistory = React.lazy(() => import('./modules/delivery/pages/History/DeliveryHistory'));
const DeliveryProfile = React.lazy(() => import('./modules/delivery/pages/Profile/DeliveryProfile'));
const DeliveryLogin = React.lazy(() => import('./modules/delivery/pages/Login'));
const DeliverySignup = React.lazy(() => import('./modules/delivery/pages/Signup'));
const DeliveryForgotPassword = React.lazy(() => import('./modules/delivery/pages/ForgotPassword'));
const DeliveryResetPassword = React.lazy(() => import('./modules/delivery/pages/ResetPassword'));
import DeliveryLayout from './modules/delivery/layouts/DeliveryLayout';
import DeliveryAuthLayout from './modules/delivery/layouts/DeliveryAuthLayout';
import DeliveryProtectedRoute from './modules/delivery/components/DeliveryProtectedRoute';
const DeliveryWallet = React.lazy(() => import('./modules/delivery/pages/Wallet/DeliveryWallet'));
const DeliveryOrderDetail = React.lazy(() => import('./modules/delivery/pages/OrderDetail')); // NEW
const LiveTracking = React.lazy(() => import('./modules/delivery/pages/LiveTracking')); // NEW
// Admin Pages
const AdminDashboard = React.lazy(() => import('./modules/admin/pages/Dashboard'));
const AdminOrders = React.lazy(() => import('./modules/admin/pages/Orders'));
const AdminTailors = React.lazy(() => import('./modules/admin/pages/Tailors'));
const AdminDelivery = React.lazy(() => import('./modules/admin/pages/Delivery'));
const AdminCustomers = React.lazy(() => import('./modules/admin/pages/Customers'));
const AdminServices = React.lazy(() => import('./modules/admin/pages/Services'));
const AdminStore = React.lazy(() => import('./modules/admin/pages/Store'));
const AdminFinance = React.lazy(() => import('./modules/admin/pages/Finance'));
const AdminCMS = React.lazy(() => import('./modules/admin/pages/CMS'));
const AdminReports = React.lazy(() => import('./modules/admin/pages/Reports'));
const AdminSettings = React.lazy(() => import('./modules/admin/pages/Settings'));
const AdminLogin = React.lazy(() => import('./modules/admin/pages/Login'));
const AdminStyleAddons = React.lazy(() => import('./modules/admin/pages/StyleAddons'));
const AdminBulkOrders = React.lazy(() => import('./modules/admin/pages/BulkOrders'));
import AdminProtectedRoute from './modules/admin/components/AdminProtectedRoute';

const ReferEarn = React.lazy(() => import('./modules/customer/pages/ReferEarn')); // NEW
const FabricDetail = React.lazy(() => import('./modules/customer/pages/FabricDetail')); // NEW
const Measurements = React.lazy(() => import('./modules/customer/pages/Measurements')); // NEW
const SavedAddresses = React.lazy(() => import('./modules/customer/pages/SavedAddresses')); // NEW
const Support = React.lazy(() => import('./modules/customer/pages/Support')); // NEW
const CMSContent = React.lazy(() => import('./modules/customer/pages/CMSContent')); // NEW
const Embellishments = React.lazy(() => import('./modules/customer/pages/Embellishments')); // NEW
const MyReviews = React.lazy(() => import('./modules/customer/pages/MyReviews')); // NEW
const BulkOrderRequest = React.lazy(() => import('./modules/customer/pages/BulkOrderRequest')); // NEW
const MyBulkOrders = React.lazy(() => import('./modules/customer/pages/MyBulkOrders')); // NEW
const EmbroideryPage = React.lazy(() => import('./modules/customer/pages/Embroidery')); // NEW
const SewZellaLanding = React.lazy(() => import('./modules/landing/SewZellaLanding')); // NEW

const AppRoutes = () => {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-[#2D2F6E] animate-pulse">Loading...</div>}>
        <Routes>
            {/* ... Auth Routes ... */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Route>


            {/* Delivery Auth Routes - Using custom design */}
            <Route element={<DeliveryAuthLayout />}>
                <Route path="/delivery/login" element={<DeliveryLogin />} />
                <Route path="/delivery/signup" element={<DeliverySignup />} />
                <Route path="/delivery/forgot-password" element={<DeliveryForgotPassword />} />
                <Route path="/delivery/reset-password" element={<DeliveryResetPassword />} />
            </Route>

            {/* Landing Route */}
            <Route path="/" element={<SewZellaLanding />} />

            {/* Customer Public Routes */}
            <Route path="/welcome" element={<CustomerOnboarding />} />

            {/* Customer Routes */}
            <Route path="/user" element={<CustomerProtectedRoute />}>
                <Route element={<CustomerNotificationProvider />}>
                    <Route element={<CustomerMainLayout />}>
                        <Route index element={<CustomerHome />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="services/:id" element={<ServiceDetailPage />} />
                        <Route path="embellishments" element={<Embellishments />} />

                        {/* New Store & Nav Routes */}
                        <Route path="store" element={<StorePage />} />
                        <Route path="store/product/:id" element={<StoreProductDetail />} />
                        <Route path="fabric/:id" element={<FabricDetail />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="profile/edit" element={<EditProfile />} />
                        <Route path="profile/measurements" element={<Measurements />} />
                        <Route path="profile/addresses" element={<SavedAddresses />} />
                        <Route path="refer" element={<ReferEarn />} />
                        {/* Fixed path from /tailor/:id to /shop/:id to avoid conflict or keep it customer centric */}
                        <Route path="tailor/:id" element={<TailorProfile />} />
                        <Route path="tailors" element={<TailorListing />} />

                        {/* Checkout Flow */}
                        <Route path="checkout/tailor" element={<TailorSelection />} />
                        <Route path="checkout/address" element={<CheckoutAddress />} />
                        <Route path="checkout/summary" element={<CheckoutSummary />} />
                        <Route path="checkout/success" element={<OrderSuccess />} />
                        <Route path="orders/:id/track" element={<OrderTracking />} />
                        <Route path="support" element={<Support />} />
                        <Route path="legal/:slug" element={<CMSContent />} />

                        <Route path="cart" element={<CartPage />} />
                        <Route path="wishlist" element={<WishlistPage />} />
                        <Route path="reviews" element={<MyReviews />} />
                        <Route path="bulk-order" element={<BulkOrderRequest />} />
                        <Route path="bulk-orders" element={<MyBulkOrders />} />
                        <Route path="embroidery" element={<EmbroideryPage />} />
                    </Route>
                </Route>
            </Route>

            {/* === TAILOR / PARTNER MODULE === */}
            <Route element={<TailorContextWrapper />}>
                {/* Partner Landing Page */}
                <Route path="/partner/welcome" element={<PartnerLanding />} />

                {/* Partner Public Auth Routes */}
                <Route element={<TailorAuthLayout />}>
                    <Route path="/partner/login" element={<TailorLogin />} />
                    <Route path="/partner/signup" element={<TailorRegistration />} />
                    <Route path="/partner/register" element={<Navigate to="/partner/signup" replace />} />
                </Route>

                {/* Tailor/Partner Public Routes */}
                <Route path="/partner/under-review" element={<UnderReview />} />
                <Route path="/partner/rejected" element={<RejectedPage />} />

                {/* Tailor/Partner Verification Route (Accessible by Pending, Rejected, and Approved) */}
                <Route element={<TailorProtectedRoute requiredStatus={[TAILOR_STATUS.APPROVED, TAILOR_STATUS.PENDING_APPROVAL, TAILOR_STATUS.REJECTED]} />}>
                    <Route element={<TailorLayout />}>
                        <Route path="/partner/verification" element={<VerificationStatus />} />
                    </Route>
                </Route>

                {/* Tailor/Partner Protected Routes (Approved Only) */}
                <Route element={<TailorProtectedRoute requiredStatus={[TAILOR_STATUS.APPROVED]} />}>
                    <Route element={<TailorLayout />}>
                        <Route path="/partner" element={<TailorOverview />} />
                        <Route path="/partner/orders" element={<TailorOrders />} />
                        <Route path="/partner/portfolio" element={<TailorProducts />} />
                        <Route path="/partner/earnings" element={<TailorEarnings />} />
                        <Route path="/partner/wallet" element={<TailorEarnings />} />
                        <Route path="/partner/products" element={<TailorProducts />} />
                        <Route path="/partner/delivery" element={<DeliveryDetails />} />
                        <Route path="/partner/subscription" element={<SubscriptionSettings />} />
                        <Route path="/partner/settings" element={<ProfileSettings />} />
                        <Route path="/partner/measurements" element={<MeasurementList />} />
                        <Route path="/partner/measurements/:id" element={<MeasurementDetail />} />
                    </Route>
                    {/* Full screen tailor views separated from layout nav */}
                    <Route path="/partner/withdraw" element={<TailorWithdraw />} />
                    <Route path="/partner/notifications" element={<TailorNotifications />} />
                </Route>
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
                <Route path="/delivery/orders/:id" element={<DeliveryOrderDetail />} />
                <Route path="/delivery/orders/:id/tracking" element={<LiveTracking />} />
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
        </React.Suspense>
    );
};

export default AppRoutes;
