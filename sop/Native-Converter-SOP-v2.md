# Native Converter SOP v2 — MERN Web App → Android App (Expo, local builds)

Version 2 · November 2026 · replaces "Native Covertor" v1

## What changed from v1

| Area | v1 | v2 |
|---|---|---|
| Release build | EAS cloud build (`eas build`) | **Local Gradle build on this machine**. No Expo account, no monthly build limit, no source upload. |
| Questions | Never ask, except 3 hard stops | **One question round at the start** (keystore, test login, missing files), then run without stopping |
| Signing | EAS manages the keystore | **The project's existing upload keystore**, verified by SHA-1 after every build |
| Flutter wrapper | Required | Optional. Without it, identity comes from the Play Store listing and the user. |
| Styling | StyleSheet + theme file | Tailwind web apps: **keep the web class strings** through a Tailwind→RN engine (faster, closer match). Other apps: StyleSheet + theme. |
| Screen conversion | Hand-written | **Codemod first, then review**, with automated scans for the bugs codemods leave |
| Output | APK link | `releases/<app>-v<version>-<code>.apk` + SHA-256 + signing SHA-1 |
| Lessons | — | Section 18: pitfalls that cost time on the first conversion |

Why Expo instead of bare React Native CLI: Expo's native modules and config plugins (push, location, camera, pickers, Firebase file, permissions) need no hand-written Android code, and `expo prebuild` regenerates the `android/` folder from config. A bare project would need manual Gradle/Manifest work for every native library. Only the build step moves off the cloud.

---

# Part A — Operator checklist (the human, before starting)

1. In Section 0 below, fill in the **target app** (user / driver / delivery / partner …).
2. The web frontend and backend **source** (not dist/build) are in one repository.
3. The deployed **HTTPS backend URL** is in the frontend env or deployment config (not localhost).
4. Have these ready to answer the agent's first question round:
   - **Upload keystore**: `.jks` file path, alias, store password, key password. (Use the same keystore as the old app, or Play will reject the update.)
   - **Test login** for the target role (phone + OTP / password). If the backend has a bypass OTP, confirm it is enabled on production.
   - **`google-services.json`** containing the target package (needed for push and Google sign-in).
   - Package name and current Play version, if there is no Flutter wrapper in the repo.
5. Build machine: JDK 17, Android SDK + build-tools + NDK (installed by Android Studio), `ANDROID_HOME` set, Node LTS. **16 GB RAM recommended**; with 8 GB, never run the emulator while Gradle is building.

---

# Part B — Master prompt (paste to the agent)

You are a senior React Native engineer. Convert one part of the existing React web frontend in this repository into a native Android app built with **Expo**, and build the release APK **locally**. This is a conversion, not a redesign: the existing web product at phone width is the specification.

## 0. Input

- **Target app:** `<e.g. user app / driver app / delivery app>`

Build exactly one app per run.

## 1. Question round, then no stops

**Step 1 — Discover (read-only, ~10 min).** Find everything in Section 4 yourself. Test the bypass OTP against production with a **read-only** request if possible (for example a login attempt with a wrong user returns a clear error). Never send a real SMS or create data before asking.

**Step 2 — Ask once.** Ask all of these in **one** message (multiple choice where possible), and only those you could not answer from the repository:

1. Target app, if not stated and not obvious.
2. Upload keystore: path, alias, store password, key password (or "generate a new one" for a brand-new app only).
3. Test login for the target role, or permission to register one.
4. `google-services.json` / missing public keys.
5. Package name and version, if there is no Flutter wrapper or Play listing.
6. Scope doubts (screens reachable by several roles).

**Step 3 — Run to the end without stopping.** After the answers, never stop for a question again. If something is still missing, mark only that feature **Blocked**, record it, and continue.

**Hard stops** (report and stop only for these): no frontend or backend source; no deployed HTTPS backend that responds; no keystore for an app that already exists on Play.

## 2. Preconditions — report as a short list before coding

1. Target app known.
2. Frontend and backend source present (Flutter wrapper optional).
3. HTTPS backend URL found and responding (`curl` a public GET).
4. Credentials present per feature (missing ones = that feature Blocked).
5. Test login works, or checks that need it will be "Built, not tested".
6. Local build toolchain: `java -version` (17), `$ANDROID_HOME`, `sdkmanager --list_installed` (platform, build-tools, NDK). If missing, the conversion continues; the build step reports the missing piece.

## 3. Scope

