const admin = require('firebase-admin');

// Parse the service account from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// The private key might have escaped literal \n strings if it was stored inside .env with \\n
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// In newer firebase-admin versions, admin.credential is undefined, use admin.cert
// For older versions, fallback to admin.credential.cert
const credential = admin.credential ? admin.credential.cert(serviceAccount) : admin.cert(serviceAccount);

admin.initializeApp({
  credential
});

module.exports = admin;
