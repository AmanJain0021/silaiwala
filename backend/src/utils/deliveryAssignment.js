const Delivery = require("../models/Delivery");
const Tailor = require("../models/Tailor");
const Order = require("../models/Order");
const { sendNotification } = require("./notification");
const { getIO } = require("../config/socket");

/**
 * Assigns a delivery partner to an order for a specific cycle.
 * @param {ObjectId} orderId - The Order ID
 * @param {String} cycle - "pickup" (Customer -> Tailor) or "dropoff" (Tailor -> Customer)
 */
exports.autoAssignDelivery = async (orderId, cycle = "pickup") => {
  try {
    const order = await Order.findById(orderId).populate("tailor customer");
    if (!order) return;

    const tailorProfile = await Tailor.findOne({ user: order.tailor._id });
    
    // Build query to find available riders not in rejectedBy
    const query = {
      isAvailable: true,
      user: { $nin: order.rejectedBy || [] }
    };

    let nearestRider = null;

    if (tailorProfile?.location?.coordinates) {
       try {
           const nearbyRiders = await Delivery.find({
              ...query,
              currentLocation: {
                 $near: {
                    $geometry: tailorProfile.location,
                    $maxDistance: 15000 // 15km search radius
                 }
              }
           }).populate("user").limit(1);
           
           if (nearbyRiders.length > 0) {
               nearestRider = nearbyRiders[0];
           } else {
               nearestRider = await Delivery.findOne(query).populate("user");
           }
       } catch (geoError) {
           console.error("⚠️ Geospatial search failed. Using availability query fallback:", geoError.message);
           nearestRider = await Delivery.findOne(query).populate("user");
       }
    } else {
       nearestRider = await Delivery.findOne(query).populate("user");
    }

    if (nearestRider && nearestRider.user) {
       console.log(`\n================================`);
       console.log(`🏍️  DELIVERY BOY ASSIGNED!`);
       console.log(`Name: ${nearestRider.user.name}`);
       console.log(`Order ID: ${order.orderId}`);
       console.log(`Cycle: ${cycle}`);
       console.log(`================================\n`);

       // Update Order fields based on cycle
       const partnerId = nearestRider.user._id;
       order.deliveryPartner = partnerId; // Keep for legacy compatibility
       
       if (cycle === "pickup") {
         order.pickupPartner = partnerId;
         order.pickupDeliveryStatus = "assigned";
       } else {
         order.dropoffPartner = partnerId;
         order.dropoffDeliveryStatus = "assigned";
       }

       order.deliveryStatus = 'assigned';
       order.assignedAt = new Date();
       order.trackingHistory.push({
          status: "Assigning Delivery Partner",
          message: `Delivery partner auto-assigned for ${cycle}.`,
          timestamp: new Date()
       });
       await order.save();

       // Notify assigned rider
       const title = cycle === "pickup" ? "New Fabric Task Assigned! 📍" : "New Final Delivery Task! 📍";
       const message = cycle === "pickup" 
          ? `Order ${order.orderId} has been auto-assigned to you for fabric pickup from Customer.`
          : `Order ${order.orderId} has been auto-assigned to you for final delivery to Customer.`;
          
       await sendNotification({
         recipient: partnerId,
         type: "NEW_DELIVERY_TASK",
         title,
         message,
         data: { 
           orderId: order._id, 
           type: cycle === "pickup" ? "fabric-ready-for-pickup" : "ready-for-delivery", 
           taskType: cycle === "pickup" ? 'fabric-pickup' : 'final-delivery',
           targetUrl: "/delivery/tasks" 
         }
       });
       
       const io = getIO();
       if (io) io.to("delivery_partners").emit("task_claimed", { orderId: order._id });
       
       return true;
    } else {
        console.log(`No delivery partner available for order ${order.orderId} (${cycle})`);
        return false;
    }
  } catch (error) {
    console.error("Auto-assignment failed:", error.message);
    return false;
  }
};