- Only screens, flows and APIs of the target role (check the web router guards).
- Never the admin panel or other desktop panels, never another app's screens.
- List excluded screens in the checklist so the user can confirm.

## 4. Discover yourself

Write each at the top of `CONVERSION_CHECKLIST.md` with its source file:

- Folders: web frontend, backend, Flutter wrapper (if any). New app folder: `mobile-<target>/`.
- App name, Android **package**, version: Flutter wrapper (`AndroidManifest.xml`, `build.gradle`, `pubspec.yaml`) → else Play Store link in the web code → else ask (Step 2).
- **versionCode must be higher than the version on Play.**
- Icon and splash: wrapper resources → else the web's logo files.
- API base URL: the deployed production URL from env/deploy config. Put it in `.env` as `EXPO_PUBLIC_API_URL`.
- Public keys only (maps key, payment **public** key, OAuth web client ID, Firebase client file). **Never** copy backend secrets (DB URL, JWT secret, payment secret, SMTP/SMS keys, service accounts).
- Test login: the answer from Step 2. Record **where** it is, never the value, and never in app code.

## 5. Fixed decisions

- Expo latest stable SDK, **JavaScript only**, Expo Router (`src/app/`), own `package.json`. Never touch the web's or backend's dependencies.
- Read `package.json` → the Expo major version → that version's docs before using any Expo API. Install with `npx expo install`.
- Android only; nothing that blocks iOS later.
- Native modules come from Expo config plugins in `app.config.js`. **Never hand-edit `android/`**; it is generated by `expo prebuild` and gitignored.
- No WebView of the web app. A WebView is allowed for one third-party flow only (for example a YouTube embed or a payment page without a native SDK).
- Continued run: if `MEMORY.md` and `CONVERSION_CHECKLIST.md` exist, read `MEMORY.md` first and continue from the first unfinished row.

## 6. MEMORY.md — required, updated as you go

Sections: 1 what this app is, 2 discovered inputs, 3 stack, 4 folder structure and conventions (how to add a screen), 5 auth, 6 API layer, 7 web→native decisions, 8 backend changes, 9 commands (install, run, lint, **local release build**), 10 known issues, 11 assumptions.
No secrets: say which file holds a credential, never its value. Facts, not history. `CONVERSION_CHECKLIST.md` holds per-screen and per-API status.

## 7. Audit first

Before app code, add to `CONVERSION_CHECKLIST.md`: every route with its guard; every API call (method, path, payload, response); the real auth contract (token or cookie, storage, refresh, logout, expiry); design tokens and assets; native capabilities (push, location, camera, files, payments, deep links, splash, back button); web-only APIs in use; state and data-fetching approach; excluded screens.

## 8. UI source of truth

The web app rendered at **360–412 px** wide. Build the mobile layout and ignore desktop variants. Reproduce hierarchy, navigation pattern, colors, fonts, sizes, spacing, radius, shadows, icons, images, texts, loading/empty/error/success states, and existing animations. Add nothing (no new screens, dark mode, biometrics, analytics, onboarding). When unsure, do not change it.

## 9. Fast conversion method

Work in this order. It is what makes the conversion fast.

**9.1 Foundation (build once, reuse for every screen).** If a previous conversion exists in this repository (another `mobile-*/` folder), **copy its foundation** and adapt it instead of rewriting:

- `src/lib/`: `config.js` (EXPO_PUBLIC_* values), `storage.js` (SecureStore for the token, AsyncStorage for the rest, hydrated into memory before first render so stores read synchronously like localStorage), `api.js` (one axios client: base URL, Bearer header, 20 s timeout, 401 → logout event), `nav.js` (react-router API on top of Expo Router: `useNavigate`, `useLocation().state`, `useParams`), `toast`, `alert/confirm`, `prompt`, `files.js` (image/document picker returning `{uri,name,type,size}` for FormData), `share.js`, `location.js`, `push.js`, payment SDK adapter with the web's API.
- **Tailwind web apps:** a Tailwind→RN engine (twrnc + `tailwind.config.js` with the web tokens) and primitives `Box` (div), `Txt` (text), `Btn` (button/link), `Img`, `I` (icon), `Input`, `Scroll` that accept the **web `className` string unchanged**: text styles inherit like CSS, `hover:`/`md:` variants are dropped, `flex` = row, `space-*` → gap, gradients/shadows/blur map to RN styles. Non-Tailwind apps: StyleSheet plus one theme file.
- UI kit: `Screen` (safe area + status bar colour + keyboard), `Sheet`/`Dialog` (RN Modal; Android back closes), `Select`, `DateField`, `HtmlView` (CMS/FAQ HTML), `Spin`, `ErrorBoundary`, `RequireAuth`.
- Stores: port the web's stores (zustand/redux/context) as-is on top of the storage adapter.

