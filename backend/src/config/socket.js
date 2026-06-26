const { Server } = require("socket.io");

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
            origin.match(/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/)
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

  const jwt = require("jsonwebtoken");
  
  // Middleware to authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      console.log(`🔌 [SOCKET AUTH ERROR] No token provided for socket: ${socket.id}`);
      return next(new Error("Authentication error: Token required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
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
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their notification room`);
    });

    socket.on("join", (room) => {
      socket.join(room);
      console.log(`🏢 Socket ${socket.id} joined room: ${room}`);
    });

    // ── Join a room by orderId for real-time order tracking ──────────────────
    socket.on("join_order_room", async (orderId) => {
      try {
        const Order = require("../models/Order");
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
      socket.join("admin_room");
      console.log(`👑 Admin socket ${socket.id} joined admin_room`);
    });

    // ── Measurement Executive joins their room ──────────────────────────
    socket.on("join_measurement_executive_room", () => {
      socket.join("measurement_executives");
      console.log(`📐 Measurement Executive socket ${socket.id} joined measurement_executives room`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
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

module.exports = { initSocket, getIO };
