const { transitionOrder } = require("./src/utils/orderStateMachine");

const testOrder = {
  orderId: "ORD-123",
  status: "pending",
  trackingHistory: []
};

console.log("Initial state:", testOrder.status);

try {
  console.log("Trying pending -> accepted...");
  transitionOrder(testOrder, "accepted");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error(e.message);
}

try {
  console.log("\nTrying accepted -> out-for-delivery (Should fail)...");
  transitionOrder(testOrder, "out-for-delivery");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error("Caught expected error:", e.message);
}

try {
  console.log("\nTrying accepted -> in-progress...");
  transitionOrder(testOrder, "in-progress");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error(e.message);
}

try {
  console.log("\nTrying in-progress -> ready...");
  transitionOrder(testOrder, "ready");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error(e.message);
}

try {
  console.log("\nTrying ready -> ready-for-delivery...");
  transitionOrder(testOrder, "ready-for-delivery");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error(e.message);
}

try {
  console.log("\nTrying ready-for-delivery -> pending (Should fail backwards jump)...");
  transitionOrder(testOrder, "pending");
  console.log("Success! Current state:", testOrder.status);
} catch (e) {
  console.error("Caught expected error:", e.message);
}

console.log("\nFinal tracking history:");
console.log(testOrder.trackingHistory.map(h => `- ${h.status}: ${h.message}`));
