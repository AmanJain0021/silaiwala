# CONVERSION_CHECKLIST — Sewzella User App (customer role)

Status legend: **Verified** (ran it, saw it work) · **Built, not tested** (needs device test) · **Blocked** (reason given) · **Pending** (not yet written)

## Discovered inputs

| Input | Value | Source |
|---|---|---|
| Target app | User app = `customer` role | User prompt; `frontend/src/routes.jsx` (`/user/*` + `CustomerProtectedRoute`) |
| Web frontend | `frontend/` (React 18 + Vite + Tailwind v4) | repo |
| Backend | `backend/` (Express, `src/server.js`) | repo, `deploy.sh` |
| Flutter wrapper | **Not in repo** — user chose "proceed without it" | repo search (`pubspec.yaml` absent) |
| App name | `Sewzella` | `frontend/index.html` `<title>`, `brandingStore.js` (`platformName` from `/cms/settings` is the live name) |
| Android package | `com.sewzella.user` | Play Store link in `frontend/src/modules/landing/*` (`play.google.com/store/apps/details?id=com.sewzella.user`) |
| Version | `1.0.0` / versionCode `100` (assumption, see below) | no wrapper `pubspec.yaml` |
| Icon / splash | `frontend/public/sewzella_logo.jpeg` (white background) | web favicon / apple-touch-icon in `frontend/index.html` |
| API base URL | `https://sewzella.com/api/v1` (socket: `https://sewzella.com`) | `backend/src/app.js` allowed origins, `MeasurementGuideModal.jsx:720`; verified `GET /cms/settings` → 200. `.env` files only contain localhost (conflict, recorded). |
| Razorpay public key | from `frontend/.env` `VITE_RAZORPAY_KEY_ID` (live key) | frontend env |
| Google Maps key | from `frontend/.env` `VITE_GOOGLE_MAPS_API_KEY` | frontend env |
| Google OAuth web client id | from `frontend/.env` `VITE_GOOGLE_CLIENT_ID` | frontend env |
| google-services.json | **missing** → native push Blocked | no wrapper |
| Signing keystore | existing upload keystore (alias `upload`, SHA-1 `45:5B:6F:7E:21:24:8A:ED:60:E7:E7:44:D4:23:10:02:5C:4D:BF:9D`) — `mobile-user/credentials/` (gitignored) | user supplied `~/Downloads/upload-keystore.jks` |
| Test login | Default-OTP bypass is **OFF on production** (`POST /auth/register-customer` with `123456` → "Invalid or expired verification code"). No test customer could be created without sending a real SMS. Login-dependent checks = Built, not tested. | `backend/src/modules/auth/controllers/auth.controller.js` (`isDefaultOtpEnabled`, bypass OTP `123456`/`000000`) |
| EAS login | Not logged in (`eas whoami`) | CLI |

## Auth (backend contract)

- `POST /auth/login` `{ email: <email|10-digit phone>, password | otp, expectedRole: 'customer', fcmToken?, platform? }` → `{ success, token, data: { id, name, email, phoneNumber, role, isActive, profile } }`.
- `POST /auth/send-otp` `{ phoneNumber }` (or `{ email }`) → `{ success, message, otp? }` (otp only when default OTP enabled).
- `POST /auth/register-customer` `{ name, email, phoneNumber, otp, password?, referralCode? }` → `{ success, token, data }`.
- `POST /auth/verify-otp`, `POST /auth/check-user`, `POST /auth/reset-password`, `POST /auth/google-login { credential }`, `POST /auth/logout`, `DELETE /auth/delete-account`.
- Token: JWT, `Authorization: Bearer <token>` (`middlewares/auth.middleware.js`). No refresh endpoint is used by the web (`JWT_REFRESH_*` env unused by customer flow). Expiry `JWT_EXPIRE` (default 30d). Any invalid/expired token → 401 `Not authorized to access this route`.
- Web storage: `localStorage.token` + `localStorage.user`; logout clears and calls `POST /notifications/fcm-token/remove`.

## Routes / screens in scope (guard: P = public, A = CustomerProtectedRoute)

