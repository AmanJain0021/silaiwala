#!/usr/bin/env python3
"""Generates src/app route files for the tailor (partner) app from frontend/src/routes.jsx.

Each route: (file under src/app, import path from src, export name, wrappers)
  wrappers: 'auth'    -> TailorAuthLayout (login/signup/forgot)
            'signup'  -> TailorAuthLayout with the wide signup width
            'any'     -> TailorProtectedRoute requiredStatus=[APPROVED, PENDING_APPROVAL, REJECTED]
            'ok'      -> TailorProtectedRoute requiredStatus=[APPROVED]
            'layout'  -> TailorLayout (header + bottom nav)
            'raw'     -> TailorLayout without its own scroll (screen scrolls itself)
"""
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src')
ROUTES = [
    ('partner/welcome.jsx', 'screens/PartnerLanding', 'default', []),
    ('partner/login.jsx', 'screens/Login', 'default', ['auth']),
    ('partner/signup.jsx', 'screens/Registration', 'default', ['signup']),
    ('partner/forgot-password.jsx', 'screens/ForgotPassword', 'default', ['auth']),
    ('partner/legal/[type].jsx', 'screens/PartnerLegal', 'default', []),
    ('partner/under-review.jsx', 'screens/StatusPages', 'UnderReview', []),
    ('partner/rejected.jsx', 'screens/StatusPages', 'RejectedPage', []),
    ('partner/verification.jsx', 'screens/VerificationStatus', 'default', ['any', 'layout']),
    # bottom-nav roots (kept mounted in a tab navigator)
    ('partner/(tabs)/index.jsx', 'screens/Overview', 'default', ['ok', 'layout']),
    ('partner/(tabs)/orders.jsx', 'screens/Orders', 'default', ['ok', 'layout']),
    ('partner/(tabs)/wallet.jsx', 'screens/TailorEarnings', 'default', ['ok', 'layout']),
    ('partner/(tabs)/products.jsx', 'screens/Products', 'default', ['ok', 'layout']),
    ('partner/(tabs)/settings.jsx', 'screens/ProfileSettings', 'default', ['ok', 'layout']),
    # other layout pages
    ('partner/shop-orders.jsx', 'screens/TailorShopOrders', 'default', ['ok', 'layout']),
    ('partner/portfolio.jsx', 'screens/Products', 'default', ['ok', 'layout']),
    ('partner/earnings.jsx', 'screens/TailorEarnings', 'default', ['ok', 'layout']),
    ('partner/delivery.jsx', 'screens/DeliveryDetails', 'default', ['ok', 'layout']),
    ('partner/subscription.jsx', 'screens/Subscription', 'default', ['ok', 'layout']),
    ('partner/measurements/index.jsx', 'screens/MeasurementList', 'default', ['ok', 'layout']),
    ('partner/measurements/[id].jsx', 'screens/MeasurementDetail', 'default', ['ok', 'layout']),
    ('partner/alterations.jsx', 'screens/TailorAlterations', 'default', ['ok', 'layout']),
    ('partner/custom-designs.jsx', 'screens/TailorCustomDesigns', 'default', ['ok', 'layout']),
    ('partner/issues/index.jsx', 'screens/ReportedIssues', 'default', ['ok', 'layout']),
    ('partner/issues/[issueId].jsx', 'screens/TailorIssueDetails', 'default', ['ok', 'layout']),
    # full-screen views without the layout
    ('partner/orders/[id]/chat.jsx', 'screens/TailorOrderChat', 'default', ['ok']),
    ('partner/notifications.jsx', 'screens/Notifications', 'default', ['ok']),
]

made = 0
for route, mod, export, wrappers in ROUTES:
    if not os.path.exists(os.path.join(ROOT, mod + '.jsx')):
        print('skip (missing):', mod)
        continue
    f = os.path.join(ROOT, 'app', route)
    os.makedirs(os.path.dirname(f), exist_ok=True)
    rel = lambda p: os.path.relpath(os.path.join(ROOT, p), os.path.dirname(f))
    lines = []
    if export == 'default':
        lines.append(f"import Screen from '{rel(mod)}';")
    else:
        lines.append(f"import {{ {export} as Screen }} from '{rel(mod)}';")
    expr = 'Screen'
    if 'layout' in wrappers or 'raw' in wrappers:
        lines.append(f"import {{ withTailorLayout }} from '{rel('components/tailor/TailorLayout')}';")
        expr = f"withTailorLayout({expr}{', { scroll: false }' if 'raw' in wrappers else ''})"
    if 'auth' in wrappers or 'signup' in wrappers:
        lines.append(f"import {{ withTailorAuthLayout }} from '{rel('components/tailor/TailorAuthLayout')}';")
        expr = f"withTailorAuthLayout({expr}{', { isSignup: true }' if 'signup' in wrappers else ''})"
    if 'ok' in wrappers or 'any' in wrappers:
        lines.append(f"import {{ withTailorGuard }} from '{rel('components/tailor/ProtectedRoute')}';")
        lines.append(f"import {{ TAILOR_STATUS }} from '{rel('context/tailor/AuthContext')}';")
        statuses = '[TAILOR_STATUS.APPROVED]' if 'ok' in wrappers else '[TAILOR_STATUS.APPROVED, TAILOR_STATUS.PENDING_APPROVAL, TAILOR_STATUS.REJECTED]'
        expr = f"withTailorGuard({expr}, {statuses})"
    if expr == 'Screen':
        body = lines[0].replace('import Screen from', 'export { default } from').replace(';', ';\n') if export == 'default' else '\n'.join(lines) + '\n\nexport default Screen;\n'
    else:
        body = '\n'.join(lines) + f"\n\nexport default {expr};\n"
    open(f, 'w').write(body)
    made += 1
print('routes written:', made)
