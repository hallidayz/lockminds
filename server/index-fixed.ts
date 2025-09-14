import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Smart port selection - finds an available port automatically
  const startPort = parseInt(process.env.PORT || '3001', 10);
  
  const findAvailablePort = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const testServer = createServer();
      
      testServer.listen(port, '0.0.0.0', () => {
        const address = testServer.address();
        const foundPort = typeof address === 'object' ? address?.port : port;
        testServer.close(() => {
          resolve(foundPort || port);
        });
      });
      
      testServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is busy, try the next one
          findAvailablePort(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  };

  findAvailablePort(startPort).then((port) => {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 LockingMiNDS is running on port ${port}`);
      log(`🌐 Open your browser: http://localhost:${port}`);
      log(`📱 Or try: http://127.0.0.1:${port}`);
    });
  }).catch((err) => {
    log(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  });
})();