| Web route | Screen | Guard | Native route file | Status |
|---|---|---|---|---|
| /welcome | Onboarding | P | app/welcome.jsx | Verified (release APK on emulator, 2026-11-17) |
| /user/login | Login (OTP / password / Google) | P | app/user/login.jsx | Verified (release APK on emulator, 2026-11-17) |
| /user/register | Signup | P | app/user/register.jsx | Built, not tested |
| /user/forgot-password | ForgotPassword | P | app/user/forgot-password.jsx | Built, not tested |
| /user/legal/:type | SharedLegalPage (customer) | P | app/user/legal-page/[type].jsx | Built, not tested |
| /user | Home | P | app/user/index.jsx | Verified (release APK on emulator, 2026-11-17) |
| /user/services | Services | P | app/user/services/index.jsx | Built, not tested |
| /user/services/category/:categoryId | CategoryServices | P | app/user/services/category/[categoryId].jsx | Built, not tested |
| /user/services/:id | ServiceDetail | P | app/user/services/[id].jsx | Built, not tested |
| /user/what-we-offer | WhatWeOffer | P | app/user/what-we-offer.jsx | Built, not tested |
| /user/embellishments | Embellishments | P | app/user/embellishments.jsx | Built, not tested |
| /user/embroidery | Embroidery | P | app/user/embroidery.jsx | Built, not tested |
| /user/store | Store | P | app/user/store/index.jsx | Verified (release APK on emulator, 2026-11-17) |
| /user/store/product/:id | StoreProductDetail | P | app/user/store/product/[id].jsx | Built, not tested |
| /user/fabric/:id | FabricDetail | P | app/user/fabric/[id].jsx | Built, not tested |
| /user/tailors | TailorListing | P | app/user/tailors.jsx | Built, not tested |
| /user/tailor/:id | TailorProfile | P | app/user/tailor/[id].jsx | Built, not tested |
| /user/support | Support | P | app/user/support.jsx | Built, not tested |
| /user/legal/:type | LegalPage (web CMSContent at the same path is shadowed by LegalPage on web, so LegalPage is what users see) | P | app/user/legal/[type].jsx | Built, not tested |
| /user/orders | Orders | A | app/user/orders/index.jsx | Built, not tested |
| /user/orders/:id/track | OrderTracking | A | app/user/orders/[id]/track.jsx | Built, not tested |
| /user/orders/:id/chat | OrderChat | A | app/user/orders/[id]/chat.jsx | Built, not tested |
| /user/orders/:id/journey | CustomerLiveJourney | A | app/user/orders/[id]/journey.jsx | Built, not tested |
| /user/profile | Profile | A | app/user/profile/index.jsx | Built, not tested |
| /user/profile/edit | EditProfile | A | app/user/profile/edit.jsx | Built, not tested |
| /user/profile/measurements | Measurements | A | app/user/profile/measurements.jsx | Built, not tested |
| /user/profile/addresses | SavedAddresses | A | app/user/profile/addresses.jsx | Built, not tested |
| /user/activity | ActivityHistory | A | app/user/activity.jsx | Built, not tested |
| /user/loyalty | LoyaltyPoints | A | app/user/loyalty.jsx | Built, not tested |
| /user/membership | CustomerMembership | A | app/user/membership.jsx | Built, not tested |
| /user/refer | ReferEarn | A | app/user/refer.jsx | Built, not tested |
| /user/wallet | WalletPage (common) | A | app/user/wallet.jsx | Built, not tested |
| /user/coupons | Coupons | A | app/user/coupons.jsx | Built, not tested |
| /user/language | LanguageSettings | A | app/user/language.jsx | Built, not tested |
| /user/notifications | NotificationSettings | A | app/user/notifications.jsx | Built, not tested |
| /user/payments | PaymentMethods | A | app/user/payments.jsx | Built, not tested |
| /user/faq | FAQ | A | app/user/faq.jsx | Built, not tested |
| /user/cart | Cart | A | app/user/cart.jsx | Built, not tested |
| /user/wishlist | Wishlist | A | app/user/wishlist.jsx | Built, not tested |
| /user/reviews | MyReviews | A | app/user/reviews.jsx | Built, not tested |
| /user/checkout/tailor | TailorSelection | A | app/user/checkout/tailor.jsx | Built, not tested |
| /user/checkout/address | CheckoutAddress | A | app/user/checkout/address.jsx | Built, not tested |
| /user/checkout/summary | CheckoutSummary | A | app/user/checkout/summary.jsx | Built, not tested |
| /user/checkout/success | OrderSuccess | A | app/user/checkout/success.jsx | Built, not tested |
| /user/alteration | AlterationForm | A | app/user/alteration.jsx | Built, not tested |
| /user/custom-design | CustomDesignForm | A | app/user/custom-design.jsx | Built, not tested |
| /user/bulk-order | BulkOrderRequest | A | app/user/bulk-order.jsx | Built, not tested |
| /user/bulk-orders | MyBulkOrders | A | app/user/bulk-orders.jsx | Built, not tested |
| /user/issues/report/:orderId | ReportIssue | A | app/user/issues/report/[orderId].jsx | Built, not tested |
| /user/issues/:issueId | IssueDetails | A | app/user/issues/[issueId].jsx | Built, not tested |

