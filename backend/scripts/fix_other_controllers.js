const fs = require('fs');

const fixController = (path, replacements) => {
    if (!fs.existsSync(path)) {
        console.log(`File not found: ${path}`);
        return;
    }
    
    let content = fs.readFileSync(path, 'utf8');

    // Import transitionOrder
    if (!content.includes('const { transitionOrder } = require("../../../utils/orderStateMachine");')) {
        content = content.replace(
            /const Order = require\("\.\.\/\.\.\/\.\.\/models\/Order"\);/,
            'const Order = require("../../../models/Order");\nconst { transitionOrder } = require("../../../utils/orderStateMachine");'
        );
    }

    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${path} successfully.`);
};

// 1. Deliveries Controller
const deliveriesPath = 'C:\\Users\\amanj\\OneDrive\\silaiwala1\\silaiwala\\backend\\src\\modules\\deliveries\\controllers\\delivery.controller.js';
const deliveryReplacements = [
    [
        /order\.status = status === "fabric-picked-up" \? "fabric-picked-up" : "out-for-delivery";\s*order\.trackingHistory\.push\(\{\s*status: order\.status,\s*message: `\$\{taskType === "fabric-pickup" \? "Fabric picked up" : "Order picked up"\} by \$\{req\.user\.name\}`,\s*timestamp: new Date\(\),\s*\}\);/g,
        'const nextStatus = status === "fabric-picked-up" ? "fabric-picked-up" : "out-for-delivery";\n      transitionOrder(order, nextStatus, `${taskType === "fabric-pickup" ? "Fabric picked up" : "Order picked up"} by ${req.user.name}`);'
    ],
    [
        /order\.status = "fabric-delivered";\s*order\.trackingHistory\.push\(\{\s*status: "fabric-delivered",\s*message: `Fabric delivered to tailor by \$\{req\.user\.name\}`,\s*timestamp: new Date\(\),\s*\}\);/g,
        'transitionOrder(order, "fabric-delivered", `Fabric delivered to tailor by ${req.user.name}`);'
    ],
    [
        /order\.status = "out-for-delivery";\s*order\.trackingHistory\.push\(\{\s*status: "out-for-delivery",\s*message: `Order is out for delivery by \$\{req\.user\.name\}`,\s*timestamp: new Date\(\),\s*\}\);/g,
        'transitionOrder(order, "out-for-delivery", `Order is out for delivery by ${req.user.name}`);'
    ],
    [
        /order\.status = "delivered";\s*order\.trackingHistory\.push\(\{\s*status: "delivered",\s*message: `Order delivered successfully to customer by \$\{req\.user\.name\}`,\s*timestamp: new Date\(\),\s*\}\);/g,
        'transitionOrder(order, "delivered", `Order delivered successfully to customer by ${req.user.name}`);'
    ],
    [
        /order\.status = "fabric-received";\s*order\.trackingHistory\.push\(\{\s*status: "fabric-received",\s*message: 'Fabric received by tailor\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "fabric-received", "Fabric received by tailor.");'
    ],
    [
        /order\.status = "delivered";\s*order\.trackingHistory\.push\(\{\s*status: "delivered",\s*message: 'Order verified and delivered\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "delivered", "Order verified and delivered.");'
    ]
];
fixController(deliveriesPath, deliveryReplacements);

// 2. Measurement Executive Controller
const mePath = 'C:\\Users\\amanj\\OneDrive\\silaiwala1\\silaiwala\\backend\\src\\modules\\measurement-executive\\controllers\\measurementExecutive.controller.js';
const meReplacements = [
    [
        /order\.status = "measurement-accepted";\s*order\.trackingHistory\.push\(\{\s*status: "measurement-accepted",\s*message: `Measurement assigned to \$\{executive\.user\.name\}`,\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurement-accepted", `Measurement assigned to ${executive.user.name}`);'
    ],
    [
        /order\.status = "measurement-requested";\s*order\.trackingHistory\.push\(\{\s*status: "measurement-requested",\s*message: 'Measurement executive assignment cancelled\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurement-requested", "Measurement executive assignment cancelled.");'
    ],
    [
        /order\.status = "measurement-otp-verified";\s*order\.trackingHistory\.push\(\{\s*status: "measurement-otp-verified",\s*message: 'Measurement Executive verified OTP and started taking measurements\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurement-otp-verified", "Measurement Executive verified OTP and started taking measurements.");'
    ],
    [
        /order\.status = "measurements-uploaded";\s*order\.trackingHistory\.push\(\{\s*status: "measurements-uploaded",\s*message: 'Measurements have been uploaded by the executive\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurements-uploaded", "Measurements have been uploaded by the executive.");'
    ],
    [
        /order\.status = "measurements-approved";\s*order\.trackingHistory\.push\(\{\s*status: "measurements-approved",\s*message: "Customer approved measurements on-site\.",\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurements-approved", "Customer approved measurements on-site.");'
    ],
    [
        /order\.status = "measurement-assigned";\s*order\.trackingHistory\.push\(\{\s*status: "measurement-assigned",\s*message: 'Measurement task assigned to an executive\.',\s*timestamp: new Date\(\)\s*\}\);/g,
        'transitionOrder(order, "measurement-assigned", "Measurement task assigned to an executive.");'
    ]
];
fixController(mePath, meReplacements);
