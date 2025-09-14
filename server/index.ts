import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import path from 'path';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers middleware
app.use((req, res, next) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
    return;
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
  
  next();
});

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

  // Smart port selection with HTTPS support
  const startPort = parseInt(process.env.PORT || '3001', 10);
  const useHttps = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production' || true; // Always use HTTPS
  
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
          findAvailablePort(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  };

  findAvailablePort(startPort).then((port) => {
    if (useHttps) {
      // Try to load SSL certificates
      try {
        const privateKey = fs.readFileSync('ssl/private-key.pem', 'utf8');
        const certificate = fs.readFileSync('ssl/certificate.pem', 'utf8');
        
        const httpsServer = createHttpsServer({
          key: privateKey,
          cert: certificate
        }, app);
        
        httpsServer.listen(port, "0.0.0.0", () => {
          log(`🔒 LockMiNDS is running securely on port ${port}`);
          log(`🌐 Open your browser: https://localhost:${port}`);
          log(`📱 Or try: https://127.0.0.1:${port}`);
          log(`⚠️  You may see a security warning - click "Advanced" and "Proceed"`);
        });
      } catch (error) {
        log(`❌ SSL certificates not found. Run: node generate-ssl.mjs`);
        log(`🔄 Falling back to HTTP...`);
        
        server.listen(port, "0.0.0.0", () => {
          log(`🚀 LockMiNDS is running on port ${port} (HTTP)`);
          log(`🌐 Open your browser: http://localhost:${port}`);
        });
      }
    } else {
      server.listen(port, "0.0.0.0", () => {
        log(`🚀 LockMiNDS is running on port ${port} (HTTP)`);
        log(`🌐 Open your browser: http://localhost:${port}`);
      });
    }
  }).catch((err) => {
    log(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  });
})();
