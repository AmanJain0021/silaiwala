# MEMORY — Sewzella User App (Expo)

## 1. What this app is
Native Android app for the **customer** role of Sewzella (tailoring platform), converted 1:1 from the web customer module.
- Web frontend: `../frontend/` (customer screens in `frontend/src/modules/customer`, routes `/user/*` in `frontend/src/routes.jsx`)
- Backend: `../backend/` (Express, `src/modules/*/routes`)
- Flutter wrapper: none in repo (user chose to proceed without it). Package/version taken from the Play Store listing.

## 2. Discovered inputs
| Input | Value | From |
|---|---|---|
| App name | Sewzella | `frontend/index.html`, `brandingStore.js` |
| Package | com.sewzella.user | Play Store link in `frontend/src/modules/landing` |
| Version | 1.0.3 (versionCode 10) — Play listing shows 1.0.2 | play.google.com listing |
| API base | https://sewzella.com/api/v1 (socket/uploads: https://sewzella.com) | `backend/src/app.js` allowed origins; verified live |
| Public keys | Razorpay key id, Google Maps key, Google web client id | `frontend/.env` → copied into `mobile-user/.env` as `EXPO_PUBLIC_*` (public values only) |

## 3. Stack
Expo SDK 58 · React Native 0.88 · React 19.3 · Node 24 (dev machine). JavaScript only.
- expo-router 58 — navigation; routes mirror web paths (`/user/...`)
- zustand — same stores as the web
- axios — single API client (`src/lib/api.js`)
- twrnc — Tailwind class strings → RN style objects; config in `tailwind.config.js` (web tokens). Chosen so web `className` strings port verbatim (pixel fidelity). This is the "one theme file".
- lucide-react-native + react-native-svg — same icon set as web (lucide-react)
- expo-secure-store (token) + AsyncStorage (everything else) behind `src/lib/storage.js`
- socket.io-client — same realtime client as the web
- @expo-google-fonts/poppins — web font (Poppins)

## 4. Folder structure and conventions
- `src/app/` — routes only (Expo Router). File path == web path (e.g. `src/app/user/orders/[id]/track.jsx` ↔ `/user/orders/:id/track`).
- `src/screens/` — screen components (one per web page, same name as web file).
- `src/components/` — shared UI (customer components mirror `frontend/src/modules/customer/components`).
- `src/store/` — zustand stores ported from `frontend/src/store`.
- `src/lib/` — api, storage, router shim (`useNavigate/useLocation/useParams/Link`), toast, tw, config.
- `src/utils/` — pure helpers ported from `frontend/src/utils`.
- Add a screen: create `src/screens/X.jsx`, add its row to `scripts/gen-routes.py` and run it (writes `src/app/<web path>.jsx`; protected routes are wrapped with `withAuth` from `src/components/common/RequireAuth.jsx`).
- Page shell: `<Screen className="bg-…" [bottom={false} when BottomNav] [statusBg="bg-…" statusBar="light" for coloured headers]>` → sticky header → `<Scroll className="flex-1">` body → optional footer bar.
- Styling: web `className` strings on the primitives in `src/components/ui/primitives.jsx`; colors/fonts come only from `tailwind.config.js`.
- `scripts/` holds the one-off conversion helpers (web2rn codemod, fixups, screenify, modalify, gen-routes, gen-assets). They are dev tools, not part of the app.

## 5. Auth
- Same contract as web: `POST /auth/login` (`email`=phone or email, `otp` or `password`, `expectedRole:'customer'`) → `{ token, data:user }`.
- Token in SecureStore key `token`; user JSON in AsyncStorage key `user`. Storage is hydrated into memory before first render (`src/lib/storage.js`), so stores read synchronously like web localStorage.
- No refresh token (web has none). JWT lifetime = backend `JWT_EXPIRE`.
- Session expiry: any 401 on a non-`/auth/*` request made with a token → `authStore.logout()` → `/user/login`.
- Logout: removes device push token (`/notifications/fcm-token/remove`), clears storage, goes to `/user/login`.

