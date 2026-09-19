const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const isDefaultOtpEnabled = () => {
  let rawVal = process.env.USE_DEFAULT_OTP;
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      if (envConfig.USE_DEFAULT_OTP !== undefined) {
        rawVal = envConfig.USE_DEFAULT_OTP;
      }
    }
  } catch (e) {
    console.error("Error reading .env for USE_DEFAULT_OTP:", e.message);
  }
  const cleanVal = String(rawVal || '').toLowerCase().trim().replace(/['"]/g, '');
  return cleanVal === 'true' || cleanVal === '1';
};

module.exports = { isDefaultOtpEnabled };
