import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connect to MongoDB using Mongoose.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.DATABASE_URL, {
      dbName: "otp_auth",
    });

    console.log(`✅ MongoDB: Connected to ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB: Disconnected");
    });

    return conn;
  } catch (err) {
    console.error("❌ MongoDB: Failed to connect —", err.message);
    throw err;
  }
}

/**
 * Disconnect from MongoDB gracefully.
 */
export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("✅ MongoDB: Disconnected gracefully");
}
