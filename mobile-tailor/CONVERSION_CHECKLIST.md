# CONVERSION_CHECKLIST — Sewzella Tailor (Partner) App

Status legend: **Verified** (ran it, saw it work) · **Built, not tested** (needs device test / approved tailor login) · **Blocked** (reason given)

## Discovered inputs
| Input | Value | Source |
|---|---|---|
| Target | Tailor / Partner app | user (question round) |
| App name / package / version | Sewzella Tailor · com.sewzella.tailor · 1.0.4 (20) | Play listing (1.0.3 live), `frontend/src/modules/landing` Play link |
| Backend | https://sewzella.com/api/v1 | as user app |
| Firebase | `google-services.json` (has `com.sewzella.tailor`) | user |
| Keystore | same upload keystore as user app | user |
| Test login | **none** — tailor registration needs an SMS OTP on production and admin approval | `backend/.../auth.controller.js` (`isPartnerRole` bypass excludes tailor; `isAutoActive`) |

## Routes (web `routes.jsx` TAILOR / PARTNER MODULE)
| Web path | Screen | Guard / wrapper | Status |
|---|---|---|---|
| /partner/welcome | PartnerLanding | public | Verified (release APK on emulator, matches web) |
| /partner/login | Login | TailorAuthLayout | Verified (release APK on emulator, matches web) |
| /partner/signup (+ /partner/register redirect) | Registration (5 steps) | TailorAuthLayout | Step 1 renders like web (verified); OTP + submit not tested (needs SMS OTP) |
| /partner/forgot-password | ForgotPassword | TailorAuthLayout | Verified (release APK on emulator, matches web) |
| /partner/legal/:type | LegalPage category tailor | public | Verified (release APK on emulator, matches web) |
| /partner/under-review · /partner/rejected | StatusPages | public | Built, not tested |
| /partner/verification | VerificationStatus | approved/pending/rejected + layout | Built, not tested |
| /partner | Overview | approved + layout (tab) | Built, not tested |
| /partner/orders | Orders | approved + layout (tab) | Built, not tested |
| /partner/wallet · /partner/earnings | TailorEarnings | approved + layout | Built, not tested |
| /partner/products · /partner/portfolio | Products | approved + layout | Built, not tested |
| /partner/settings | ProfileSettings | approved + layout (tab) | Built, not tested |
| /partner/shop-orders | TailorShopOrders | approved + layout | Built, not tested |
| /partner/delivery | DeliveryDetails | approved + layout | Built, not tested |
| /partner/subscription | Subscription | approved + layout | Built, not tested |
| /partner/measurements · /:id | MeasurementList · MeasurementDetail | approved + layout | Built, not tested |
| /partner/alterations | TailorAlterations | approved + layout | Built, not tested |
| /partner/custom-designs | TailorCustomDesigns | approved + layout | Built, not tested |
| /partner/issues · /:issueId | ReportedIssues · TailorIssueDetails | approved + layout | Built, not tested |
| /partner/orders/:id/chat | TailorOrderChat | approved, full screen | Built, not tested |
| /partner/notifications | Notifications | approved, full screen | Built, not tested |

Guard verified: opening an approved-only page while logged out redirects to Partner Sign In.

## Screens left out
- Desktop sidebar of TailorLayout (mobile layout only). `pages/Dashboard.jsx` and `Withdraw.jsx` are not routed on the web (converted, unused). `Products.jsx.backup` ignored.
- Customer, delivery, executive and admin modules.

## API calls (tailor scope)
All built against the same contracts as the web; none verified with a login (no approved tailor account).
Auth: /auth/login · send-otp · verify-otp · check-user · register · reset-password · google-login · delete-account.
Tailor: /tailors/me · dashboard · orders (+status, measurement-report, send-measurement-confirmation) · offline-orders · products · services (+toggle) · profile · documents · delivery-details · earnings · withdraw · cod-deposit (history, razorpay create/verify).
Orders: /orders/:id · chat · chats/unread · tailor-location · tailor-complete-delivery. Shiprocket: validate · create-shipment · generate-awb · schedule-pickup · label.
Requests: /alterations (+quote) · /custom-designs (+quote) · /issues (tailor list, chat, status, delivery-quote, dispatch-delivery).
Other: /notifications (+read, read-all) · /subscriptions (config, create-order, subscribe) · /wallet (dashboard, withdraw) · /products/categories · /cms/content/:slug · /upload (/public, /public/bulk).
Socket: tailor room via socketStore (`new_order`, `receive_new_order`, `order_status_updated`, notifications), order rooms for live tracking (`joinOrderRoom`, `locationUpdated`).

## Native capabilities
| Capability | Native | Status |
|---|---|---|
| Push | expo-notifications FCM token → `/user/fcm-token` (platform mobile), registered in TailorLayout | Built, not tested |
| New-order alert | vibration pattern + toast | Built, not tested |
| Live delivery tracking / customer dropoff map | react-native-maps + expo-location watch | Built, not tested |
| Shop location picker | Places autocomplete + LocationPickerMap + reverse geocode | Built, not tested |
| Uploads (profile, documents, garments, fabrics) | expo-image-picker (camera/gallery), compression, multipart | Built, not tested |
| Payments (subscription, COD deposit) | react-native-razorpay adapter | Built, not tested |
| Pull to refresh | RefreshControl (re-mount page) | Built, not tested |

## UI bugs fixed (native only)
- Orders: the web calls `playNotificationSound` without importing it, so the new-order alert never fires; native imports it (vibration alert).
- Legal links in Login/Registration opened a relative URL; native navigates in-app.
- Decorative buttons inside tappable cards (e.g. MeasurementList "View") no longer swallow the tap (primitive-level).

## Device test list
1. Fresh install → `/partner/welcome` landing → Login.
2. Login with an approved tailor (password and OTP) → Home (Overview); kill/reopen stays logged in.
3. Pending/rejected tailor → Verification page; re-upload documents (dark uploader).
4. Bottom nav: Home, Orders (Stitching/Shop/Alterations/Custom/Issues sub-tabs), Wallet, Services, Profile — instant switching, back returns to Home.
5. Orders: accept/reject, status updates, order detail (full screen), measurement report, dispatch/Shiprocket, chat; new order arrives → toast + vibration.
6. Live delivery: start trip → GPS permission → customer sees movement.
7. Services/Products: add/edit service, add fabric/garment with camera + gallery images, categories select.
8. Wallet: earnings periods, withdraw request, COD deposit via Razorpay (small amount).
9. Profile: edit details, shop location (search + tap map), photo, push test, logout, delete-account dialog (cancel).
10. Notifications list, mark all read, tap a push notification (app closed and open).
11. Offline → toast; session expiry (401) → login.
