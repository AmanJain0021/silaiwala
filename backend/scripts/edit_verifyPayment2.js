const fs = require('fs');

const targetFile = 'C:/Users/amanj/OneDrive/silaiwala1/silaiwala/backend/src/modules/orders/controllers/order.controller.js';
const newFuncFile = 'C:/Users/amanj/OneDrive/silaiwala1/silaiwala/backend/scripts/new_func.js';

let content = fs.readFileSync(targetFile, 'utf8');
const newFunc = fs.readFileSync(newFuncFile, 'utf8');

const startStr = 'exports.verifyPayment = asyncHandler(async (req, res, next) => {';
const startIdx = content.indexOf(startStr);
const endStr = 'exports.updateOrderStatus = asyncHandler(async (req, res, next) => {';
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const beforeEnd = content.lastIndexOf('});', endIdx);
    
    content = content.substring(0, startIdx) + newFunc + "\n\n/**\n * @desc    Update order status\n" + content.substring(endIdx - 110);
    // Wait, endIdx - 110 might capture the comment block before updateOrderStatus.
    // Let's be precise.
    const everythingBefore = content.substring(0, startIdx);
    // find the comment block that starts right after the old verifyPayment
    const afterOldVerify = content.substring(beforeEnd + 3);
    
    fs.writeFileSync(targetFile, everythingBefore + newFunc + '\n\n' + afterOldVerify.trimStart(), 'utf8');
    console.log('Successfully updated verifyPayment function with transaction wrapper!');
} else {
    console.log('Could not find start or end markers for verifyPayment');
}
