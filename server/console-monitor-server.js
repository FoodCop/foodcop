const WebSocket = require("ws");
const { spawn } = require("child_process");
const path = require("path");

class ConsoleMonitorServer {
  constructor(port = 3001) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.childProcess = null;
    this.isRunning = false;
  }

  start() {
    // Create WebSocket server
    this.wss = new WebSocket.Server({
      port: this.port,
      path: "/console",
    });

    this.wss.on("connection", (ws, req) => {
      console.log(`🔌 New client connected from ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "status",
          data: {
            message: "Connected to console monitor",
            timestamp: Date.now(),
            clients: this.clients.size,
          },
          timestamp: Date.now(),
        })
      );

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error("Failed to parse client message:", error);
        }
      });

      ws.on("close", () => {
        console.log("🔌 Client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });
    });

    console.log(
      `🚀 Console Monitor Server running on ws://localhost:${this.port}/console`
    );

    // Start monitoring the development server
    this.startProcessMonitoring();
  }

  startProcessMonitoring() {
    if (this.isRunning) return;

    console.log("📡 Starting process monitoring...");

    // Start the development server
    this.childProcess = spawn("npm", ["run", "dev"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    // Monitor stdout
    this.childProcess.stdout.on("data", (data) => {
      const output = data.toString();
      this.broadcast({
        type: "log",
        data: {
          message: output.trim(),
          source: "stdout",
          level: "info",
        },
        timestamp: Date.now(),
      });
    });

    // Monitor stderr
    this.childProcess.stderr.on("data", (data) => {
      const output = data.toString();
      this.broadcast({
        type: "error",
        data: {
          message: output.trim(),
          source: "stderr",
          level: "error",
        },
        timestamp: Date.now(),
      });
    });

    // Monitor process events
    this.childProcess.on("close", (code) => {
      console.log(`📡 Process exited with code ${code}`);
      this.broadcast({
        type: "status",
        data: {
          message: `Process exited with code ${code}`,
          code,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    });

    this.childProcess.on("error", (error) => {
      console.error("📡 Process error:", error);
      this.broadcast({
        type: "error",
        data: {
          message: `Process error: ${error.message}`,
          source: "process",
          level: "error",
          error: error.toString(),
        },
        timestamp: Date.now(),
      });
    });

    this.isRunning = true;
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case "subscribe":
        console.log("📡 Client subscribed to console monitoring");
        ws.send(
          JSON.stringify({
            type: "status",
            data: { message: "Subscribed to console monitoring" },
            timestamp: Date.now(),
          })
        );
        break;

      case "ping":
        ws.send(
          JSON.stringify({
            type: "pong",
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
          })
        );
        break;

      default:
        console.log("📡 Unknown message type:", data.type);
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error("Failed to send message to client:", error);
          this.clients.delete(client);
        }
      }
    });
  }

  stop() {
    console.log("🛑 Stopping Console Monitor Server...");

    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      clients: this.clients.size,
      port: this.port,
      processRunning: this.childProcess && !this.childProcess.killed,
    };
  }
}

// CLI interface
if (require.main === module) {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 3001;
  const server = new ConsoleMonitorServer(port);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    server.stop();
    process.exit(0);
  });

  // Start the server
  server.start();

  // Keep the process alive
  setInterval(() => {
    const status = server.getStatus();
    if (!status.isRunning) {
      console.log("🔄 Restarting console monitor...");
      server.start();
    }
  }, 5000);
}

module.exports = ConsoleMonitorServer;