**9.2 Codemod every screen in one batch.** A Babel script converts JSX: `div`→`Box`, text → `Txt`, `button`/`Link`→`Btn`, `img`→`Img`, lucide/heroicons → the RN icon package, `onClick`→`onPress`, `onChange(e.target.value)`→`onChangeText`, `overflow-auto` → `Scroll`, drops DOM-only attributes. A fixups pass rewrites `window.*`, `localStorage`, `alert/confirm`, `import.meta.env`, `window.open`, clipboard, `<select>`.

**9.3 Review each screen against the web** (fixed checklist):

1. Page shell: `<Screen>` → sticky header → `<Scroll className="flex-1">` → optional footer bar. Coloured header → `statusBg` + light status bar. `fixed bottom-0` bars become a static footer below the scroll.
2. Web overlays (`fixed inset-0`) → `Sheet` or `Dialog`.
3. Every submit button that relied on `<form onSubmit>` gets `onPress`.
4. `<input type=file|date|time>`, `<select>`, `dangerouslySetInnerHTML`, `navigator.share`, `FileReader`, `URL.createObjectURL`, `scrollIntoView`, script loaders → native helpers from 9.1.
5. Long lists (unbounded API lists) → FlatList.

**9.4 Automated scans after every batch** (all must be clean):

- `npx expo lint` with `no-undef` and import resolution as **errors**.
- AST scan: no lowercase JSX elements (`div`, `span`, `mark`, `style`, `svg` …). Any DOM element crashes on Android.
- AST scan: no `dangerouslySetInnerHTML`, `onClick`, `htmlFor`.
- AST scan: every `Btn` has `onPress` (or is decorative on the web too).
- grep: `window.`, `document.`, `navigator.`, `localStorage`, `e.target.files`, `FileReader`, `__TODO`.
- `npx expo export --platform android` succeeds.

## 10. Web-only → native (reference)

| Web | Native |
|---|---|
| localStorage / sessionStorage | SecureStore (token) + AsyncStorage, hydrated before first render |
| Tailwind / CSS | Web class strings via the Tailwind→RN engine, or StyleSheet + theme |
| dialog / select / dropdown | `Sheet`, `Dialog`, `Select` styled like the web |
| Fonts / icons | Same font files (`@expo-google-fonts/*`); RN package of the same icon set |
| Charts | SVG charts (react-native-svg), same type and colors |
| Socket.io | socket.io-client (one shared socket) |
| Google Maps JS | react-native-maps (Google provider) + Places/Geocoding/Directions REST |
| Geolocation | expo-location, foreground, asked on first use |
| `<input type=file>` | expo-image-picker (camera/gallery), expo-document-picker; compress with expo-image-manipulator |
| `<input type=date/time>` | @react-native-community/datetimepicker |
| HTML content | `HtmlView` (small renderer) |
| navigator.share / clipboard | RN `Share`, expo-clipboard |
| Video / YouTube | expo-video; WebView only for the YouTube embed |
| Web push (Firebase) | expo-notifications device FCM token → the backend's existing token endpoint |
| Razorpay / Stripe checkout.js | Gateway native SDK behind an adapter with the web's API |
| Google OAuth | @react-native-google-signin with the **web** client ID |

Add a dependency only when this table or a real feature needs it. Request only the permissions in use; block the rest in `app.config.js` (`blockedPermissions`).

## 11. Mobile behavior (every screen)

Request timeout and the web's error state with retry; never auto-retry POST/PUT/PATCH/DELETE. Keyboard never covers the input; correct keyboard types; web validation unchanged; no double submit. Android back closes modal → keyboard → screen; never logs out. Permissions on first use; denial shows a message. Push (if the web has it): register, refresh, foreground/background/killed taps. One app-level error boundary. Release build strips `console.log/info/debug` (`babel-plugin-transform-remove-console`; warn/error kept). Nothing secret in `EXPO_PUBLIC_*`.

## 12. Backend

Read-only. Only the smallest additive, backward-compatible change when native cannot work otherwise (push token field, header token, CORS without Origin). List every change. Anything larger → feature Blocked with the needed change described.

## 13. App structure

One API client, the web's state approach, one theme/token source, shared components, HTTPS only, no mock data or TODOs for existing features.

