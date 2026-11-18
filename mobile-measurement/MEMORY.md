# MEMORY — Sewzella Measurement App (Expo)

## 1. What this app is
Native Android app for the **measurement executive** role, converted from the web module `/executive/*`.
- Web: `../frontend/src/modules/measurement-executive`, routes in `frontend/src/routes.jsx`.
- Backend: `../backend/` (`/api/v1/measurement-executive`, read-only for this app). Flutter wrapper: not on this machine.
- Foundation copied from `../mobile-delivery`: primitives, style engine, adapters and scripts.

## 2. Discovered inputs
| Input | Value | From |
|---|---|---|
| App name | Sewzella Measurement | user. The Play listing title is "Sewzella Executive". |
| Package | com.sewzella.measurement | `google-services.json`, Play listing, user |
| Version | 1.0.0 (versionCode 1), temporary by user decision | Play shows 1.0.2, so raise both numbers before any Play upload |
| API base | https://sewzella.com/api/v1 | `.env` (public values) |
| Signing | same upload keystore as the other Sewzella apps (`credentials/`, gitignored); SHA-1 455b6f7e21248aed60e7e744d42310025c4dbf9d | user |
| Test account | "QA Test Executive Claude", registered on production 2026-11-18 at coordinates [0,0] so it is not near real requests. Credentials are not stored in the repo. Needs admin approval. | — |

## 3. Stack
Expo SDK 58, JavaScript, Expo Router (`src/app/`), zustand, axios, socket.io-client, twrnc-based engine (`src/lib/tw.js`). Native: expo-location, expo-image-picker, expo-audio, expo-notifications, expo-video, react-native-webview (YouTube guide only), react-native-svg.

## 4. Folder structure and conventions
- `src/app/executive/(tabs)/_layout.jsx`: guard + `MeasurementExecutiveLayout` around the tab navigator (dashboard, requests, wallet, profile).
- Tab routes use `withExecutiveTab`; auth routes `withExecutiveAuthLayout`; request detail `withExecutiveGuard` (full screen, no bottom nav, as on the web).
- `src/screens/` routed pages; `src/components/executive/` layout, guard, alert, guide; `measurement-sheet/` request detail parts.
- New screen: convert with `scripts/web2rn.js`, run `scripts/fixups.py` (paths must contain `src/`), add a route file, then `node scripts/scan.js`.

## 5. Auth
Same as web: `POST /auth/login` with `{ email, password }`, role must be `measurement_executive`. `executive_token` is in SecureStore; `executive_user` and `user` in AsyncStorage. `authStore.setSession` / `logout` are the only session writers. `isActive === false` shows PendingApproval. 401 → `session_expired` → logout.

## 6. API layer
`src/lib/api.js`; role calls are in `src/store/measurementExecutiveStore.js` (unchanged contracts).

## 7. Web → native decisions
- `MeasurementAuthProvider` is mounted at the root and follows the session. Socket rooms are rejoined on every reconnect (the web joins once).
- New-request alert: root overlay, framer drag → PanResponder, same 45 s timeout and 15 s foreground polling; the ringtone only plays while the alert is shown.
- Pull-to-refresh → RefreshControl. Dashboard keeps its header fixed and scrolls itself.
- Reference photos: Camera or Gallery choice. Guide video: expo-video, YouTube in WebView.
- Signup draft excludes password and Aadhaar. The web stores them in localStorage.
- Desktop sidebar and the unused `LocationBanner` are not ported.

## 8. Backend changes
None.

## 9. Commands
- Install: `npm ci --ignore-scripts` · lint `npx expo lint` · scans `node scripts/scan.js` · bundle `npx expo export --platform android`.
- Release APK: `bash scripts/build-release.sh apk` → `../releases/sewzella-measurement-v<version>-<code>.apk`. Emulator: prefix `ABIS=arm64-v8a,armeabi-v7a,x86_64`. Play upload: `bash scripts/build-release.sh aab`.

## 10. Known issues
- Real request flows are untested: accept, OTP, upload and complete must not be run against real customers.
- `expo-doctor` has not been run (blocked in the build session).
- Web bugs kept for parity: the sample reference photos are submitted with the report if not removed, and accepting from the alert replaces the visible Requests list with the active list.

## 11. Assumptions
- This build is for direct install only until the version is raised above the Play build.