## Screens left out (confirm scope)

- `/` SewZellaLanding, `/page/*`, `/contact*`, `/terms*`, `/privacy*` — public marketing website (not part of the user app; legal content is reachable in-app via `/user/legal/:slug`).
- `/track/offline/:token` — public offline-order tracking link for walk-in customers (web link, not app).
- `/partner/*` (tailor app), `/delivery/*` (delivery app), `/executive/*` (measurement executive), `/admin/*` (admin panel).

## API calls (customer scope)

Response envelope everywhere: `{ success: boolean, data: ..., message? }`. Auth guard confirmed: `GET /customers/profile` without a token → 401 (the app then logs out and shows Login).
Checks run 2026-11-16 against production with read-only GETs only; no writes, payments or OTP SMS were triggered.

| Method | Path | Used by | Status |
|---|---|---|---|
| POST | /auth/login · /auth/send-otp · /auth/verify-otp · /auth/check-user · /auth/register-customer · /auth/reset-password · /auth/google-login · /auth/logout | auth screens | Built, not tested (needs a logged-in customer; production has no default OTP) |
| DELETE | /auth/delete-account | Profile | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET | /cms/settings | App boot (branding, splash), AlterationCard | Verified (200, success, settings object) |
| GET | /cms/banners/active?location= | Home, Store | Verified (200, success; 0 active banners for home/store today) |
| GET | /cms/content/:slug · ?type=faq · ?type=faq&category=customer · ?type=legal · ?type=video · /cms/content/measurement-guide-video | CMSContent, FAQ, Profile, MeasurementGuideModal | Verified (200: ?type=faq 11 items, ?type=legal 3, privacy-policy, terms-of-service, measurement-guide-video) |
| GET/PATCH | /customers/profile | userStore | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET/POST/PATCH/DELETE | /customers/addresses[/:id] | userStore | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET/POST/DELETE | /customers/cart[/:cartId] | cartStore | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /customers/wishlist · /customers/wishlist/toggle | wishlistStore | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET | /customers/referral-stats | ReferEarn | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /customers/promo-codes · /customers/apply-promo | CouponOfferSection | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET | /customers/tailors | AlterationForm, tailor lists | Verified (200, 18 tailors) |
| GET | /services · /services/:id · /products/categories | ServicesGrid, ServiceDetail | Verified (200 for all three) |
| GET | /style-addons?isActive=true[&addonType=] | ServiceDetail, Embroidery, StyleAddonModal | Verified (200, 69 add-ons) |
| GET | /products · /products/:id · /products/featured | Store, FabricDetail, StoreProductDetail | Verified (200 for all three) |
| GET | /tailors/:id · /tailors/:id/services · /tailors/:id/fabrics · /tailors/:id/work-samples | TailorProfile, FabricSelector | Verified (200 for all four) |
| GET | /distance/forward-geocode · POST /distance/calculate | ServiceDetail, AlterationCard | Built, not tested (needs a logged-in customer; production has no default OTP) |
| POST | /orders/price-summary · /orders · /orders/razorpay/create · /orders/razorpay/verify | Cart, Checkout | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET | /orders/my-orders · /orders/:id · /orders/:id/measurements · /orders/chats/unread | Orders, OrderTracking | Built, not tested (needs a logged-in customer; production has no default OTP) |
| POST | /orders/:id/delivery-preference · /orders/:id/measurements/approve · /orders/:id/measurements/request-revision · /orders/:id/exchange · /orders/:id/customer-location | OrderTracking, LiveJourney | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET/POST | /orders/:id/chat | OrderChat | Built, not tested (needs a logged-in customer; production has no default OTP) |
| PATCH | /orders/:id/status | CustomerLiveJourney | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /alterations · /alterations/request · /alterations/:id/razorpay · /alterations/:id/verify | Orders, AlterationForm, AlterationCard | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /custom-designs · /custom-designs/request · /custom-designs/:id/razorpay · /custom-designs/:id/verify | Home, CustomDesignCard, Checkout | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST · PUT | /bulk-orders/my · /bulk-orders · /bulk-orders/:id | Bulk order screens, Checkout | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET/POST/PUT/DELETE | /measurements[/:id] | measurementStore | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /reviews/my-reviews · /reviews | MyReviews, ReviewModal | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · POST | /issues/:id · /issues · /issues/:id/chat | ReportIssue, IssueDetails | Built, not tested (needs a logged-in customer; production has no default OTP) |
| GET · PATCH | /notifications · /notifications/:id/read · /notifications/read-all | NotificationContext | Built, not tested (needs a logged-in customer; production has no default OTP) |
| PUT · POST | /user/fcm-token (platform `mobile`) · /notifications/fcm-token/remove · /notifications/test-push | push | Built, not tested (needs a logged-in device) |
| GET · POST | /subscriptions?audience=customer · /subscriptions/my-membership · /subscriptions/create-customer-order · /subscriptions/subscribe-customer · /subscriptions/redeem-with-points | CustomerMembership | Partly verified: GET /subscriptions?audience=customer 200 (3 plans); the rest needs login |
| GET · POST | /wallet/dashboard · /wallet/withdraw | WalletPage | Built, not tested (needs a logged-in customer; production has no default OTP) |
| POST | /upload · /upload/public · /upload/chunk[/complete] · /upload/public/chunk[/complete] | file uploads | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Socket | `join_user_room`, `join_order_room`, `leave_order_room`, `join_issue_room`; events `order_status_updated`, `new_notification`, chat/location events | socketStore, tracking, chat | Built, not tested (needs login) |