## 6. API layer
`import api from '../lib/api'` — axios instance, baseURL from `src/lib/config.js` (`EXPO_PUBLIC_API_URL`), 20 s timeout, Bearer header, GET de-dupe like web. Errors propagate as axios errors; screens show the web's error/empty states. No auto-retry of mutations.

## 7. Web → native decisions
- Styling: `src/components/ui/primitives.jsx` — `Box`(div) `Txt`(text) `Btn`(button/link) `Img`(img, expo-image; `autoHeight` for h-auto) `I`(lucide icon, inherits text color) `Input` `Scroll`. They take the web `className` verbatim; `src/lib/tw.js` maps it (drops sm:/md:/hover: variants, `flex`=row, grid via `grid-cols-N`, space-* → gap, shadows/rings → boxShadow, gradients → experimental_backgroundImage, blur → filter, tracking in em). Text styles inherit through Box like CSS. Fonts: weight → font file (Poppins_700Bold …) in `finalizeText`.
- Modals/sheets/dropdowns: `src/components/ui/Sheet.jsx` (`Sheet` bottom sheet, `Dialog` centered) — RN Modal, Android back closes it.
- framer-motion → RN `Animated` (`FadeSwap`, `Spin`), only where the web animates.
- Navigation feel: no screen transition animation (`animation: 'none'`, like the web), hidden screens frozen (`freezeOnBlur`). The 4 bottom-nav roots live in a tab navigator `src/app/user/(tabs)/` (`expo-router/js-tabs`, tab bar hidden because each screen renders the web BottomNav), so tab switches show the mounted screen instantly. Going to a tab root from deeper screens uses `router.dismissTo` (in `nav.js` and BottomNav) so no duplicate tab screens pile up. Back on a non-Home tab returns to Home.
- Navigation: `src/lib/nav.js` gives react-router API (`useNavigate`, `useLocation().state`, `useParams`); route files mirror web paths; `state` kept in memory keyed by `__s` param.
- Toast: `src/lib/toast.jsx` = react-hot-toast API + web CustomToastCard look, one at a time.
- Storage: localStorage → `src/lib/storage.js` (sync after hydration), zustand persist uses `zustandStorage`; persisted stores rehydrated in `store/bootstrap.js`.
- Maps: react-native-maps (Google provider). Places search: Google Places REST (`lib/places.js`, `components/shared/PlacesSearch.jsx`) replacing the JS Autocomplete widget. Reverse geocode tiers same as web (`utils/reverseGeocode.js`).
- Location: expo-location (`lib/location.js`), foreground, asked on first use (same screens as web).
- Push: expo-notifications device FCM token → `PUT /user/fcm-token {platform:'mobile'}` (same call the Flutter wrapper token used); taps open `data.url`.
- Payments: react-native-razorpay (native SDK, new-arch capable v3).
- Google login: @react-native-google-signin (webClientId = web OAuth client) → `POST /auth/google-login {credential:idToken}`.
- Realtime: one shared socket (`store/socketStore.js`); NotificationContext reuses it (web opened a second socket).
- NotificationProvider wraps `/user/*` in `app/user/_layout.jsx`.
- `<input type=file>` → `src/lib/files.js` (`pickImage({camera, multiple, limit})`, `pickDocument`, `readAsDataUrl`); returns `{uri,name,type,size}` objects that go straight into FormData.
- `<input type=date|time>` → `src/components/ui/DateField.jsx` (same `YYYY-MM-DD` / `HH:MM` values as web).
- `<select>` → `src/components/ui/Select.jsx` (`options=[{value,label}]`, opens a sheet).
- `dangerouslySetInnerHTML` (CMS, FAQ, legal) → `src/components/ui/HtmlView.jsx` (small HTML→Text renderer; per-tag classes via `tagClassNames`).
- `navigator.share` / clipboard → `src/lib/share.js` (`shareLink`, `copyText`, `webUrl` → public web URL); `alert/confirm` → `src/lib/alert.js`; `prompt` → `src/lib/prompt.jsx`.
- R8 minify/resource shrinking are OFF for release (`expo-build-properties`): with SDK 58's default minify ON, the release APK crashed at launch (Room `WorkDatabase_Impl` for WorkManager, pulled in by Firebase, was stripped). Do not turn it back on without keep rules and a device test.
- Release builds strip `console.log/info/debug` (babel `transform-remove-console`, `babel.config.js`); warn/error stay.
- Bundled web images were downscaled/palette-encoded (assets 19 MB → 4.7 MB). Originals live in `frontend/public` and `frontend/src`.

