const http = require("http");
const https = require("https");
const { isDefaultOtpEnabled } = require("./envUtils");

/**
 * Service to send SMS via SMSIndiaHub Gateway
 * Credentials are read dynamically ONLY from process.env
 */
const sendSMS = async (phoneNumber, messageText) => {
  try {
    // If USE_DEFAULT_OTP is true, don't send real SMS
    if (isDefaultOtpEnabled()) {
      console.log(`⚠️ [SMS] USE_DEFAULT_OTP is true. Skipping real SMS to ${phoneNumber}.`);
      return true;
    }

    const apiKey = (process.env.SMS_INDIA_HUB_API_KEY || process.env.INDIA_SMS_HUB_API_KEY || "").replace(/['"]/g, "").trim();
    const senderId = (process.env.SMS_INDIA_HUB_SENDER_ID || process.env.INDIA_SMS_HUB_SENDER_ID || "BGADEC").replace(/['"]/g, "").trim();
    const templateId = (process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID || process.env.INDIA_SMS_HUB_TEMPLATE_ID || "").replace(/['"]/g, "").trim();
    const username = (process.env.SMS_INDIA_HUB_USERNAME || process.env.INDIA_SMS_HUB_USERNAME || "").replace(/['"]/g, "").trim();
    const baseUrl = (process.env.SMS_INDIA_HUB_BASE_URL || process.env.INDIA_SMS_HUB_BASE_URL || "http://cloud.smsindiahub.in/api/mt/SendSMS").replace(/['"]/g, "").trim();

    if (!apiKey) {
      console.warn("⚠️ [SMSIndiaHub] API key is not defined in process.env. SMS sending skipped.");
      return false;
    }

    // Clean phone number: extract last 10 digits
    const digitsOnly = String(phoneNumber || "").replace(/[^\d]/g, "");
    const cleanNumber = digitsOnly.slice(-10);

    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      console.warn(`⚠️ [SMSIndiaHub] Invalid 10-digit mobile number: ${phoneNumber}`);
      return false;
    }

    const payloadObj = {
      Account: {
        APIKey: apiKey,
        SenderId: senderId,
        Channel: "2",
        DND: "0",
        Route: "2"
      },
      Messages: [
        {
          Number: cleanNumber,
          Text: messageText
        }
      ]
    };

    if (username) {
      payloadObj.Account.User = username;
    }

    if (templateId) {
      payloadObj.Account.DLTTemplateId = templateId;
      payloadObj.Account.TemplateId = templateId;
      payloadObj.Messages[0].DLTTemplateId = templateId;
    }

    console.log(`📱 [SMSIndiaHub] Dispatching SMS to ${cleanNumber} (SenderID: ${senderId}, TemplateID: ${templateId})...`);

    let responseData = "";
    if (typeof fetch === "function") {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadObj)
      });
      responseData = await res.text();
    } else {
      const bodyString = JSON.stringify(payloadObj);
      const urlObj = new URL(baseUrl);
      const client = urlObj.protocol === "https:" ? https : http;
      
      responseData = await new Promise((resolve, reject) => {
        const req = client.request({
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyString)
          }
        }, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        });
        req.on("error", reject);
        req.write(bodyString);
        req.end();
      });
    }

    console.log(`✅ [SMSIndiaHub] Response for ${cleanNumber}:`, responseData);
    return true;
  } catch (error) {
    console.error("❌ [SMSIndiaHub] Error sending SMS:", error.message);
    return false;
  }
};

/**
 * Helper to send OTP SMS
 * @param {string} phoneNumber - Target phone number
 * @param {string} otp - Generated OTP code
 */
const sendOTP = async (phoneNumber, otp) => {
  const defaultTemplate = "Welcome to the OyeChotuu powered by Appzeto.Your OTP for registration is {OTP}.BGADEC";
  const rawTemplate = (process.env.SMS_INDIA_HUB_MESSAGE_TEMPLATE || process.env.INDIA_SMS_HUB_MESSAGE_TEMPLATE || defaultTemplate).replace(/^["']|["']$/g, "").trim();
  
  // Dynamically replace {OTP}, {otp}, or {#var#} placeholder with generated OTP code
  const message = rawTemplate.replace(/\{OTP\}|\{otp\}|\{#var\#\}/g, otp);
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTP,
};
