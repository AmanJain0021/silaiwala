const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const isDefaultOtpEnabled = () => {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      return envConfig.USE_DEFAULT_OTP === 'true';
    }
  } catch (e) {
    console.error("Error reading .env for USE_DEFAULT_OTP:", e.message);
  }
  return process.env.USE_DEFAULT_OTP === 'true';
};

module.exports = { isDefaultOtpEnabled };
