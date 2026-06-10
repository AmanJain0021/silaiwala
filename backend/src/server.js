require("dotenv").config();
// Trigger nodemon restart

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const { initCronJobs } = require("./utils/cronJobs");

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ───────────────────────────────────────────────────────

const server = http.createServer(app);

// ─── Initialize Socket.io ─────────────────────────────────────────────────────

initSocket(server);

// ─── Boot Sequence ────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
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
