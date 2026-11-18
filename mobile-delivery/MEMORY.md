# MEMORY — Sewzella Delivery App (Expo)

## 1. What this app is
Native Android app for the **delivery partner** role, converted 1:1 from the web delivery module (`/delivery/*`).
- Web: `../frontend/src/modules/delivery` (pages, layout `layouts/DeliveryLayout.jsx`, stores, services), routes in `frontend/src/routes.jsx` ("Delivery Routes" + "Delivery Auth Routes").
- Backend: `../backend/`. Flutter wrapper: none.
- Built from the tailor app's foundation (`../mobile-tailor`, itself from `../mobile-user`): same primitives, style engine, adapters and scripts.

## 2. Discovered inputs
| Input | Value | From |
|---|---|---|
| App name | Sewzella Delivery | Play Store listing title |
| Package | com.sewzella.delivery | Play link in `frontend/src/modules/landing`; `google-services.json` |
| Version | 1.0.4 (versionCode 20) — Play shows 1.0.3 | Play listing |
| API base | https://sewzella.com/api/v1 | `.env` (public values) |
| Signing | same upload keystore as the other Sewzella apps (`credentials/`, gitignored) | user |
| Test account | "QA Test Rider (Claude)" registered on production 2026-11-18, approved by the admin the same day; credentials were given to the user in chat, not stored | — |

## 3. Stack
As `../mobile-user/MEMORY.md` §3. Added: `expo-audio` (new-task ringtone loop).

## 4. Folder structure and conventions
- `src/app/delivery/(tabs)/_layout.jsx` = DeliveryProtectedRoute + DeliveryLayout around a tab navigator (dashboard, tasks, history, wallet, profile) — ONE header, bottom nav, location tracker and new-task alert for all tabs. Tab screens are wrapped with `withDeliveryTab` (scroll + pull-to-refresh, web viewport padding; wallet full-bleed).
- Auth pages: `withDeliveryAuthLayout`; order detail / live tracking: `withDeliveryGuard` (full screen).
- `src/screens/` routed web pages only (unused web pages Dashboard.jsx, Orders, Payouts, Signup, Profile, BatchDetail, Notifications were not ported). `src/components/delivery/` layout, guard, alerts, modals. `src/store/` authStore (delivery login keys) + deliveryStore.
- Conversion helpers in `scripts/`: web2rn.js, fixups.py, blockfix.js, modalify.py, fileinputs.py (label + hidden file input → native picker), scan.js, build-release.sh, ui-compare/.

## 5. Auth
- Same as web: `authStore.login(phone, password, 'delivery')` / OTP login → token; the delivery guard checks `user.role === 'delivery'` and shows `PendingApproval` while `user.isActive === false`.
- Keys (web parity): `delivery_token` + `delivery-refresh-token` (SecureStore), `delivery_user`, `user`, `delivery-auth-storage` (zustand persist of deliveryStore, **without tokens** — the web stores the token there too; native keeps it only in SecureStore).
- 401 → `session_expired` → authStore.logout → `/delivery/login`. Launch: logged in → `/delivery/dashboard`, else `/delivery/login`.

## 6. API layer
`src/lib/api.js`; web `shared/utils/api` and `services/deliveryService.js` (→ `src/lib/deliveryService.js`) map to it.

## 7. Web → native decisions (delivery-specific)
- DeliveryLayout: header (avatar, live address, Online/Offline toggle, SOS, notifications bell), notifications → right `Drawer`, SOS → `Dialog`, bottom nav static; `<Outlet context>` → `OutletContext` / `useOutletContext()` in `lib/nav.js`. Location tracking + status sync (`/deliveries/status`) runs once in the layout (foreground, expo-location), as on the web.
- New task alert: framer-motion drag → PanResponder swipe-to-accept (same 180px threshold); ringtone = same mp3 via expo-audio (`utils/audioAlert.js`); web `fcm_message` window event → `events.emit('fcm_message')` from the native push listener; `document.visibilityState` → AppState.
- Maps: `TrackingMap` and order detail → react-native-maps + Directions REST (`lib/directions`) + reverse geocode; LiveTracking GPS → `lib/location.watchPosition`.
- Proof photos: `utils/pickDeliveryPhoto.js` (picker + expo-image-manipulator JPEG 1280/0.72 data URL); hidden inputs replaced by buttons opening camera/gallery.
- react-icons (Feather/Material) → lucide-react-native (same names, `MdTwoWheeler` → `Bike`).
- `createPortal` dropped (native Modal is always on top); PendingApproval reload → store update re-renders the guard.

## 8. Backend changes
None.

## 9. Commands
- Lint `npx expo lint` · scans `node scripts/scan.js` · bundle `npx expo export --platform android`.
- Release APK: `bash scripts/build-release.sh apk` (emulator: `ABIS=arm64-v8a,armeabi-v7a,x86_64 …`) → `../releases/sewzella-delivery-v<version>-<code>.apk`.
- UI compare: `scripts/ui-compare/` with `SCHEME=sewzelladelivery PKG=com.sewzella.delivery`.

## 10. Known issues
- Order detail, live tracking, proof upload and swipe-to-accept are untested: no test order exists, and real dispatch tasks must not be accepted, rejected or opened from a test account. Keep the test rider Offline.
- Form submissions (profile, bank, KYC, withdraw, deposit, support) were opened but not submitted.
- Location is foreground-only (web parity); no background tracking.

- After conversion, check that custom components read the handler the call sites pass: the codemod renames `onClick` to `onPress` at call sites only (`MenuOption` broke this way).

## 11. Assumptions
- versionCode 20 > Play build of 1.0.3.
