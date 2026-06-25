const fs = require('fs');

const targetFile = 'C:/Users/amanj/OneDrive/silaiwala1/silaiwala/backend/src/modules/orders/controllers/order.controller.js';
let content = fs.readFileSync(targetFile, 'utf8');

// Find verifyPayment
const startStr = 'exports.verifyPayment = asyncHandler(async (req, res, next) => {';
const startIdx = content.indexOf(startStr);
const endStr = 'exports.updateOrderStatus';
const endIdx = content.indexOf(endStr, startIdx);

// We need to capture up to the closing `});` before updateOrderStatus
const beforeEnd = content.lastIndexOf('});', endIdx);

let verifyPaymentOriginal = content.substring(startIdx, beforeEnd + 3);

let modified = verifyPaymentOriginal;

// 1. Add mongoose require inside the function
modified = modified.replace(
  'const { \n    razorpay_order_id,',
  'const mongoose = require("mongoose");\n  const { \n    razorpay_order_id,'
);

// 2. Add session start after signature check
modified = modified.replace(
  'if (razorpay_signature === expectedSign) {\n    // Payment verified',
  'if (razorpay_signature === expectedSign) {\n    // Payment verified\n    const session = await mongoose.startSession();\n    session.startTransaction();\n    try {'
);

// 3. Modify Order.findById
modified = modified.replace(
  'const order = await Order.findById(orderObjectId);',
  'const order = await Order.findById(orderObjectId).session(session);'
);

// 4. Modify Tailor.findOne
modified = modified.replace(
  'const tailorProfile = await Tailor.findOne({ user: order.tailor });',
  'const tailorProfile = await Tailor.findOne({ user: order.tailor }).session(session);'
);

// 5. Modify tailorProfile.save
modified = modified.replace(
  'await tailorProfile.save();',
  'await tailorProfile.save({ session });'
);

// 6. Modify WalletTransaction.create
modified = modified.replace(
  'await WalletTransaction.create({',
  'await WalletTransaction.create([{'
);
modified = modified.replace(
  'description: `Advance payment received for order ${order.orderId}`\n               });',
  'description: `Advance payment received for order ${order.orderId}`\n               }], { session });'
);

// 7. Modify PaymentLedger.create for remaining
modified = modified.replace(
  'await PaymentLedger.create({',
  'await PaymentLedger.create([{'
);
modified = modified.replace(
  'paidAt: new Date(),\n          });',
  'paidAt: new Date(),\n          }], { session });'
);

// 8. Modify PaymentLedger.create for full payment
modified = modified.replace(
  'await PaymentLedger.create({',
  'await PaymentLedger.create([{'
);
modified = modified.replace(
  'paidAt: new Date(),\n          });',
  'paidAt: new Date(),\n          }], { session });'
);

// 9. Modify order.save
modified = modified.replace(
  'await order.save();',
  'await order.save({ session });\n    await session.commitTransaction();\n    session.endSession();'
);

// 10. Find the very end to close the try-catch block
modified = modified.replace(
  '    } else {\n      return next(new ErrorResponse("Invalid payment signature", 400));\n    }\n});',
  '    } catch (err) {\n      await session.abortTransaction();\n      session.endSession();\n      console.error("Payment Verification Transaction Failed:", err);\n      return next(new ErrorResponse("Payment processing failed. Please contact support.", 500));\n    }\n  } else {\n    return next(new ErrorResponse("Invalid payment signature", 400));\n  }\n});'
);

content = content.replace(verifyPaymentOriginal, modified);
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced verifyPayment with transactional version");