## 14. Performance (once, before the build)

- FlatList for unbounded lists; stable keys.
- No duplicate API calls per screen; no polling the web does not do.
- **Bundled images:** downscale to display size (icons ≤ 512 px, photos ≤ 1080 px) and palette-encode PNGs (`quantize(256)`). Always keep the smaller of original and new; never re-save a palette PNG as RGBA, it doubles the size.
- Listeners, timers and sockets cleaned up.
- Remove unused dependencies and permissions (check every `dependencies` entry is imported; keep Expo Router peers).

## 15. Status per row

**Verified** (you ran it and saw it work) · **Built, not tested** (needs a device or login) · **Blocked** (reason + what is needed). Never mark Verified what you did not run.

## 16. Checks before the build (in order)

1. Lint clean, AST scans clean (9.4).
2. `npx expo-doctor`: all checks pass, except network-only failures (record them).
3. `npx expo export --platform android` succeeds.
4. API checks against production: GET freely; writes only on the test account's own data; never a real payment, refund, SMS or notification to real users.
5. Device test list written in `CONVERSION_CHECKLIST.md` (login, logout, restart keeps session, session expiry, no network, uploads, back button, icon/splash, background/foreground).

## 17. Local release build (always local; never EAS unless the user asks)

**17.1 One-time setup in the app folder** (all gitignored):

```
credentials/upload-keystore.jks
credentials/keystore.properties    # storeFile, storePassword, keyAlias, keyPassword
google-services.json               # if push / Google sign-in
```

`.gitignore` must contain `/android`, `credentials/`, `*.jks`, `*.keystore`, `credentials.json`. Add `releases/*.apk` and `releases/*.aab` to the root `.gitignore`.

**17.2 Build script** `scripts/build-release.sh` (run with `bash scripts/build-release.sh [apk|aab]`):

```
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TYPE="${1:-apk}"
P=credentials/keystore.properties
prop() { grep "^$1=" "$P" | cut -d= -f2-; }
NAME=$(node -p "require('./app.config.js').expo.slug")
VER=$(node -p "require('./app.config.js').expo.version")
CODE=$(node -p "require('./app.config.js').expo.android.versionCode")
STAMP=android/.prebuild-stamp
SUM=$(cat app.config.js package-lock.json google-services.json 2>/dev/null | sha1sum | cut -c1-40)
if [ ! -d android ] || [ "$(cat $STAMP 2>/dev/null)" != "$SUM" ]; then
  npx expo prebuild --platform android --clean --no-install
  printf '\norg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g\norg.gradle.parallel=true\norg.gradle.caching=true\n' >> android/gradle.properties
  echo "$SUM" > $STAMP
fi
TASK=assembleRelease; [ "$TYPE" = aab ] && TASK=bundleRelease
# read signing values before cd (the properties path is relative to the app folder)
KS="$PWD/$(prop storeFile)"; SP="$(prop storePassword)"; KA="$(prop keyAlias)"; KP="$(prop keyPassword)"
[ -f "$KS" ] || { echo "Keystore not found: $KS"; exit 1; }
(cd android && ./gradlew "$TASK" \
  -PreactNativeArchitectures="${ABIS:-arm64-v8a,armeabi-v7a}" \
  -Pandroid.injected.signing.store.file="$KS" \
  -Pandroid.injected.signing.store.password="$SP" \
  -Pandroid.injected.signing.key.alias="$KA" \
  -Pandroid.injected.signing.key.password="$KP")
mkdir -p ../releases
if [ "$TYPE" = aab ]; then
  OUT="../releases/$NAME-v$VER-$CODE.aab"
  cp android/app/build/outputs/bundle/release/app-release.aab "$OUT"
else
  OUT="../releases/$NAME-v$VER-$CODE.apk"
  cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
  BT=$(ls -d "${ANDROID_HOME:-$HOME/Android/Sdk}"/build-tools/* | sort -V | tail -1)
  "$BT/apksigner" verify --print-certs "$OUT" | grep -E "SHA-1|SHA-256"
fi
sha256sum "$OUT"
```

**17.3 Rules that keep it fast and reliable**

