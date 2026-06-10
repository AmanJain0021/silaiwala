const mongoose = require("mongoose");
const User = require("../../../models/User");
const Order = require("../../../models/Order");
const Banner = require("../../../models/Banner");
const Delivery = require("../../../models/Delivery");
const Tailor = require("../../../models/Tailor");
const Customer = require("../../../models/Customer");
const Category = require("../../../models/Category");
const CMSContent = require("../../../models/CMSContent");
const Product = require("../../../models/Product");
const PromoCode = require("../../../models/PromoCode");
const Payout = require("../../../models/Payout");
const Settings = require("../../../models/Settings");
const path = require("path");
const { sendNotification } = require("../../../utils/notification");

// --- DASHBOARD & GENERAL ---

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalTailors = await User.countDocuments({ role: "tailor" });
    const totalDeliveries = await User.countDocuments({ role: "delivery" });
    const totalOrdersCount = await Order.countDocuments();
    
    // Calculate total revenue from completed orders
    const completedOrders = await Order.find({ status: "delivered" });
    const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    
    // Active orders are any orders not delivered or cancelled
    const activeOrdersCount = await Order.countDocuments({ status: { $nin: ["delivered", "cancelled"] } });

    // Pending Tailor applications
    const pendingTailorsCount = await User.countDocuments({ role: "tailor", isVerified: false });

    // Pending Payouts calculation
    const pendingPayoutsData = await Payout.aggregate([
      { $match: { status: { $in: ["pending", "processing"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const pendingPayouts = pendingPayoutsData.length > 0 ? pendingPayoutsData[0].total : 0;

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate("customer", "name")
      .populate("items.service", "title")
      .populate("items.product", "name")
      .populate("tailor", "name")
      .sort("-createdAt")
      .limit(5);

    // Get Top 5 Tailors by completed orders
    const topTailors = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: "$tailor", completedOrders: { $sum: 1 } } },
      { $sort: { completedOrders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $lookup: {
          from: "tailors",
          localField: "_id",
          foreignField: "user",
          as: "tailorProfile"
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          completedOrders: 1,
          rating: { $ifNull: [{ $arrayElemAt: ["$tailorProfile.rating", 0] }, 5.0] }
        }
      }
    ]);

    // Financial stats for the chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await Order.aggregate([
      { 
        $match: { 
          status: "delivered",
          createdAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedChartData = chartData.map(d => ({
      name: days[d._id - 1],
      revenue: d.revenue
    }));

    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalTailors,
        totalDeliveries,
        totalOrdersCount,
        activeOrdersCount,
        totalRevenue,
        pendingTailorsCount,
        pendingPayouts
      },
      systemHealth,
      recentOrders,
      topTailors,
      revenueChart: formattedChartData
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- USER MANAGEMENT ---

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }

    if (role === 'customer') {
      const users = await User.find({ role: 'customer' }).select("-password").sort("-createdAt").lean();
      const userIds = users.map(u => u._id);
      
      const [profiles, orders] = await Promise.all([
        Customer.find({ user: { $in: userIds } }).lean(),
        Order.find({ customer: { $in: userIds } }).lean()
      ]);

      const data = users.map(user => {
        const profile = profiles.find(p => p.user?.toString() === user._id.toString());
        const userOrders = orders.filter(o => o.customer?.toString() === user._id.toString());
        
        return {
          ...user,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
          addresses: profile?.addresses || []
        };
      });

      return res.status(200).json({ success: true, count: data.length, data });
    }

    if (role === 'tailor') {
      const users = await User.find({ role: 'tailor' }).select("-password").sort("-createdAt").lean();
      const userIds = users.map(u => u._id);
      
      const profiles = await Tailor.find({ user: { $in: userIds } }).lean();

      const data = users.map(user => {
        const profile = profiles.find(p => p.user?.toString() === user._id.toString());
        return {
          ...user,
          profile: profile || null
        };
      });

      return res.status(200).json({ success: true, count: data.length, data });
    }

    const users = await User.find(query).select("-password").sort("-createdAt");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeliveryPartners = async (req, res) => {
  try {
    // 1. Get all users with delivery role
    const users = await User.find({ role: "delivery" }).select("-password").sort("-createdAt").lean();
    const userIds = users.map(u => u._id);

    // 2. Get delivery profiles for these users
    const profiles = await Delivery.find({ user: { $in: userIds } }).lean();

    // 3. Map profiles back to users
    const data = users.map(user => {
      const profile = profiles.find(p => p.user?.toString() === user._id.toString());
      return {
        ...user,
        profile: profile || null
      };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- TAILOR APPROVALS ---

exports.getPendingTailors = async (req, res) => {
  try {
    const users = await User.find({ role: "tailor", isActive: false }).select("-password").lean();
    const userIds = users.map(u => u._id);
    const profiles = await Tailor.find({ user: { $in: userIds } }).lean();

    const data = users.map(user => {
      const profile = profiles.find(p => p.user?.toString() === user._id.toString());
      return {
        ...user,
        profile: profile || null
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getPendingTailors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveTailor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true, isVerified: true }, { new: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update Tailor profile's registration status
    const tailor = await Tailor.findOne({ user: user._id });
    if (tailor) {
      tailor.registrationStatus = 'verified';
      await tailor.save();
    }

    // Notify Tailor
    await sendNotification({
      recipient: user._id,
      type: "ACCOUNT_APPROVED",
      title: "Welcome to Silaiwala!",
      message: "Your tailor account has been approved. You can now start accepting orders and managing your shop.",
      data: { targetUrl: "/partner/dashboard" }
    });

    res.status(200).json({ success: true, message: "Tailor approved and notified", data: user });
  } catch (error) {
    console.error("Error in approveTailor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectTailor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update Tailor document
    const tailor = await Tailor.findOne({ user: id });
    if (tailor) {
      tailor.registrationStatus = 'rejected';
      tailor.rejectionReason = reason;

      await tailor.save();
    }

    user.isActive = false;
    user.isVerified = false;
    await user.save();
    
    res.status(200).json({ success: true, message: "Tailor application rejected" });
  } catch (error) {
    console.error("Error in rejectTailor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTailorCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionPercentage } = req.body;

    if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
      return res.status(400).json({ success: false, message: "Invalid commission percentage" });
    }

    const tailor = await Tailor.findOneAndUpdate(
      { user: id },
      { commissionPercentage },
      { new: true }
    );

    if (!tailor) {
      return res.status(404).json({ success: false, message: "Tailor profile not found" });
    }

    res.status(200).json({ success: true, message: "Commission updated successfully", data: tailor });
  } catch (error) {
    console.error("Error in updateTailorCommission:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DELIVERY PARTNER APPROVALS ---

exports.getPendingDeliveryPartners = async (req, res) => {
  try {
    const users = await User.find({ role: "delivery", isActive: false }).select("-password").lean();
    const userIds = users.map(u => u._id);
    const profiles = await Delivery.find({ user: { $in: userIds } }).lean();

    const data = users.map(user => {
      const profile = profiles.find(p => p.user?.toString() === user._id.toString());
      return {
        ...user,
        profile: profile || null
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getPendingDeliveryPartners:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveDeliveryPartner = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true, isVerified: true }, { new: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Also update all documents in the Delivery profile to 'verified'
    const delivery = await Delivery.findOne({ user: user._id });
    if (delivery) {
      if (delivery.documents && delivery.documents.length > 0) {
        delivery.documents = delivery.documents.map(doc => ({
          ...doc,
          status: 'verified'
        }));
      }
      delivery.status = 'active';
      await delivery.save();
    }

    // Notify Delivery Partner
    await sendNotification({
      recipient: user._id,
      type: "ACCOUNT_APPROVED",
      title: "Account Approved!",
      message: "Your delivery partner account has been approved. You can now start accepting deliveries.",
      data: { targetUrl: "/delivery/dashboard" }
    });

    res.status(200).json({ success: true, message: "Delivery partner approved", data: user });
  } catch (error) {
    console.error("Error in approveDeliveryPartner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    
    res.status(200).json({ success: true, message: "Delivery partner application rejected" });
  } catch (error) {
    console.error("Error in rejectDeliveryPartner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ORDER MANAGEMENT ---

exports.getAllOrders = async (req, res) => {
  try {
    const { status, type, customer, tailor, deliveryPartner, limit = 50, page = 1 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (tailor) query.tailor = tailor;
    
    // Handle unassigned orders specifically
    if (deliveryPartner === 'unassigned') {
      query.deliveryPartner = null;
    } else if (deliveryPartner) {
      query.deliveryPartner = deliveryPartner;
    }
    
    if (type) {
      if (type === 'store') query['items.product'] = { $exists: true };
      if (type === 'stitching') query['items.service'] = { $exists: true };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("customer", "name email phoneNumber")
      .populate("tailor", "name shopName phoneNumber")
      .populate("deliveryPartner", "name phoneNumber")
      .populate("items.service", "title")
      .populate("items.product", "name")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);
      
    const total = await Order.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      count: orders.length, 
      total,
      pages: Math.ceil(total / limit),
      data: orders 
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phoneNumber")
      .populate("tailor", "name shopName phoneNumber")
      .populate("deliveryPartner", "name phoneNumber")
      .populate("items.service", "title")
      .populate("items.product", "name");
      
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, tailor, deliveryPartner, deliveryFee } = req.body;
    
    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let updateData = {};
    let trackingMessage = "";

    if (status) {
      updateData.status = status;
      trackingMessage = `Order status updated to ${status.replace(/-/g, ' ')} by System Admin`;
    }
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (deliveryFee !== undefined) updateData.deliveryFee = deliveryFee;
    
    // Handle Tailor Assignment Logic
    if (tailor && tailor !== oldOrder.tailor?.toString()) {
      updateData.tailor = tailor;
      if (oldOrder.status === 'pending') {
          updateData.status = oldOrder.fabricPickupRequired ? 'fabric-ready-for-pickup' : 'accepted';
      }
      trackingMessage = trackingMessage || "New tailor assigned to order";
    }

    // Handle Delivery Assignment Logic
    if (deliveryPartner && deliveryPartner !== oldOrder.deliveryPartner?.toString()) {
      // Check if partner is online/available
      const partnerProfile = await Delivery.findOne({ user: deliveryPartner });
      if (!partnerProfile || !partnerProfile.isAvailable) {
        return res.status(400).json({ success: false, message: "Selected delivery partner is not online/available" });
      }

      updateData.deliveryPartner = deliveryPartner;
      
      // LOGIC: If we are assigning a delivery partner and the order was pending/accepted,
      // it might need to move to fabric-ready-for-pickup if fabric pickup is required
      if (oldOrder.status === 'pending' || oldOrder.status === 'accepted') {
          if (oldOrder.fabricPickupRequired) {
              updateData.status = 'fabric-ready-for-pickup';
          }
      }
      trackingMessage = trackingMessage || "Delivery partner assigned";
    }
    
    if (status === 'delivered') updateData.deliveredAt = Date.now();
    if (status === 'accepted') updateData.acceptedAt = Date.now();

    const order = await Order.findByIdAndUpdate(
      id, 
      { 
        ...updateData,
        $push: { 
          trackingHistory: { 
            status: status || updateData.status || oldOrder.status, 
            message: trackingMessage || "Order details updated by Admin",
            timestamp: Date.now()
          } 
        } 
      }, 
      { new: true, runValidators: true }
    ).populate("customer tailor deliveryPartner items.service items.product");

    // Notifications AFTER Update (Prevent Race Conditions)
    if (tailor && tailor !== oldOrder.tailor?.toString()) {
      await sendNotification({
        recipient: tailor,
        type: "ORDER_ASSIGNED",
        title: "New Job Assigned! 🧵",
        message: `Job ${order.orderId || id} has been assigned to you.`,
        data: { orderId: id, targetUrl: "/partner/orders" }
      });
    }

    if (deliveryPartner && deliveryPartner !== oldOrder.deliveryPartner?.toString()) {
      await sendNotification({
        recipient: deliveryPartner,
        type: "TASK_ASSIGNED",
        title: "New Delivery Assigned 📦",
        message: `Dispatch ${order.orderId || id} has been assigned to you.`,
        data: { orderId: id, targetUrl: "/delivery/tasks" }
      });

      // Clear from general fleet
      const { getIO } = require("../../../config/socket");
      const io = getIO();
      if (io) io.to("delivery_partners").emit("task_claimed", { orderId: id });
    }
    
    if (order && status && status !== oldOrder.status) {
        // Earnings Distribution
        if (status === 'delivered') {
          const { distributeEarnings } = require("../../../utils/earningsEngine");
          try {
            await distributeEarnings(order._id);
          } catch (err) {
            console.error("Failed to distribute earnings via admin update:", err);
          }
        }

        // Notify Customer
        await sendNotification({
            recipient: order.customer?._id || order.customer,
            type: "ORDER_STATUS_UPDATED",
            title: "Order Status Changed!",
            message: `Admin has updated your order ${order.orderId} to: ${status.replace(/-/g, ' ')}`,
            data: { orderId: order._id, targetUrl: "/profile/orders" }
        });

        // Notify Tailor if not already notified by tailor change
        if (!tailor || tailor === oldOrder.tailor?.toString()) {
            await sendNotification({
                recipient: order.tailor?._id || order.tailor,
                type: "ORDER_STATUS_UPDATED",
                title: "Job Status Updated",
                message: `Admin updated order ${order.orderId} status to: ${status.replace(/-/g, ' ')}`,
                data: { orderId: order._id, targetUrl: "/partner/orders" }
            });
        }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- CMS & MARKETING (BANNERS) ---

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort("-createdAt");
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CMS NOTIFICATIONS ---

exports.sendBroadcastNotification = async (req, res) => {
  try {
    const { targetAudience, title, message } = req.body;
    // In a real app, integrate with Firebase Cloud Messaging (FCM) or similar
    console.log(`[BROADCAST] To: ${targetAudience} - Title: ${title} - Message: ${message}`);
    res.status(200).json({ success: true, message: "Broadcast sent successfully (Mocked)" });
  } catch (error) {
    console.error("Error in sendBroadcastNotification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CMS CONTENT (LEGAL & FAQ) ---

exports.getAllCMSContent = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) query.type = type;
    const contents = await CMSContent.find(query).sort("-createdAt");
    res.status(200).json({ success: true, data: contents });
  } catch (error) {
    console.error("Error in getAllCMSContent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCMSContent = async (req, res) => {
  try {
    const content = await CMSContent.create(req.body);
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    console.error("Error in createCMSContent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCMSContent = async (req, res) => {
  try {
    const content = await CMSContent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error("Error in updateCMSContent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCMSContent = async (req, res) => {
  try {
    const content = await CMSContent.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });
    res.status(200).json({ success: true, message: "Content deleted" });
  } catch (error) {
    console.error("Error in deleteCMSContent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) query.type = type;
    
    const categories = await Category.find(query).sort("-createdAt").lean();
    
    // Get product counts for each category
    const data = await Promise.all(categories.map(async (cat) => {
      const productCount = await mongoose.model("Product").countDocuments({ category: cat._id });
      return { ...cat, productCount };
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Error in createCategory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FILE UPLOADS ---

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a file" });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: imageUrl,
    });
  } catch (error) {
    console.error("Error in uploadImage:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- STORE MANAGEMENT (PRODUCTS) ---

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, stockStatus } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };
    
    if (stockStatus) {
      if (stockStatus === "out_of_stock") query.stock = 0;
      if (stockStatus === "low_stock") query.stock = { $gt: 0, $lte: 5 };
      if (stockStatus === "in_stock") query.stock = { $gt: 5 };
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("tailor", "name shopName")
      .sort("-createdAt");
      
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const payload = { ...req.body };
    
    // If Admin is creating and no tailor is specified, assign Silaiwala Central Store tailor
    if (!payload.tailor) {
      const systemTailor = await Tailor.findOne({ shopName: /Silaiwala Central Store/i });
      if (systemTailor) {
        payload.tailor = systemTailor._id;
      } else {
        // Fallback to any existing tailor if system tailor isn't found
        const anyTailor = await Tailor.findOne();
        if (anyTailor) payload.tailor = anyTailor._id;
      }
    }

    if (!payload.tailor) {
      return res.status(400).json({ success: false, message: "A tailor ID is required to create a product. Please seed or create a tailor first." });
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in createProduct:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- INVENTORY MANAGEMENT ---

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, inStock } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      id, 
      { 
        stock, 
        inStock: inStock !== undefined ? inStock : (stock > 0) 
      }, 
      { new: true }
    );
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in updateInventory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- COUPON MANAGEMENT ---

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await PromoCode.find().sort("-createdAt");
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    console.error("Error in getAllCoupons:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await PromoCode.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error("Error in createCoupon:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error("Error in updateCoupon:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await PromoCode.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error("Error in deleteCoupon:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FINANCE MANAGEMENT ---

exports.getFinancialStats = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "paid" });
    
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    // Let's assume 15% platform commission
    const platformCommission = totalRevenue * 0.15;
    
    const pendingPayoutsDoc = await Payout.find({ status: "pending" });
    const pendingPayouts = pendingPayoutsDoc.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const refundedOrders = await Order.find({ paymentStatus: "refunded" });
    const refundsProcessed = refundedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    // Weekly Revenue Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const trendData = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Map to last 7 days names (Mon, Tue...)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        const match = trendData.find(t => t._id === dateStr);
        formattedTrend.push({
            name: dayName,
            revenue: match ? match.revenue : 0
        });
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        platformCommission,
        pendingPayouts,
        refundsProcessed,
        revenueTrend: formattedTrend
      }
    });
  } catch (error) {
    console.error("Error in getFinancialStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { paymentStatus: { $in: ["paid", "refunded"] } };
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } }
      ];
    }

    const transactions = await Order.find(query)
      .populate("customer", "name")
      .sort("-createdAt")
      .limit(50);
      
    res.status(200).json({
      success: true,
      data: transactions.map(t => ({
        id: t.paymentId || 'TXN-' + t._id.toString().slice(-6),
        orderId: t.orderId,
        date: t.createdAt,
        customer: t.customer?.name || 'Guest',
        amount: t.totalAmount,
        type: t.paymentStatus === 'paid' ? 'Credit' : 'Debit',
        method: t.razorpayOrderId ? 'Online (Razorpay)' : 'Cash',
        status: t.paymentStatus === 'paid' ? 'Completed' : 'Refunded'
      }))
    });
  } catch (error) {
    console.error("Error in getTransactions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate("user", "name role email")
      .sort("-createdAt");
    res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    console.error("Error in getAllPayouts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayoutStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, transactionReference, notes } = req.body;
    
    const payout = await Payout.findById(id).session(session);
    if (!payout) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    const oldStatus = payout.status;
    payout.status = status;
    if (transactionReference) payout.transactionReference = transactionReference;
    if (notes) payout.notes = notes;
    if (status === 'completed') payout.processedAt = Date.now();
    
    await payout.save({ session });

    // Handle Wallet Transaction Update
    const WalletTransaction = require("../../../models/WalletTransaction");
    const transaction = await WalletTransaction.findOne({ 
      user: payout.user, // Payout model uses 'user' for user ref
      amount: payout.amount,
      type: "debit",
      category: "withdrawal",
      status: "pending"
    }).session(session);

    if (transaction) {
      transaction.status = status === 'completed' ? 'completed' : (status === 'failed' ? 'failed' : 'pending');
      await transaction.save({ session });
    }

    // Refund logic if payout failed and it was previously pending/processing
    if (status === 'failed' && oldStatus !== 'failed' && oldStatus !== 'completed') {
      const User = require("../../../models/User");
      const user = await User.findById(payout.user);
      
      let profile;
      if (user.role === 'tailor') {
        const Tailor = require("../../../models/Tailor");
        profile = await Tailor.findOne({ user: user._id }).session(session);
      } else if (user.role === 'delivery') {
        const Delivery = require("../../../models/Delivery");
        profile = await Delivery.findOne({ user: user._id }).session(session);
      }

      if (profile) {
        profile.walletBalance += payout.amount;
        await profile.save({ session });

        // Create a credit transaction for the refund
        await WalletTransaction.create([{
          user: user._id,
          amount: payout.amount,
          type: "credit",
          category: "withdrawal", // Or maybe 'refund'
          status: "completed",
          description: `Refund for failed payout ${payout.payoutId}`
        }], { session });
      }
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: payout });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in updatePayoutStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// --- SYSTEM SETTINGS ---

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const updateData = req.body;
    
    // Deep merge or specific updates
    if (updateData.general) settings.general = updateData.general;
    if (updateData.maintenanceMode) settings.maintenanceMode = updateData.maintenanceMode;
    if (updateData.notifications) settings.notifications = updateData.notifications;
    if (updateData.paymentGateways) settings.paymentGateways = updateData.paymentGateways;
    if (updateData.appConfig) settings.appConfig = updateData.appConfig;
    if (updateData.visitFee) settings.visitFee = updateData.visitFee;
    if (updateData.pricing) settings.pricing = updateData.pricing;

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error in updateSettings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- REPORTS MANAGEMENT ---

exports.generateReport = async (req, res) => {
  try {
    const { type, range, format } = req.query;
    
    let startDate = new Date();
    if (range === 'this_month') startDate.setDate(1);
    else if (range === 'last_month') {
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
    } else {
        startDate.setDate(startDate.getDate() - 30); // Default 30 days
    }

    let reportData = [];
    let summary = {};

    switch (type) {
      case 'sales':
        const sales = await Order.find({ createdAt: { $gte: startDate }, paymentStatus: 'paid' });
        summary = {
            totalOrders: sales.length,
            totalRevenue: sales.reduce((acc, o) => acc + o.totalAmount, 0),
            commission: sales.reduce((acc, o) => acc + (o.totalAmount * 0.15), 0),
        };
        reportData = sales.map(o => ({
            orderId: o.orderId,
            date: o.createdAt,
            amount: o.totalAmount,
            status: o.status
        }));
        break;

      case 'tailor':
        const tailorsCount = await User.countDocuments({ role: 'tailor' });
        const completedJobs = await Order.countDocuments({ status: 'delivered', createdAt: { $gte: startDate } });
        summary = {
            activeTailors: tailorsCount,
            jobsCompleted: completedJobs,
            avgCompletionRate: "85%" // Mocked metric
        };
        // Detailed tailor breakup
        const tailors = await User.find({ role: 'tailor' }).limit(20);
        reportData = tailors.map(t => ({
            name: t.name,
            totalEarnings: Math.floor(Math.random() * 50000), // Mock
            rating: 4.5
        }));
        break;

      case 'customer':
        const newUsers = await User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } });
        const ordersPerUser = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$customer", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
        ]);
        summary = {
            newCustomers: newUsers,
            returningCustomers: ordersPerUser.filter(u => u.count > 1).length,
            avgOrderValue: ordersPerUser.length > 0 ? (ordersPerUser.reduce((acc, u) => acc + u.total, 0) / ordersPerUser.length) : 0
        };
        reportData = ordersPerUser.slice(0, 20); // Top customers
        break;

      case 'delivery':
        const shipments = await Order.countDocuments({ status: 'delivered', createdAt: { $gte: startDate } });
        summary = {
            totalShipments: shipments,
            avgDeliveryTime: "4.2 Days",
            failedDeliveries: await Order.countDocuments({ status: 'cancelled', createdAt: { $gte: startDate } })
        };
        break;

      default:
        return res.status(400).json({ success: false, message: "Invalid report type" });
    }

    res.status(200).json({
      success: true,
      data: {
        type,
        generatedAt: new Date(),
        summary,
        details: reportData,
        downloadUrl: format === 'pdf' ? `/reports/sample_report.pdf` : `/reports/sample_report.csv`
      }
    });
  } catch (error) {
    console.error("Error in generateReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
