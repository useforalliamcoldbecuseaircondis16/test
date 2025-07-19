import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import axios from "axios";
import { insertLogSchema, insertConfigSchema } from "@shared/schema";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Proxy endpoint for embedding external website
  app.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      
      if (!targetUrl) {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      // Get configuration for headers
      const config = await storage.getConfig();
      const customHeaders = JSON.parse(config.customHeaders || "[]");

      // Log the request
      await storage.createLog({
        level: "info",
        message: `Fetching content from: ${targetUrl}`
      });

      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      // Check if this is a sub-URL (contains more path after base domain)
      const baseUrl = config.targetUrl;
      const isSubUrl = targetUrl !== baseUrl && targetUrl.startsWith(baseUrl);

      // Set basic CORS headers
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': response.headers['content-type'] || 'text/html'
      };

      // Add Content-Disposition only for sub-URLs (file downloads)
      if (isSubUrl) {
        headers['Content-Disposition'] = 'attachment';
      }

      // Add custom headers from configuration
      customHeaders.forEach((header: { name: string; value: string }) => {
        if (header.name && header.value) {
          headers[header.name] = header.value;
        }
      });

      res.set(headers);

      // Modify the HTML to inject our automation scripts
      let html = response.data;
      
      if (typeof html === 'string' && html.includes('<body')) {
        // Inject script execution capability
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
        
        html = html.replace('</body>', scriptInjection + '</body>');
      }

      await storage.createLog({
        level: "success",
        message: "External content loaded and modified successfully"
      });

      res.send(html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  // Logs endpoints
  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const logData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(logData);
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid log data" });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  // Configuration endpoints
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const configData = insertConfigSchema.parse(req.body);
      const config = await storage.updateConfig(configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: "Invalid configuration data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
