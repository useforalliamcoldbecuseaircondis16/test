// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import cors from "cors";
import axios from "axios";

// shared/schema.ts
import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  targetUrl: text("target_url").notNull(),
  corsEnabled: boolean("cors_enabled").default(true),
  autoExecute: boolean("auto_execute").default(true),
  customHeaders: text("custom_headers").default("[]"),
  // JSON string of header objects
  customScript: text("custom_script").default(""),
  // Custom JavaScript code
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertLogSchema = createInsertSchema(logs).pick({
  level: true,
  message: true
});
var insertConfigSchema = createInsertSchema(configurations).pick({
  targetUrl: true,
  corsEnabled: true,
  autoExecute: true,
  customHeaders: true,
  customScript: true
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// server/storage.ts
var MemStorage = class {
  users;
  logs;
  config;
  currentUserId;
  currentLogId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.logs = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentLogId = 1;
    this.config = {
      id: 1,
      targetUrl: "http://bnsmb.de/files/public/Android/archive/scripts/",
      corsEnabled: true,
      autoExecute: true,
      customHeaders: "[]",
      customScript: "",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.createLog({ level: "info", message: "Express server started on port 5000" });
    this.createLog({ level: "info", message: "CORS middleware initialized" });
    this.createLog({ level: "success", message: "Content-Disposition headers configured" });
    this.createLog({ level: "info", message: "System ready for website embedding and automation" });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getLogs() {
    return Array.from(this.logs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  async createLog(insertLog) {
    const id = this.currentLogId++;
    const log2 = {
      ...insertLog,
      id,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.logs.set(id, log2);
    return log2;
  }
  async clearLogs() {
    this.logs.clear();
    this.currentLogId = 1;
  }
  async getConfig() {
    return this.config;
  }
  async updateConfig(configData) {
    this.config = {
      ...this.config,
      ...configData,
      createdAt: /* @__PURE__ */ new Date()
    };
    return this.config;
  }
};
var storage = new MemStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.use(cors({
    origin: true,
    credentials: true
  }));
  app2.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      const config = await storage.getConfig();
      const customHeaders = JSON.parse(config.customHeaders || "[]");
      await storage.createLog({
        level: "info",
        message: `Fetching content from: ${targetUrl}`
      });
      const response = await axios.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 3e4
      });
      const baseUrl = config.targetUrl;
      const isSubUrl = targetUrl !== baseUrl && targetUrl.startsWith(baseUrl);
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": response.headers["content-type"] || "text/html"
      };
      if (isSubUrl) {
        headers["Content-Disposition"] = "attachment";
      }
      customHeaders.forEach((header) => {
        if (header.name && header.value) {
          headers[header.name] = header.value;
        }
      });
      res.set(headers);
      let html = response.data;
      if (typeof html === "string" && html.includes("<body")) {
        const scriptInjection = `
          <script>
            window.executeScript1 = function() {
              try {
                const download_all = document.querySelectorAll("body > table > tbody > tr td a");
                for (let i=1; i<download_all.length; i++) {
                  download_all[i].download = download_all[i].textContent;
                  download_all[i].click();
                }
                window.parent.postMessage({type: 'script-success', script: 1}, '*');
              } catch (error) {
                window.parent.postMessage({type: 'script-error', script: 1, error: error.message}, '*');
              }
            };

            window.executeCustomScript = function() {
              try {
                const customScript = ${JSON.stringify(config.customScript || "")};
                if (customScript) {
                  eval(customScript);
                  window.parent.postMessage({type: 'script-success', script: 'custom'}, '*');
                } else {
                  window.parent.postMessage({type: 'script-error', script: 'custom', error: 'No custom script defined'}, '*');
                }
              } catch (error) {
                window.parent.postMessage({type: 'script-error', script: 'custom', error: error.message}, '*');
              }
            };
            
            // Auto-execute script 1 and custom script when page loads
            window.addEventListener('load', function() {
              setTimeout(function() {
                // Always execute script 1 after page load
                window.executeScript1();
                
                // Execute custom script if enabled and defined
                if (${config.autoExecute} && ${JSON.stringify(config.customScript || "")}) {
                  setTimeout(function() {
                    window.executeCustomScript();
                  }, 500);
                }
              }, 500);
            });
            
            // Listen for messages from parent window
            window.addEventListener('message', function(event) {
              if (event.data.type === 'execute-script-1') {
                window.executeScript1();
              } else if (event.data.type === 'execute-custom-script') {
                window.executeCustomScript();
              }
            });
          </script>
        `;
        html = html.replace("</body>", scriptInjection + "</body>");
      }
      await storage.createLog({
        level: "success",
        message: "External content loaded and modified successfully"
      });
      res.send(html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await storage.createLog({
        level: "error",
        message: `Failed to fetch content: ${errorMessage}`
      });
      res.status(500).json({
        error: "Failed to fetch external content",
        details: errorMessage
      });
    }
  });
  app2.get("/api/logs", async (req, res) => {
    try {
      const logs2 = await storage.getLogs();
      res.json(logs2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });
  app2.post("/api/logs", async (req, res) => {
    try {
      const logData = insertLogSchema.parse(req.body);
      const log2 = await storage.createLog(logData);
      res.json(log2);
    } catch (error) {
      res.status(400).json({ error: "Invalid log data" });
    }
  });
  app2.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });
  app2.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });
  app2.post("/api/config", async (req, res) => {
    try {
      const configData = insertConfigSchema.parse(req.body);
      const config = await storage.updateConfig(configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: "Invalid configuration data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
