const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let app;
if (!getApps().length) {
  let serviceAccount;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT environment variable is not defined.');
    }
  } catch (err) {
    console.error('[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
  }

  if (serviceAccount) {
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    app = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[Firebase] Admin SDK initialized successfully with project:', serviceAccount.project_id);
  } else {
    console.warn('[Firebase] Initialized without credentials.');
    app = initializeApp();
  }
} else {
  app = getApp();
}

const getFirebaseMessaging = () => {
  return getMessaging(app);
};

module.exports = {
  app,
  getFirebaseMessaging,
  getMessaging: getFirebaseMessaging
};
