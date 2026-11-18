# CONVERSION_CHECKLIST — Sewzella Delivery App

Status: **Verified** (ran it) · **Built, not tested** · **Blocked** (reason)

## Discovered inputs
| Input | Value | Source |
|---|---|---|
| Target | Delivery app | user |
| Name / package / version | Sewzella Delivery · com.sewzella.delivery · 1.0.4 (20) | Play listing (1.0.3 live) |
| Test login | QA Test Rider (Claude) — registered without SMS (backend bypass for the delivery role), approved by the admin on 2026-11-18 | backend `auth.controller.js` (`isPartnerRole`, `isAutoActive`) |

## Routes
| Web path | Screen | Wrapper | Status |
|---|---|---|---|
| /delivery/login | Login | auth layout | Verified |
| /delivery/signup · /register | Register (multi-step, documents) | auth layout | Built, not tested |
| /delivery/forgot-password · /reset-password | ForgotPassword · ResetPassword | auth layout | Built, not tested |
| /delivery/legal/:type | LegalPage category delivery | — | Built, not tested |
| /delivery → /delivery/dashboard | DeliveryDashboard | guard + layout (tab) | Verified (offline, no active task) |
| /delivery/tasks | Tasks | guard + layout (tab) | Verified (offline state only) |
| /delivery/history | DeliveryHistory | guard + layout (tab) | Verified (empty state) |
| /delivery/wallet | DeliveryWallet | guard + layout (tab) | Verified (screen, withdraw and deposit sheets opened; nothing submitted) |
| /delivery/profile | DeliveryProfile | guard + layout (tab) | Verified (identity, bank, KYC, support sheets and delete dialog opened; nothing submitted) |
| /delivery/orders/:id | OrderDetail | guard, full screen | Built, not tested (no test order; real orders must not be touched) |
| /delivery/orders/:id/tracking | LiveTracking | guard, full screen | Built, not tested (no test order) |
| (inactive account) | PendingApproval | inside guard | Built, not tested |

## Screens left out
Unrouted web pages: `pages/Dashboard.jsx`, `Orders.jsx`, `Payouts.jsx`, `Signup.jsx`, `Profile.jsx`, `BatchDetail.jsx`, `Notifications.jsx`; unused components (old DeliveryBottomNav, DashboardMap, SwipeToAccept, NewOrderModal, WithdrawalModal) and stores (deliveryNotificationStore, deliveryEngineStore).

## API (same contracts as web; read calls verified, write calls not exercised)
Auth: /auth/login · check-user · register · send-otp · verify-otp · reset-password. Delivery: /deliveries/profile · status (online/offline + live address) · notifications (+read, read-all) · tasks/orders accept/reject/status, proof uploads · wallet / payouts / COD deposits · KYC documents · /upload. Settings: /cms/settings (fees, emergency phone). Socket: `new_task`, `new_order`, `receive_new_order`, `new_notification`, `admin_task_assigned`, `task_claimed`, order rooms for tracking.

## Native capabilities
| Capability | Native | Status |
|---|---|---|
| Live location + status sync | expo-location watch in DeliveryLayout | Built, not tested |
| New task alert | swipe-to-accept (PanResponder) + looping ringtone (expo-audio) + socket/FCM | Display and 30 s timeout verified; accept not tested (real task); emulator has no audio |
| Maps / routes | react-native-maps + Directions REST | Built, not tested |
| Proof photos / KYC / QR upload | camera + gallery picker, JPEG compression | Built, not tested |
| SOS calls | tel: links | Built, not tested |
| Push | expo-notifications → `/user/fcm-token` | Built, not tested |

## UI bugs fixed (native only)
- Pending approval "check status" reloaded the whole page; natively the approved state re-renders immediately.
- Profile rows did nothing: `MenuOption` read `onClick` while the converted screens pass `onPress`. Now accepts both (also fixed in the tailor app).
- Wallet header menu icon had a press handler on a non-pressable icon; now wrapped in a button.
- Submit buttons wired to their form handlers (`scripts/submitfix.js`).
- Active tab icons kept their rounded shape when the shadow toggles; tabs refresh after more than 15 s away.

## Device test list
1. Login with the approved QA rider (password); kill/reopen stays logged in. Before approval → Pending Approval page; "Check status" after approval opens the dashboard.
2. Toggle Online/Offline; header shows the live address; SOS sheet calls.
3. New task alert (assign from admin): ringtone, swipe to accept, 30 s timeout moves it to Tasks.
4. Tasks → order detail: navigate (Google Maps link), reached pickup, proof photo (camera + gallery), picked up, delivered, cancellation reasons.
5. Live tracking screen follows GPS.
6. History, wallet (withdraw, COD deposit, QR upload), profile edits (personal, bank, KYC uploads), delete-account dialog (cancel).
7. Notifications drawer, mark all read; push with app closed opens the dashboard.
8. Offline toast; 401 → login.
