// import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
// import express5 from "express";

// const app = express5();
// app.set('trust proxy', 1); // Add this line!

// app.use(express5.json({ limit: "50mb" }));


// // const app = express();

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined = undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }

//       if (logLine.length > 80) {
//         logLine = logLine.slice(0, 79) + "…";
//       }

//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   const server = await registerRoutes(app);
  
//   // Start background cleanup job for scheduled account deletions
//   const { startCleanupJob } = await import('./jobs/cleanup-scheduled-deletions');
//   startCleanupJob();

//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     const status = err.status || err.statusCode || 500;
//     const message = err.message || "Internal Server Error";

//     log(`Error ${status}: ${message}`);
//     res.status(status).json({ message });
//   });

//   // importantly only setup vite in development and after
//   // setting up all the other routes so the catch-all route
//   // doesn't interfere with the other routes
//   if (process.env.NODE_ENV !== "production") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // Add health check endpoint for Cloud Run
//   app.get('/health', (_req, res) => {
//     res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
//   });

//   // Port configuration for both Replit and Cloud Run
//   const port = parseInt(process.env.PORT || '5001', 10);
  
//   server.listen(port, "0.0.0.0", () => {
//     log(`serving on port ${port}`);
    
//     // Multiple preview URL formats for Replit
//     if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
//       log(`Preview access: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`);
//       log(`Replit preview configured for port ${port}`);
//     }
    
//     if (process.env.REPLIT_DEV_DOMAIN) {
//       log(`Development preview: https://${process.env.REPLIT_DEV_DOMAIN}`);
//     }
    
//     log(`Local access: http://localhost:${port}`);
//     log(`Server bound to all interfaces (0.0.0.0:${port}) for preview compatibility`);
//   });
// })();

import express, { type Request, Response, NextFunction } from "express";
import express5 from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

// Load environment variables
dotenv.config();

console.log(process.env.VITE_FIREBASE_API_KEY);
// Firebase config from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
console.log("Firebase Config from Env:", firebaseConfig);

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple log helper
const log = (...args: any[]) => console.log("🧠", ...args);

// Create Express app
const app = express5();
app.set("trust proxy", 1);

// JSON and URL-encoded middleware
app.use(express5.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Logging middleware for API responses
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Background cleanup job
  const { startCleanupJob } = await import("./jobs/cleanup-scheduled-deletions");
  startCleanupJob();

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`Error ${status}: ${message}`);
    res.status(status).json({ message });
  });

  // Static file serving for production
  app.use(express.static(path.join(__dirname, "../dist/public")));

  // Catch-all route for SPA
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Root route
  app.get("/", (_req, res) => {
    res.send("✅ Indieshots API is running!");
  });

  // Start server
  const port = parseInt(process.env.PORT || "8080", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    if (process.env.K_SERVICE) {
      log(`Cloud Run service: ${process.env.K_SERVICE}`);
      log(`Cloud Run revision: ${process.env.K_REVISION}`);
    }

    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      log(`Preview access: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`);
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      log(`Dev preview: https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    log(`Local access: http://localhost:${port}`);
    log(`Server bound to all interfaces (0.0.0.0)`);
  });
})();
