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

    const query = {
      isAvailable: true,
      cashBlocked: { $ne: true },
      user: { $nin: order.rejectedBy || [] }
    };

    let nearestRider = null;
    let startCoords = null; // [lng, lat]

    // Determine where the rider needs to go first
    if (cycle === "pickup") {
        const Customer = require("../models/Customer");
        const customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
        if (customerDoc?.addresses?.length > 0) {
            const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
            if (defaultAddress.location?.coordinates?.length >= 2) {
                startCoords = defaultAddress.location.coordinates;
            }
        }
    } else {
        const tailorProfile = await Tailor.findOne({ user: order.tailor._id || order.tailor }).lean();
        if (tailorProfile?.location?.coordinates?.length >= 2) {
            startCoords = tailorProfile.location.coordinates;
        }
    }

    let candidateRiders = [];
    if (startCoords) {
        try {
            candidateRiders = await Delivery.find({
                ...query,
                currentLocation: {
                    $near: {
                       $geometry: { type: "Point", coordinates: startCoords },
                       $maxDistance: 15000 // 15km search radius
                    }
                }
            }).populate("user").limit(25); // Max 25 origins for Google Distance Matrix API
        } catch (geoError) {
            console.error("⚠️ Geospatial search failed. Using availability query fallback:", geoError.message);
        }
    }

    if (!candidateRiders.length) {
        candidateRiders = await Delivery.find(query).populate("user").limit(5);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (candidateRiders.length > 0 && startCoords && apiKey) {
        try {
            // Google Maps uses Lat,Lng order. MongoDB uses [Lng, Lat]
            const destLat = startCoords[1];
            const destLng = startCoords[0];
            
            // Build origins string: lat1,lng1|lat2,lng2...
            const validOrigins = candidateRiders.filter(r => r.currentLocation?.coordinates?.length >= 2);
            
            if (validOrigins.length > 0) {
                const originsStr = validOrigins.map(r => `${r.currentLocation.coordinates[1]},${r.currentLocation.coordinates[0]}`).join('|');
                
                console.log(`🛣️ [deliveryAssignment] Calling Distance Matrix API...`);
                console.log(`   Origins (${validOrigins.length} Riders):`, originsStr);
                console.log(`   Destination:`, `${destLat},${destLng}`);

                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destLat},${destLng}&key=${apiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                console.log(`📏 [deliveryAssignment] Distance Matrix Response Status:`, data.status);
                if (data.status === "OK") {
                    console.log(`   Distance Matrix Rows:`, JSON.stringify(data.rows, null, 2));
                }
                
                if (data.status === "OK" && data.rows?.length > 0) {
                    let bestRider = null;
                    let minTime = Infinity; // Using duration in seconds
                    
                    data.rows.forEach((row, index) => {
                        const element = row.elements[0];
                        if (element && element.status === "OK") {
                            const duration = element.duration.value; 
                            if (duration < minTime) {
                                minTime = duration;
                                bestRider = validOrigins[index];
                            }
                        }
                    });
                    
                    if (bestRider) {
                        nearestRider = bestRider;
                        console.log(`🗺️ Assigned best rider via Google Maps API (ETA: ${Math.round(minTime/60)} mins)`);
                    }
                } else {
                    console.error("Google Maps API returned error status:", data.status || data.error_message);
                }
            }
        } catch (apiErr) {
            console.error("Google Maps API request failed:", apiErr);
        }
    }

    // Fallback if Google Maps fails, no coordinates, or API key missing
    if (!nearestRider && candidateRiders.length > 0) {
        nearestRider = candidateRiders[0];
    }

    if (nearestRider && nearestRider.user) {
       console.log(`\n================================`);
       console.log(`🏍️  DELIVERY PARTNER NOTIFIED (Pending Accept)`);
       console.log(`Name: ${nearestRider.user.name}`);
       console.log(`Order ID: ${order.orderId}`);
       console.log(`Cycle: ${cycle}`);
       console.log(`================================\n`);

       // Update Order fields based on cycle
       const partnerId = nearestRider.user._id;
       order.deliveryPartner = partnerId; // Keep for legacy compatibility
       
       // Set status to PENDING (not assigned) so partner must explicitly accept
       if (cycle === "pickup") {
         order.pickupPartner = partnerId;
         order.pickupDeliveryStatus = "pending";
       } else {
         order.dropoffPartner = partnerId;
         order.dropoffDeliveryStatus = "pending";
       }

       order.deliveryStatus = 'pending';
       order.assignedAt = new Date();
       order.trackingHistory.push({
          status: "searching-delivery-partner",
          message: `Searching for delivery partner for ${cycle}. Notification sent to nearest available partner.`,
          timestamp: new Date()
       });
       await order.save();

       // Notify assigned rider — they must accept or reject
       const title = cycle === "pickup" ? "New Fabric Pickup Request! 🛵" : "New Delivery Request! 🛵";
       const message = cycle === "pickup" 
          ? `New job: Fabric pickup for order ${order.orderId}. Please accept or reject.`
          : `New job: Final delivery for order ${order.orderId}. Please accept or reject.`;
          
       await sendNotification({
         recipient: partnerId,
         type: "NEW_DELIVERY_TASK",
         title,
         message,
         data: { 
           orderId: order._id, 
           orderId_str: order.orderId,
           type: cycle === "pickup" ? "fabric-ready-for-pickup" : "ready-for-delivery", 
           taskType: cycle === "pickup" ? 'fabric-pickup' : 'final-delivery',
           requiresAcceptance: true,
           targetUrl: "/delivery/tasks",
           deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
           deliveryDistance: order.deliveryDistance
         }
       });
       
       // Emit socket notification directly to the partner
       const io = getIO();
       if (io) {
         // Notify assigned partner of the new task request
         io.to(`user_${partnerId}`).emit('new_notification', {
           type: 'NEW_DELIVERY_TASK',
           title,
           message,
           data: { 
             orderId: order._id,
             requiresAcceptance: true,
             taskType: cycle === "pickup" ? 'fabric-pickup' : 'final-delivery',
             targetUrl: "/delivery/tasks",
             deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
             deliveryDistance: order.deliveryDistance
           }
         });

         // Notify tailor panel to show "Searching" state
         io.to(`user_${order.tailor?._id || order.tailor}`).emit('order_status_updated', {
           orderId: order.orderId,
           _id: order._id,
           status: order.status,
           pickupDeliveryStatus: order.pickupDeliveryStatus,
           dropoffDeliveryStatus: order.dropoffDeliveryStatus
         });

         // Also notify customer tracking page
         io.to(`user_${order.customer?._id || order.customer}`).emit('order_status_updated', {
           orderId: order.orderId,
           _id: order._id,
           status: order.status
         });
       }
       
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
