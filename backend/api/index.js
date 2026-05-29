const config = {
  maxDuration: 30,
};

let isDbConnected = false;
let app = null;

async function handler(req, res) {
  try {
    if (!app) {
      const appModule = await import("../app.js");
      app = appModule.default;
    }

    if (!isDbConnected) {
      const dbModule = await import("../src/config/db.js");
      await dbModule.connectDB();
      isDbConnected = true;
    }

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

module.exports = handler;
module.exports.config = config;
