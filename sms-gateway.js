// sms-gateway.js - Node-RED SMS Gateway Plugin (API Key Authentication)
module.exports = function (RED) {
  "use strict";
  const axios = require("./node_modules/axios/index.d.cts");

  // SMS Gateway Configuration Node
  function SmsGatewayConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;

    // Store API key securely
    if (this.credentials) {
      this.apiKey = this.credentials.apiKey;
    }
  }

  RED.nodes.registerType("sms-gateway-config", SmsGatewayConfigNode, {
    credentials: {
      apiKey: { type: "password" },
    },
  });

  // Main SMS Gateway Node
  function SmsGatewayNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Configuration
    node.operation = config.operation || "send";
    node.phoneNumber = config.phoneNumber || "";
    node.message = config.message || "";
    node.limit = parseInt(config.limit) || 50;
    node.logLevel = config.logLevel || "";
    node.component = config.component || "";

    // Get configuration node
    node.configNode = RED.nodes.getNode(config.config);

    if (!node.configNode) {
      node.error("SMS Gateway configuration is missing");
      return;
    }

    if (!node.configNode.apiKey) {
      node.error("API Key is required in SMS Gateway configuration");
      return;
    }

    // Helper function to make authenticated API calls
    async function makeApiCall(method, endpoint, data = null, params = {}) {
      try {
        const url = `${node.configNode.baseUrl}${endpoint}`;

        const config = {
          method: method,
          url: url,
          headers: {
            Authorization: `Bearer ${node.configNode.apiKey}`,
            "Content-Type": "application/json",
            "X-API-Key": node.configNode.apiKey, // Alternative header format
          },
          timeout: 30000, // 30 seconds timeout
        };

        if (data) {
          config.data = data;
        }

        if (Object.keys(params).length > 0) {
          config.params = params;
        }

        const response = await axios(config);
        return response.data;
      } catch (error) {
        if (error.response) {
          // API returned an error response
          const statusCode = error.response.status;
          const errorMsg =
            error.response.data?.detail ||
            error.response.data?.message ||
            error.response.statusText;

          if (statusCode === 401) {
            throw new Error(`Authentication failed: Invalid API Key`);
          } else if (statusCode === 403) {
            throw new Error(`Access forbidden: Check API Key permissions`);
          } else {
            throw new Error(`API Error (${statusCode}): ${errorMsg}`);
          }
        } else if (error.request) {
          throw new Error(
            `Network Error: Unable to reach SMS gateway at ${node.configNode.baseUrl}`
          );
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      }
    }

    // API operation handlers
    const operations = {
      async send(phoneNumber, message) {
        return await makeApiCall("POST", "/sms", {
          phone_number: phoneNumber,
          message: message,
        });
      },

      async inbox(limit = 50) {
        return await makeApiCall("GET", "/sms/inbox", null, { limit });
      },

      async sent(limit = 50) {
        return await makeApiCall("GET", "/sms/sent", null, { limit });
      },

      async logs(limit = 100, level = null, component = null) {
        const params = { limit };
        if (level) params.level = level;
        if (component) params.component = component;

        return await makeApiCall("GET", "/logs", null, params);
      },

      async simulateReceive(phoneNumber, message) {
        return await makeApiCall("POST", "/sms/simulate-receive", null, {
          phone_number: phoneNumber,
          message: message,
        });
      },
    };

    // Node input handler
    node.on("input", async function (msg, send, done) {
      // For Node-RED 0.x compatibility
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };
      done = done || function () {};

      try {
        // Get operation from config or message
        const operation = msg.operation || node.operation;

        // Set node status
        node.status({ fill: "yellow", shape: "dot", text: `${operation}...` });

        let result;

        switch (operation) {
          case "send":
            const phoneNumber =
              msg.phoneNumber ||
              node.phoneNumber ||
              msg.payload?.phoneNumber ||
              msg.payload?.phone_number;
            const message =
              msg.message ||
              node.message ||
              msg.payload?.message ||
              (typeof msg.payload === "string" ? msg.payload : "");

            if (!phoneNumber || !message) {
              throw new Error(
                "Phone number and message are required for sending SMS"
              );
            }

            result = await operations.send(phoneNumber, message);
            msg.payload = result;
            node.status({ fill: "green", shape: "dot", text: "SMS sent" });
            break;

          case "inbox":
            const inboxLimit = msg.limit || node.limit || 50;
            result = await operations.inbox(inboxLimit);
            msg.payload = result;
            node.status({
              fill: "green",
              shape: "dot",
              text: `${result.length} received`,
            });
            break;

          case "sent":
            const sentLimit = msg.limit || node.limit || 50;
            result = await operations.sent(sentLimit);
            msg.payload = result;
            node.status({
              fill: "green",
              shape: "dot",
              text: `${result.length} sent`,
            });
            break;

          case "logs":
            const logLimit = msg.limit || node.limit || 100;
            const logLevel = msg.logLevel || node.logLevel || null;
            const component = msg.component || node.component || null;

            result = await operations.logs(logLimit, logLevel, component);
            msg.payload = result;
            node.status({
              fill: "green",
              shape: "dot",
              text: `${result.length} logs`,
            });
            break;

          case "simulate-receive":
            const fromNumber =
              msg.phoneNumber ||
              node.phoneNumber ||
              msg.payload?.phoneNumber ||
              msg.payload?.phone_number;
            const receivedMessage =
              msg.message ||
              node.message ||
              msg.payload?.message ||
              (typeof msg.payload === "string" ? msg.payload : "");

            if (!fromNumber || !receivedMessage) {
              throw new Error(
                "Phone number and message are required for simulating received SMS"
              );
            }

            result = await operations.simulateReceive(
              fromNumber,
              receivedMessage
            );
            msg.payload = result;
            node.status({ fill: "green", shape: "dot", text: "SMS simulated" });
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        // Clear status after 5 seconds
        setTimeout(() => {
          node.status({});
        }, 5000);

        send(msg);
        done();
      } catch (error) {
        node.status({ fill: "red", shape: "ring", text: error.message });
        node.error(error.message, msg);
        done(error);
      }
    });

    // Test connection on node start (simple ping)
    node.on("ready", async function () {
      try {
        // Simple test call to verify API key works
        await makeApiCall("GET", "/sms/sent", null, { limit: 1 });
        node.status({ fill: "green", shape: "dot", text: "Connected" });
        setTimeout(() => node.status({}), 3000);
      } catch (error) {
        node.status({ fill: "red", shape: "ring", text: "Connection failed" });
        node.warn(`Failed to connect to SMS gateway: ${error.message}`);
      }
    });

    // Cleanup on node removal
    node.on("close", function () {
      node.status({});
    });
  }

  // Register the main node
  RED.nodes.registerType("sms-gateway", SmsGatewayNode);
};