## Design tokens (from `frontend/src/styles/index.css`)

- Primary `#843D9B`, dark `#6B2F7E`, light `#9B5BB0`, soft `#F3EAF8`, accent `#D4AF37`; customer page bg `#F7F8FC`.
- Fonts: Poppins (sans, default), Manrope, Plus Jakarta Sans, Libre Caslon Text.
- Tailwind default spacing/radius/shadow scale (rem = 16px).

## Web state & data fetching

- Zustand stores (`authStore`, `userStore`, `cartStore` persisted, `checkoutStore`, `wishlistStore`, `locationStore`, `measurementStore`, `orderStore`, `socketStore`, `brandingStore`, `bannerStore`).
- Axios client; GET requests de-duplicated (previous identical GET aborted), cache-busting `_t`. No query library; fetch on mount; no polling except where noted per screen.

## Native capabilities (no wrapper — derived from web)

| Capability | Web source | Native | Status |
|---|---|---|---|
| Push notifications | Firebase web messaging (`hooks/usePushNotifications.js`) | expo-notifications device FCM token → `POST /notifications/fcm-token` (`platform: 'android'`) | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Location | browser geolocation (`useUnifiedLocation`, LocationModal) | expo-location (foreground) | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Maps / live tracking | @react-google-maps/api | react-native-maps (Google provider) | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Payments | Razorpay checkout.js | react-native-razorpay | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Google sign-in | @react-oauth/google | @react-native-google-signin/google-signin (webClientId) | Built, not tested (needs a logged-in customer; production has no default OTP) |
| File upload | `<input type=file>` | expo-image-picker / expo-document-picker | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Realtime | socket.io-client | socket.io-client | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Splash | `SplashScreen.jsx` (CMS-driven) + logo | expo-splash-screen + CMS splash component | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Offline toast | `OfflineDetector` | NetInfo | Built, not tested (needs a logged-in customer; production has no default OTP) |
| Back button | browser history | Android back via expo-router stack | Built, not tested (needs a logged-in customer; production has no default OTP) |

## UI bugs fixed (native only)

