# CONVERSION_CHECKLIST — Sewzella Measurement App

Status: **Verified** (ran it) · **Built, not tested** · **Blocked** (reason)

## Discovered inputs
| Input | Value | Source |
|---|---|---|
| Target | Measurement executive app | user |
| Name / package / version | Sewzella Measurement · com.sewzella.measurement · 1.0.0 (1), temporary | user; `google-services.json`; Play has 1.0.2 live |
| Test login | QA Test Executive Claude, registered without SMS (backend bypass for this role), awaiting admin approval | `auth.controller.js` (`isPartnerRole`, `isAutoActive`) |

## Routes
| Web path | Screen | Wrapper | Status |
|---|---|---|---|
| /executive/login | Login | auth layout | Verified on emulator: renders; sign-in not run in the app |
| /executive/signup | Signup | auth layout | Verified on emulator: renders; not submitted |
| /executive/forgot-password | ForgotPassword | auth layout | Verified on emulator: renders; no OTP sent |
| /executive/pending-approval | PendingApproval | — | Built, not tested |
| /executive/legal/:type | LegalPage category executive | — | Verified on emulator: content loads |
| /executive → /executive/dashboard | Dashboard | guard + layout (tab) | Built, not tested |
| /executive/requests | Requests | guard + layout (tab) | Built, not tested |
| /executive/requests/:id | RequestDetail + measurement sheet | guard, full screen | Built, not tested |
| /executive/wallet | Wallet | guard + layout (tab) | Built, not tested |
| /executive/profile | Profile | guard + layout (tab) | Built, not tested |

## Left out
Desktop sidebar and the unused `LocationBanner` in `MeasurementExecutiveLayout.jsx`. Admin measurement pages belong to the admin panel.

## API (same contracts as web)
Auth: /auth/login · register · check-user · send-otp · verify-otp · reset-password · delete-account.
Executive: /measurement-executive/dashboard · profile · availability · location · requests · requests/:id · accept · reject · generate-otp · verify-otp · upload · complete.
Other: /wallet/dashboard · transactions · withdraw · /upload/public · /upload/bulk · /notifications · /cms/content · /cms/settings.
Socket: join_user_room, join_measurement_executive_room, join_order_room, new_measurement_request, measurement_otp_verified.

## Native capabilities
| Capability | Native | Status |
|---|---|---|
| Location on demand | expo-location | Built, not tested |
| New request alert | swipe (PanResponder) + looping ringtone + socket/FCM/poll | Built, not tested |
| Reference and QR photos | expo-image-picker, multipart upload | Built, not tested |
| Guide video | expo-video, WebView for YouTube | Built, not tested |
| Calls, maps, WhatsApp | Linking | Built, not tested |
| Push | expo-notifications → existing token endpoint | Built, not tested |

## Checks
| Check | Status |
|---|---|
| `npx expo lint` | Verified: 0 errors, 143 warnings |
| AST scans | Verified: clean |
| `npx expo export --platform android` | Verified |
| Release APK v1.0.0 (1): signed with the upload key (SHA-1 455b6f7e21248aed60e7e744d42310025c4dbf9d) | Verified with apksigner |
| Emulator launch, no fatal exception; logged-out dashboard and request links redirect to login | Verified |
| `npx expo-doctor` | Blocked: the session's permission system refused the download |
| QA registration and login (returns role and isActive=false) | Verified against production |

## Device test list
1. Login, kill and reopen stays logged in; before approval the Pending page shows; "Check Approval Status" opens the dashboard after approval.
2. Logout; wrong password message; expired session returns to login; offline toast.
3. Dashboard loads; location refresh; notifications; guide video; keep the QA account Offline.
4. Requests tabs and pull to refresh; Android back from each screen.
5. Using a dedicated test order only: alert ringtone and swipe, accept, measurement sheet, add item and custom measurement, photos, save draft, Save & Continue, OTP, complete.
6. Wallet: history and sheet validation. Submit a withdrawal only with test funds.
7. Profile edit, legal pages, delete dialog (cancel), test push, push with the app closed.
8. Icon, splash, background and foreground.
