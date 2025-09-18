#!/usr/bin/env node

/**
 * API Connectivity Test Script
 * Tests Spoonacular API, OpenAI API, and server endpoints
 *
 * Usage: node scripts/test-api-connectivity.js
 */

const https = require("https");
const http = require("http");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️ ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️ ${message}`, "blue");
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`);
  log("=".repeat(message.length));
}

// Test configuration
const config = {
  spoonacular: {
    baseUrl: "https://api.spoonacular.com",
    testEndpoint: "/recipes/complexSearch",
    apiKey:
      process.env.VITE_SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY,
  },
  openai: {
    baseUrl: "https://api.openai.com",
    testEndpoint: "/v1/chat/completions",
    apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  },
  server: {
    baseUrl: process.env.SERVER_URL || "http://localhost:3000",
    testEndpoint: "/make-server-5976446e/health",
  },
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;

    const requestOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FUZO-API-Test/1.0",
        ...options.headers,
      },
      timeout: 10000,
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test Spoonacular API
async function testSpoonacularAPI() {
  logHeader("🍽️ Testing Spoonacular API");

  if (
    !config.spoonacular.apiKey ||
    config.spoonacular.apiKey === "your_spoonacular_api_key_here"
  ) {
    logWarning("Spoonacular API key not configured - skipping test");
    return { status: "skipped", message: "API key not configured" };
  }

  try {
    const url = `${config.spoonacular.baseUrl}${config.spoonacular.testEndpoint}?apiKey=${config.spoonacular.apiKey}&query=pasta&number=5`;
    logInfo(`Testing: ${url.replace(config.spoonacular.apiKey, "***")}`);

    const startTime = Date.now();
    const response = await makeRequest(url);
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      const resultsCount = response.data?.results?.length || 0;
      logSuccess(
        `Spoonacular API working! Retrieved ${resultsCount} recipes in ${responseTime}ms`
      );
      return {
        status: "success",
        message: `Retrieved ${resultsCount} recipes`,
        responseTime,
        data: response.data,
      };
    } else {
      logError(`Spoonacular API returned status ${response.status}`);
      return {
        status: "error",
        message: `HTTP ${response.status}`,
        responseTime,
        error: response.rawData,
      };
    }
  } catch (error) {
    logError(`Spoonacular API test failed: ${error.message}`);
    return {
      status: "error",
      message: error.message,
      error: error.message,
    };
  }
}

// Test OpenAI API
async function testOpenAIAPI() {
  logHeader("🤖 Testing OpenAI API");

  if (
    !config.openai.apiKey ||
    config.openai.apiKey === "your_openai_api_key_here"
  ) {
    logWarning("OpenAI API key not configured - skipping test");
    return { status: "skipped", message: "API key not configured" };
  }

  try {
    const url = `${config.openai.baseUrl}${config.openai.testEndpoint}`;
    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: 'Say "Hello from FUZO!" in a friendly way.',
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    };

    logInfo(`Testing: ${url}`);

    const startTime = Date.now();
    const response = await makeRequest(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body,
    });
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      const content =
        response.data?.choices?.[0]?.message?.content || "No content";
      logSuccess(
        `OpenAI API working! Generated: "${content}" in ${responseTime}ms`
      );
      return {
        status: "success",
        message: `Generated content: ${content.substring(0, 50)}...`,
        responseTime,
        data: response.data,
      };
    } else {
      logError(`OpenAI API returned status ${response.status}`);
      return {
        status: "error",
        message: `HTTP ${response.status}`,
        responseTime,
        error: response.rawData,
      };
    }
  } catch (error) {
    logError(`OpenAI API test failed: ${error.message}`);
    return {
      status: "error",
      message: error.message,
      error: error.message,
    };
  }
}

// Test Server Endpoints
async function testServerEndpoints() {
  logHeader("🖥️ Testing Server Endpoints");

  try {
    const url = `${config.server.baseUrl}${config.server.testEndpoint}`;
    logInfo(`Testing: ${url}`);

    const startTime = Date.now();
    const response = await makeRequest(url);
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      logSuccess(
        `Server responding! Status: ${response.status} in ${responseTime}ms`
      );
      return {
        status: "success",
        message: `Server responding (${response.status})`,
        responseTime,
        data: response.data,
      };
    } else {
      logError(`Server returned status ${response.status}`);
      return {
        status: "error",
        message: `HTTP ${response.status}`,
        responseTime,
        error: response.rawData,
      };
    }
  } catch (error) {
    logError(`Server test failed: ${error.message}`);
    return {
      status: "error",
      message: error.message,
      error: error.message,
    };
  }
}

// Environment check
function checkEnvironment() {
  logHeader("🌍 Environment Check");

  const envVars = [
    "VITE_SPOONACULAR_API_KEY",
    "SPOONACULAR_API_KEY",
    "VITE_OPENAI_API_KEY",
    "OPENAI_API_KEY",
    "SERVER_URL",
  ];

  envVars.forEach((varName) => {
    const value = process.env[varName];
    if (value && value !== `your_${varName.toLowerCase()}_here`) {
      const displayValue =
        value.length > 20 ? `${value.substring(0, 12)}...` : value;
      logSuccess(`${varName}: ${displayValue}`);
    } else {
      logWarning(`${varName}: not set or using default value`);
    }
  });

  logInfo(`Node.js version: ${process.version}`);
  logInfo(`Platform: ${process.platform} ${process.arch}`);
}

// Main test runner
async function runAllTests() {
  logHeader("🚀 FUZO API Connectivity Test Suite");
  logInfo(`Started at: ${new Date().toISOString()}`);

  checkEnvironment();

  const results = [];

  // Test server endpoints first
  const serverResult = await testServerEndpoints();
  results.push({ service: "Server Endpoints", ...serverResult });

  // Test Spoonacular API
  const spoonacularResult = await testSpoonacularAPI();
  results.push({ service: "Spoonacular API", ...spoonacularResult });

  // Test OpenAI API
  const openaiResult = await testOpenAIAPI();
  results.push({ service: "OpenAI API", ...openaiResult });

  // Summary
  logHeader("📊 Test Summary");

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  results.forEach((result) => {
    const icon =
      result.status === "success"
        ? "✅"
        : result.status === "error"
        ? "❌"
        : "⏭️";
    const color =
      result.status === "success"
        ? "green"
        : result.status === "error"
        ? "red"
        : "yellow";

    log(`${icon} ${result.service}: ${result.message}`, color);
    if (result.responseTime) {
      log(`   Response time: ${result.responseTime}ms`, "blue");
    }
  });

  log(
    `\n${colors.bright}Results: ${successCount} successful, ${errorCount} failed, ${skippedCount} skipped${colors.reset}`
  );

  if (errorCount > 0) {
    log("\n💡 Troubleshooting tips:", "yellow");
    log(
      "• Check your API keys are correctly set in environment variables",
      "yellow"
    );
    log(
      "• Ensure your server is running if testing server endpoints",
      "yellow"
    );
    log("• Check your internet connection", "yellow");
    log("• Verify API quotas and billing status", "yellow");
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch((error) => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});

