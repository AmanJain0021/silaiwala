require("dotenv").config();
// Trigger nodemon reload for fully dynamic SMSIndiaHub env configuration

const http = require("http");
const app = require("./app.js");
const connectDB = require("./config/db.js");
const { initSocket } = require("./config/socket.js");
const { initCronJobs } = require("./utils/cronJobs.js");

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ───────────────────────────────────────────────────────

const server = http.createServer(app);

// ─── Initialize Socket.io ─────────────────────────────────────────────────────

initSocket(server);

// ─── Boot Sequence ────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    // 1. Initialize Redis if enabled (optional, fail-soft)
    const { isRedisEnabled, getRedisClient } = require("./config/redis.js");
    if (isRedisEnabled) {
      console.log("🟡 Initializing Redis connection...");
      getRedisClient(); // This will connect and log success/failure
    } else {
      console.log("⚪ Redis is disabled in environment (REDIS_ENABLED=false). Running in-memory mode.");
    }

    // 2. Connect to MongoDB
    await connectDB();
    
    // 2. Initialize background jobs
    initCronJobs();

    // 3. Start the HTTP server
    server.listen(PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
      console.log(`🌐 API Base URL : http://localhost:${PORT}/api/v1`);
      console.log(`❤️  Health Check : http://localhost:${PORT}/health`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    console.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("🔒 HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Unhandled Errors ─────────────────────────────────────────────────────────

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Promise Rejection:", reason);
  // Gracefully exit so nodemon/pm2 can restart
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("🔴 Uncaught Exception:", error.message);
  server.close(() => process.exit(1));
});
