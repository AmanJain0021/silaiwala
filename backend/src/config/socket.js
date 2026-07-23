const { Server } = require("socket.io");
const { isRedisEnabled, getRedisClient, getRedisSubClient } = require("./redis.js");

let io;

/**
 * Initialize Socket.io with an HTTP server instance.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // In development, allow requests with no origin (like mobile apps or curl) 
        // or any local development origin
        if (!origin || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1') || 
            origin.match(/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/) ||
            origin === 'https://sewzella.com' ||
            origin === 'https://www.sewzella.com' ||
            (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Redis Adapter (optional — enables multi-instance socket broadcasts) ────
  if (isRedisEnabled) {
    try {
      const { createAdapter } = require("@socket.io/redis-adapter");
      const pubClient = getRedisClient();
      const subClient = getRedisSubClient();
      if (pubClient && subClient) {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("🔌 [Socket.IO] Redis adapter attached");
      } else {
        console.warn("⚠️  [Socket.IO] Redis enabled but clients unavailable — using in-memory adapter");
      }
    } catch (err) {
      console.error(`🔴 [Socket.IO] Failed to attach Redis adapter — ${err.message}. Falling back to in-memory adapter.`);
    }
  }

  const jwt = require("jsonwebtoken");
  
  // Middleware to authenticate socket connections via JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      console.log(`🔌 [SOCKET AUTH ERROR] No token provided for socket: ${socket.id}`);
      return next(new Error("Authentication error: Token required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const User = require("../models/User.js");
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log(`🔌 [SOCKET AUTH ERROR] User not found in database: ${decoded.id}`);
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.log(`🔌 [SOCKET AUTH ERROR] Invalid token for socket: ${socket.id} | Error: ${err.message}`);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.user?.id}`);

    // ── Join a room by userId for targeted notifications ─────────────────────
    socket.on("join_user_room", (userId) => {
      const currentUserId = socket.user?.id || socket.user?._id?.toString();
      if (userId !== currentUserId) {
        console.warn(`⚠️ Unauthorized attempt to join user room for user ${userId} by user ${currentUserId}`);
        return;
      }
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their notification room`);
    });

    socket.on("join", (room) => {
      const currentUserId = socket.user?.id || socket.user?._id?.toString();
      // Basic authorization for sensitive rooms
      if (room === "delivery_partners" && socket.user?.role !== "delivery") {
        console.warn(`⚠️ Unauthorized attempt to join delivery_partners by user ${currentUserId}`);
        return;
      }
      if (room === "admin_room" && socket.user?.role !== "admin") {
        console.warn(`⚠️ Unauthorized attempt to join admin_room by user ${currentUserId}`);
        return;
      }
      if (room === "measurement_executives" && socket.user?.role !== "measurement_executive") {
        console.warn(`⚠️ Unauthorized attempt to join measurement_executives by user ${currentUserId}`);
        return;
      }
      if (room.startsWith("user_") && room !== `user_${currentUserId}`) {
        console.warn(`⚠️ Unauthorized attempt to join another user's room (${room}) by user ${currentUserId}`);
        return;
      }

      socket.join(room);
      console.log(`🏢 Socket ${socket.id} joined room: ${room}`);
    });

    // ── Join a room by orderId for real-time order tracking ──────────────────
    socket.on("join_order_room", async (orderId) => {
      try {
        const Order = require("../models/Order.js");
        const order = await Order.findById(orderId);
        
        if (!order) {
            socket.emit("error", "Order not found");
            return;
        }

        const isCustomer = order.customer && order.customer.toString() === socket.user.id;
        const isTailor = order.tailor && order.tailor.toString() === socket.user.id;
        const isDeliveryPartner = order.deliveryPartner && order.deliveryPartner.toString() === socket.user.id;
        const isPickupPartner = order.pickupPartner && order.pickupPartner.toString() === socket.user.id;
        const isDropoffPartner = order.dropoffPartner && order.dropoffPartner.toString() === socket.user.id;
        const isAdmin = socket.user.role === 'admin';

        if (isCustomer || isTailor || isDeliveryPartner || isPickupPartner || isDropoffPartner || isAdmin) {
            socket.join(`order_${orderId}`);
            console.log(`📦 Socket ${socket.id} joined room: order_${orderId}`);
        } else {
            console.warn(`⚠️ Socket ${socket.id} (User: ${socket.user.id}) unauthorized attempt to join order_${orderId}`);
            socket.emit("error", "Not authorized to track this order");
        }
      } catch (err) {
          console.error("Socket room join error:", err);
          socket.emit("error", "Failed to join room");
      }
    });

    // ── Leave an order room ──────────────────────────────────────────────────
    socket.on("leave_order_room", (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`🚪 Socket ${socket.id} left room: order_${orderId}`);
    });

    // ── Tailor location update via Socket.IO ─────────────────────────────────
    socket.on("tailor_location_update", async (data) => {
      try {
        const { orderId, latitude, longitude, distanceRemaining, eta } = data;
        if (!orderId || latitude === undefined || longitude === undefined) return;

        const Order = require("../models/Order.js");
        const order = await Order.findById(orderId);
        if (!order) return;

        // Ensure only the tailor of this order can broadcast
        if (order.tailor.toString() !== socket.user.id) return;

        // Ensure the order is in self-delivery out-for-delivery state
        if (order.status !== 'out-for-delivery' || order.deliveryMethod !== 'tailor') return;

        io.to(`order_${orderId}`).emit('locationUpdated', {
          orderId,
          currentLocation: { latitude, longitude },
          distanceRemaining,
          eta,
          isTailorDelivery: true,
          timestamp: new Date()
        });
      } catch (err) {
        console.error("tailor_location_update socket error:", err);
      }
    });

    // ── Issue chat rooms ─────────────────────────────────────────────────────
    socket.on("join_issue_room", (issueId) => {
      socket.join(`issue_${issueId}`);
      console.log(`💬 Socket ${socket.id} joined room: issue_${issueId}`);
    });

    socket.on("leave_issue_room", (issueId) => {
      socket.leave(`issue_${issueId}`);
      console.log(`🚪 Socket ${socket.id} left room: issue_${issueId}`);
    });

    // ── Admin joins a global admin room ──────────────────────────────────────
    socket.on("join_admin_room", () => {
      if (socket.user?.role !== "admin") {
        console.warn(`⚠️ Unauthorized attempt to join admin_room by user ${socket.user?.id}`);
        return;
      }
      socket.join("admin_room");
      console.log(`👑 Admin socket ${socket.id} joined admin_room`);
    });

    // ── Tailor joins their room ───────────────────────────────────────────────
    socket.on("join_tailor_room", (userId) => {
      // It acts as a user room specific to the tailor
      if (userId !== socket.user?.id) {
         console.warn(`⚠️ Unauthorized attempt to join tailor room for user ${userId} by user ${socket.user?.id}`);
         return;
      }
      socket.join(`user_${userId}`);
      console.log(`✂️ Tailor socket ${socket.id} joined user_${userId}`);
    });

    // ── Measurement Executive joins their room ──────────────────────────
    socket.on("join_measurement_executive_room", () => {
      if (socket.user?.role !== "measurement_executive") {
        console.warn(`⚠️ Unauthorized attempt to join measurement_executives by user ${socket.user?.id}`);
        return;
      }
      socket.join("measurement_executives");
      console.log(`📐 Measurement Executive socket ${socket.id} joined measurement_executives room`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  // ── Public offline order tracking (no JWT — token is the secret) ───────────
  const offlineTrackNsp = io.of("/offline-track");
  offlineTrackNsp.on("connection", (socket) => {
    console.log(`📋 Offline track socket connected: ${socket.id}`);

    socket.on("join_offline_track", async (token) => {
      try {
        const trackingToken = String(token || "").trim();
        if (trackingToken.length < 16) {
          socket.emit("error", "Invalid tracking token");
          return;
        }
        const OfflineOrder = require("../models/OfflineOrder.js");
        const order = await OfflineOrder.findOne({
          trackingToken,
          source: "offline",
        }).select("_id trackingToken");

        if (!order) {
          socket.emit("error", "Order not found");
          return;
        }

        socket.join(`offline_track_${trackingToken}`);
        console.log(`📋 Socket ${socket.id} joined offline_track_${trackingToken.slice(0, 8)}…`);
      } catch (err) {
        console.error("join_offline_track error:", err);
        socket.emit("error", "Failed to join tracking room");
      }
    });
  });

  return io;
};

/**
 * Get the initialized Socket.io instance anywhere in the app.
 * @returns {import("socket.io").Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initSocket(server) first.");
  }
  return io;
};

/** Safe variant — returns null if socket is not ready (scripts / early boot). */
const tryGetIO = () => io || null;

module.exports = { initSocket, getIO, tryGetIO };
