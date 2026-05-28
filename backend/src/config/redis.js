import Redis from "ioredis";
import env from "./env.js";

let redis;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        console.error("❌ Redis: Max retries reached. Giving up.");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 2000);
      console.warn(`⏳ Redis: Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    // Reconnect on specific errors
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  redis.on("connect", () => {
    console.log("✅ Redis: Connected successfully");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis: Connection error —", err.message);
  });
} catch (err) {
  console.error("❌ Redis: Failed to initialize client —", err.message);
  // Create a mock redis for development without Redis running
  redis = {
    async get() {
      return null;
    },
    async set() {
      return "OK";
    },
    async setex() {
      return "OK";
    },
    async del() {
      return 1;
    },
    async incr() {
      return 1;
    },
    async expire() {
      return 1;
    },
    async ttl() {
      return -1;
    },
    status: "mock",
  };
  console.warn("⚠️  Redis: Using in-memory mock (no persistence!)");
}

export default redis;
