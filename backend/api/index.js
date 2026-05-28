import connectDB from "../src/config/db.js";
import app from "../app.js";

// Ensure DB is connected before handling requests
// Vercel serverless functions can freeze and thaw, so we must ensure connection
let isDbConnected = false;

export default async function handler(req, res) {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  
  // Let Express handle the request
  return app(req, res);
}