- **Only re-run prebuild when config changed** (the script's stamp does this). Adding `google-services.json`, a config plugin or a native package changes the stamp and regenerates `android/`; a stale `android/` silently drops them.
- Build **arm64-v8a + armeabi-v7a** only for release (all real phones). Add `x86_64` only for emulator testing.
- Keep the Gradle daemon and cache; the first build takes 15–40 min (native C++), later builds a few minutes.
- Run the build in the background and watch the log for **every** terminal state (`BUILD SUCCESSFUL`, `BUILD FAILED`, `FAILURE`, `error:`, `Killed`), not only success.
- Never run the emulator during a Gradle build on a machine with less than 16 GB RAM.
- To stop a build, kill by PID (`pgrep -f gradlew` → `kill <pid>`). `pkill -f "<pattern>"` inside a shell command also kills that shell itself.
- After the build, `apksigner` must show the **expected upload-key SHA-1** (record it in MEMORY.md). If not, the APK cannot update the Play app; fix the signing before anything else.
- If the build fails, fix the cause and retry; after two failed attempts on the same error, stop and report the error.
- Signing passwords are passed on the command line from the gitignored properties file. Never write them into `app.config.js`, `gradle.properties`, MEMORY.md or the checklist.

**17.4 Smoke test — mandatory before handing over** (emulator or USB device): `adb uninstall <package>`, then `adb install releases/<file>.apk` (build with `ABIS=arm64-v8a,armeabi-v7a,x86_64` for an x86_64 emulator), launch, check `adb logcat` for `FATAL EXCEPTION`, and take screenshots (`adb exec-out screencap -p > shot.png`) of splash, welcome/login and one public screen. Compare them with the web at 390 px.

**17.5 If the user explicitly asks for EAS cloud instead:** run with `EAS_NO_VCS=1 EAS_PROJECT_ROOT=<absolute app folder>` and an `.easignore`, or EAS uploads the **whole git repository, including backend `.env` files**. Never set `NODE_ENV` in `eas.json` (npm then skips packages Babel needs). Dynamic `app.config.js` needs `extra.eas.projectId` and `owner` written by hand after `eas init`.

## 18. Pitfalls from the first conversion (check every one)

| Pitfall | Fix |
|---|---|
| Bypass OTP present in code but disabled on production | Check it in Step 1; ask for a real test login in the question round |
| Submit buttons inside web `<form>` do nothing on native | Scan 9.4: every `Btn` has `onPress` |
| `<mark>`, `<style>`, `<svg>` left in JSX crash the screen | AST scan for lowercase JSX |
| `dangerouslySetInnerHTML` renders nothing | `HtmlView` |
| Regex built from search input crashes on `(` | Escape user input before `new RegExp` |
| Nested pressables: the inner one swallows the tap | Inner decorative button becomes `Box` |
| Absolute icons over inputs block taps | Icons default to `pointerEvents: 'none'` |
| Sticky header marker inserted the scroll in the wrong place | Locate the header element by its opening tag, not a class substring |
| `babel-preset-expo` only nested under `expo` | Install it directly (`npx expo install babel-preset-expo`) |
| Palette PNGs grew 2× after resizing | Quantize to 256 colours; keep the smaller file |
| Stale `android/` folder after adding Firebase | Prebuild stamp in the build script |
| Cloud build uploaded the monorepo with secrets | Build locally; if EAS, set the project root (17.5) |
| Release APK crashed at launch: SDK 58 turns R8 minify on by default and it stripped Room's `WorkDatabase_Impl` (WorkManager via Firebase) | Set `enableMinifyInReleaseBuilds: false` and `enableShrinkResourcesInReleaseBuilds: false` in `expo-build-properties`, or add keep rules and re-test |
| `adb install -r` over an older debug build fails (different signing key), so the old debug app gets tested by mistake | `adb uninstall <package>` first; confirm `dumpsys package` has no `DEBUGGABLE` flag and the new `lastUpdateTime` |
| `google-services.json` lacks an Android OAuth client for the package | Google sign-in shows DEVELOPER_ERROR until the upload-key SHA-1 (and the Play app-signing SHA-1) is added in Firebase |

## 19. Final report (short)

1. Target app and discovered inputs with sources.
2. Screens in scope / converted / left out (with reason).
3. APIs found / integrated / verified.
4. Auth in the app.
5. Native capabilities and how each was carried over.
6. Native replacements and dependencies added, with why.
7. Backend changes (or none).
8. Assumptions.
9. Verified / Built-not-tested / Blocked lists.
10. Build: `releases/<file>.apk`, its SHA-256, the signing SHA-1 (must match the old app), and the exact rebuild command.
11. What the user must do next: device test list; SHA-1 in Firebase / Google Cloud for maps, Google sign-in and push; Play upload (AAB) if needed.
12. Confirmation that `MEMORY.md` is complete and current.
