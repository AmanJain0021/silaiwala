const ErrorResponse = require("./errorResponse");

/**
 * Valid state transitions for Order Status.
 * Key: Current Status
 * Value: Array of allowed next statuses
 */
const ALLOWED_TRANSITIONS = {
  // Initial
  "pending": ["accepted", "cancelled"],
  
  // After tailor accepts, payment dictates the next move
  "accepted": ["in-progress", "measurement-requested", "fabric-ready-for-pickup", "cancelled"],

  // Customer sets fabric delivery preference
  "fabric-ready-for-pickup": ["fabric-picked-up", "waiting-for-customer-dropoff", "cancelled"],
  "waiting-for-customer-dropoff": ["fabric-received", "cancelled"],

  // Measurement Executive Flow
  "measurement-requested": ["measurement-assigned", "cancelled"],
  "measurement-assigned": ["measurement-accepted", "cancelled"],
  "measurement-accepted": ["measurement-otp-verified", "cancelled"],
  "measurement-otp-verified": ["measurements-uploaded", "cancelled"],
  "measurements-uploaded": ["measurements-approved", "measurement-revision-required", "cancelled"],
  "measurement-revision-required": ["measurements-uploaded", "cancelled"],
  
  // After measurements approved, goes back to tailoring logic or fabric logic
  "measurements-approved": ["in-progress", "fabric-ready-for-pickup", "cancelled"],

  // Fabric Delivery Flow (by Delivery Partner)
  "fabric-picked-up": ["fabric-delivered", "cancelled"],
  "fabric-delivered": ["fabric-received", "cancelled"],
  
  // Tailor receives fabric, starts working
  "fabric-received": ["in-progress", "order-received", "fabric-selected", "cutting", "cancelled"],

  // Tailoring Phases (Tailor can step through or skip some, so we allow forward jumps)
  "order-received": ["in-progress", "fabric-selected", "measurement-verification", "cutting", "stitching", "finishing", "quality-check", "ready", "cancelled"],
  "fabric-selected": ["measurement-verification", "cutting", "stitching", "finishing", "quality-check", "ready", "cancelled"],
  "measurement-verification": ["cutting", "stitching", "finishing", "quality-check", "ready", "cancelled"],
  "in-progress": ["order-received", "fabric-selected", "measurement-verification", "cutting", "stitching", "finishing", "quality-check", "ready", "ready-for-delivery", "ready-for-pickup", "cancelled"],
  "cutting": ["stitching", "finishing", "quality-check", "ready", "cancelled"],
  "stitching": ["finishing", "quality-check", "ready", "cancelled"],
  "finishing": ["quality-check", "ready", "cancelled"],
  "quality-check": ["ready", "cancelled"],

  // Ready for Customer/Delivery
  "ready": ["ready-for-delivery", "ready-for-pickup", "cancelled"],
  "ready-for-pickup": ["delivered", "product-delivered", "order-completed", "cancelled"],
  
  // Product Delivery Flow (by Delivery Partner)
  "ready-for-delivery": ["out-for-delivery", "cancelled"],
  "out-for-delivery": ["delivered", "failed-delivery", "cancelled"],
  "failed-delivery": ["ready-for-delivery", "cancelled"],
  
  // Terminal States
  "delivered": ["product-delivered", "order-completed"],
  "product-delivered": ["order-completed"],
  "order-completed": [],
  "cancelled": [] // Cannot revive a cancelled order currently
};

/**
 * Validates and transitions an order to a new status.
 * Mutates the order object (status and trackingHistory) but does NOT call .save().
 * @param {Object} order - The Mongoose Order document
 * @param {string} newStatus - The target status
 * @param {string} message - Optional message for tracking history
 * @param {boolean} force - If true, bypasses the state machine validation (for admin/edge cases)
 * @returns {Object} The updated order object
 */
const transitionOrder = (order, newStatus, message = "", force = false) => {
  const currentStatus = order.status || "pending";

  if (!force) {
    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];
    
    if (!allowedNextStates) {
      throw new ErrorResponse(`State machine error: Unknown current state '${currentStatus}'`, 500);
    }

    if (!allowedNextStates.includes(newStatus)) {
      // If the order is already in this status, it's a no-op, just return
      if (currentStatus === newStatus) return order;

      throw new ErrorResponse(`Invalid transition: Cannot move from '${currentStatus}' to '${newStatus}'`, 400);
    }
  }

  // Apply the transition
  order.status = newStatus;
  
  // Append to tracking history
  order.trackingHistory.push({
    status: newStatus,
    timestamp: new Date(),
    message: message || `Order status updated to ${newStatus.replace(/-/g, ' ')}`
  });

  return order;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  transitionOrder
};