- ServiceDetail: web calls undefined `formatYYYYMMDD()` when Tailor-at-Home has no chosen date → ReferenceError on Book Now / Add to basket. Native imports it from MeasurementSchedulePicker.
- Login: web sets `error` but never renders it (failed login silent). Native shows it with Signup's red error box.
- ReportIssue: the Submit Issue button had no handler outside the web `<form>`; native wires it to submit.
- Support FAQ search: web builds a RegExp from raw input, so typing `(` or `*` throws and blanks the list. Native escapes the query.
- IssueDetails: the chat now auto-scrolls to the newest message (native ScrollView.scrollToEnd).
- Profile VIP card: the nested "Explore Club" button no longer swallows the tap; the whole card opens Membership.
- Icons drawn over inputs (e.g. the calendar icon on the Bulk Order date) no longer block taps on the field.
- MyBulkOrders detail drawer and Wallet withdraw form became native bottom sheets (Android back closes them).
- Arbitrary z-index classes (`z-[100]` etc.) were ignored, so overlays sat under later siblings: the Login/Signup **Skip** button could not be tapped. The style engine now maps `z-[n]`, and AuthLayout renders Skip last.
- Screen changes felt like a website: slide animation removed (direct switch), the 4 bottom tabs stay mounted in a tab navigator instead of re-creating the screen on every tap, hidden screens are frozen, and press feedback is stronger (opacity 0.7).
- LegalPage share: shares the public web URL of the document (the web shared `window.location.href`).

## Device test list

Install `app-release.apk` on a real Android phone (Android 8+), log in with a real customer account, and tick each item.

**Install & launch**
- [ ] Installs over an older Sewzella build (same package `com.sewzella.user` + same upload key) without uninstalling.
- [ ] Splash shows the logo on `#282726`, then Welcome (logged out) or Home (logged in).
- [ ] Android back on Home exits the app; back elsewhere goes to the previous screen.

**Auth**
- [ ] Login with phone + OTP (real SMS); wrong OTP shows the red error box.
- [ ] Login with password; Forgot password flow.
- [ ] Google sign-in (needs the Android OAuth client + SHA-1, see MEMORY §10).
- [ ] Kill and reopen the app → still logged in. Logout → Login screen.
- [ ] Register a new customer (Signup) end to end.

**Browse**
- [ ] Home: header, location chip, search, banners, quick actions, service grid, popular tailors scroll smoothly.
- [ ] Location: allow permission → current address shows; deny → manual search works (Places autocomplete).
- [ ] Services → category → service detail; fabric / customisation / measurement selectors; Tailor-at-Home date picker.
- [ ] Store: categories, filters drawer, product detail, size variants, pincode check, add to cart.
- [ ] Tailors list + tailor profile (services, fabrics, work samples tabs).
- [ ] Embroidery / Embellishments add-ons selection.

**Cart & checkout (use a small amount; refund if you complete a real payment)**
- [ ] Cart quantities, remove item, wishlist toggle.
- [ ] Checkout address: add, edit, pick on map, current location.
- [ ] Coupon apply / remove; bill details update.
- [ ] Razorpay sheet opens (UPI / card); cancel returns to summary with a message.
- [ ] Order success screen (confetti) → Orders.

**Orders**
- [ ] Orders list tabs (stitching / alterations / custom designs / bookings); pull to refresh.
- [ ] Order tracking timeline; measurement approval; exchange request; help modal; review modal.
- [ ] Order chat sends and receives in real time.
- [ ] Live journey map shows rider/executive moving (needs an active delivery).
- [ ] Report issue: add 1–3 photos (camera + gallery), submit; Issue details chat.

**Profile**
- [ ] Edit profile + photo upload (camera and gallery).
- [ ] Measurements: create profile, choose service, enter values, save; edit and delete.
- [ ] Saved addresses CRUD.
- [ ] Loyalty points, Membership (redeem with points / Razorpay), Wallet (withdraw form opens as a sheet), Coupons.
- [ ] Refer & earn: copy code, Share opens the Android share sheet.
- [ ] Alteration request and Custom design request with photos; Bulk order (date picker, file picker).
- [ ] FAQ / Support search (try typing `(`), Legal pages (terms / privacy) render formatted text; Share.
- [ ] Language and notification settings toggles.
- [ ] Delete account confirm dialog (cancel only, unless testing on a throwaway account).

**Push (after google-services.json is added and the APK rebuilt)**
- [ ] Profile → Test Push arrives with the app in foreground, background and killed.
- [ ] Tapping the notification opens the linked order/screen.

**General**
- [ ] Turn on airplane mode → offline toast; back online → recovers.
- [ ] Keyboard never covers the focused input (forms, chat).
- [ ] Dark-mode phone: app stays in its light theme and stays readable.
- [ ] Small phone (≤ 360dp wide) and large phone: no clipped text or horizontal overflow.
