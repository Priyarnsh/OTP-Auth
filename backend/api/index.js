import connectDB from "../src/config/db.js";
import app from "../app.js";

// Ensure DB is connected before handling requests
// Vercel serverless functions can freeze and thaw, so we must ensure connection
let isDbConnected = false;

export default async function handler(req, res) {
  try {
    if (!isDbConnected) {
      await connectDB();
      isDbConnected = true;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Vercel Backend Error: Database connection failed. You likely forgot to add DATABASE_URL in Vercel Environment Variables.",
      error: error.message
    });
  }
  
  // Let Express handle the request
  return app(req, res);
}