## 8. Backend changes
None. Backend already accepts Bearer tokens, requests without Origin (CORS), and stores mobile FCM tokens (`PUT /user/fcm-token` with `platform:'mobile'` → `fcmTokenMobile`).

## 9. Commands
- Install: `npm install`
- Run (dev build needed for native modules): `npx expo run:android` or `npx expo start`
- Lint: `npx expo lint`
- Doctor: `npx expo-doctor`
- JS bundle check: `npx expo export --platform android`
- Release APK (EAS, account `amankuril`, project `sewzella-user` id in app.config.js): `npm run build:apk`. It sets `EAS_NO_VCS=1 EAS_PROJECT_ROOT=<mobile-user>` so ONLY this folder is uploaded (filtered by `.easignore`). Without it EAS archives the whole git repo, including `backend/.env`. Never set NODE_ENV in eas.json (npm would skip packages Babel needs). Copy finished APKs to `../releases/`. `eas.json` production = APK, `credentialsSource: local` → reads `credentials.json` + `credentials/upload-keystore.jks` (both gitignored, never commit).
- Local signed release APK (no EAS): `npx expo prebuild -p android --clean`, then in `android/`: `./gradlew assembleRelease -Pandroid.injected.signing.store.file=… -Pandroid.injected.signing.store.password=… -Pandroid.injected.signing.key.alias=upload -Pandroid.injected.signing.key.password=…` (values from credentials.json). Output: `android/app/build/outputs/apk/release/app-release.apk`.

## 10. Known issues
- Native push: `google-services.json` (Firebase project sewzella-26c9e, shared by all four Sewzella apps) is at `mobile-user/google-services.json`; delivery is Built, not tested until a logged-in device test.
- The Firebase file has no Android OAuth client (client_type 1) for com.sewzella.user, so Google sign-in will fail with DEVELOPER_ERROR until the upload-key SHA-1 is added to the `com.sewzella.user` Android app in Firebase.
- Default-OTP bypass is off on production → no test login; login-dependent flows are Built, not tested.
- Google sign-in on Android needs an Android OAuth client in the same Google Cloud project with package `com.sewzella.user` + the upload key SHA-1 (`45:5B:6F:7E:21:24:8A:ED:60:E7:E7:44:D4:23:10:02:5C:4D:BF:9D`), plus the Play App Signing SHA-1 for Play installs.
- Long lists render inside ScrollView (same as web: no pagination on these endpoints). Move Orders/Store/ActivityHistory to FlatList if real accounts have hundreds of rows.
- `expo-doctor`: 19/20; the React Native Directory check failed with a server error (network), not a project problem.

## 11. Assumptions
- No Flutter wrapper: package `com.sewzella.user` (Play link), name `Sewzella`, icon/splash from `frontend/public/sewzella_logo.jpeg`.
- versionCode 10 is assumed higher than the Play Store build of 1.0.2; bump if Play rejects it.
- Production API is `https://sewzella.com/api/v1` (env files only hold localhost).
- Launch route: logged-in → `/user`; logged-out → `/welcome` (onboarding), matching the web's public entry.
