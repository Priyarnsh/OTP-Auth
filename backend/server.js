import app from "./app.js";
import env from "./src/config/env.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import redis from "./src/config/redis.js";

const PORT = env.PORT;

/**
 * Start the server after connecting to all required services.
 */
async function startServer() {
  try {
    // 1. Connect to MongoDB
    console.log("⏳ Connecting to MongoDB...");
    await connectDB();

    // 2. Check Redis status
    if (redis.status === "mock") {
      console.log("⚠️  Redis: Running with in-memory mock");
    }

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log("══════════════════════════════════════════");
      console.log(`🚀 OTP Auth Server running on port ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   API Base:    http://localhost:${PORT}/api/v1`);
      console.log(`   Health:      http://localhost:${PORT}/api/v1/health`);
      console.log(`   Client URL:  ${env.CLIENT_URL}`);
      console.log("══════════════════════════════════════════");

      // Service status
      if (!env.RESEND_API_KEY) {
        console.log("📧 Email: Console fallback (set RESEND_API_KEY for Resend)");
      } else {
        console.log("📧 Email: Resend configured ✓");
      }

      if (!env.TWILIO_ACCOUNT_SID) {
        console.log("📱 SMS:   Console fallback (set TWILIO_* for Twilio)");
      } else {
        console.log("📱 SMS:   Twilio configured ✓");
      }

      console.log("══════════════════════════════════════════");
    });

    // ─── Graceful Shutdown ────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n⏳ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("✅ HTTP server closed");

        await disconnectDB();

        if (redis.status !== "mock" && redis.quit) {
          await redis.quit();
          console.log("✅ Redis disconnected");
        }

        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
