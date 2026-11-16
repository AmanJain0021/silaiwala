#!/usr/bin/env python3
"""Generates src/app route files (web path -> screen). Protected = CustomerProtectedRoute in web routes.jsx."""
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'src')
P, A = False, True
ROUTES = [
  ('welcome.jsx', 'Onboarding', P),
  ('user/index.jsx', 'Home', P), ('user/login.jsx', 'Login', P), ('user/register.jsx', 'Signup', P),
  ('user/forgot-password.jsx', 'ForgotPassword', P), ('user/legal/[type].jsx', 'LegalPage', P),
  ('user/services/index.jsx', 'Services', P), ('user/services/category/[categoryId].jsx', 'CategoryServices', P),
  ('user/services/[id].jsx', 'ServiceDetail', P), ('user/what-we-offer.jsx', 'WhatWeOffer', P),
  ('user/embellishments.jsx', 'Embellishments', P), ('user/embroidery.jsx', 'Embroidery', P),
  ('user/store/index.jsx', 'Store', P), ('user/store/product/[id].jsx', 'StoreProductDetail', P),
  ('user/fabric/[id].jsx', 'FabricDetail', P), ('user/tailors.jsx', 'TailorListing', P),
  ('user/tailor/[id].jsx', 'TailorProfile', P), ('user/support.jsx', 'Support', P),
  ('user/orders/index.jsx', 'Orders', A), ('user/orders/[id]/track.jsx', 'OrderTracking', A),
  ('user/orders/[id]/chat.jsx', 'OrderChat', A), ('user/orders/[id]/journey.jsx', 'CustomerLiveJourney', A),
  ('user/profile/index.jsx', 'Profile', A), ('user/profile/edit.jsx', 'EditProfile', A),
  ('user/profile/measurements.jsx', 'Measurements', A), ('user/profile/addresses.jsx', 'SavedAddresses', A),
  ('user/activity.jsx', 'ActivityHistory', A), ('user/loyalty.jsx', 'LoyaltyPoints', A),
  ('user/membership.jsx', 'CustomerMembership', A), ('user/refer.jsx', 'ReferEarn', A),
  ('user/wallet.jsx', 'WalletPage', A), ('user/coupons.jsx', 'Coupons', A),
  ('user/language.jsx', 'LanguageSettings', A), ('user/notifications.jsx', 'NotificationSettings', A),
  ('user/payments.jsx', 'PaymentMethods', A), ('user/faq.jsx', 'FAQ', A), ('user/cart.jsx', 'Cart', A),
  ('user/wishlist.jsx', 'Wishlist', A), ('user/reviews.jsx', 'MyReviews', A),
  ('user/checkout/tailor.jsx', 'TailorSelection', A), ('user/checkout/address.jsx', 'CheckoutAddress', A),
  ('user/checkout/summary.jsx', 'CheckoutSummary', A), ('user/checkout/success.jsx', 'OrderSuccess', A),
  ('user/alteration.jsx', 'AlterationForm', A), ('user/custom-design.jsx', 'CustomDesignForm', A),
  ('user/bulk-order.jsx', 'BulkOrderRequest', A), ('user/bulk-orders.jsx', 'MyBulkOrders', A),
  ('user/issues/report/[orderId].jsx', 'ReportIssue', A), ('user/issues/[issueId].jsx', 'IssueDetails', A),
]
made = 0
for route, screen, prot in ROUTES:
    if not os.path.exists(os.path.join(ROOT, 'screens', screen + '.jsx')):
        continue
    f = os.path.join(ROOT, 'app', route)
    os.makedirs(os.path.dirname(f), exist_ok=True)
    rel = os.path.relpath(os.path.join(ROOT, 'screens', screen), os.path.dirname(f))
    if prot:
        guard = os.path.relpath(os.path.join(ROOT, 'components', 'common', 'RequireAuth'), os.path.dirname(f))
        body = f"import {{ withAuth }} from '{guard}';\nimport Screen from '{rel}';\n\nexport default withAuth(Screen);\n"
    else:
        body = f"export {{ default }} from '{rel}';\n"
    open(f, 'w').write(body); made += 1
print('routes written:', made)
