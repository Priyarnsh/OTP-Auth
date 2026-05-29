// Increase Vercel function timeout (Hobby plan max = 60s)
export const config = {
  maxDuration: 30,
};

let isDbConnected = false;
let app = null;

export default async function handler(req, res) {
  try {
    // Lazy-import everything to catch any import-level errors
    if (!app) {
      const appModule = await import("../app.js");
      app = appModule.default;
    }

    if (!isDbConnected) {
      const dbModule = await import("../src/config/db.js");
      await dbModule.connectDB();
      isDbConnected = true;
    }

    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Vercel Backend Error",
      error: error.message,
      stack: error.stack,
      envCheck: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        NODE_ENV: process.env.NODE_ENV || "not set",
      },
    });
  }
}
