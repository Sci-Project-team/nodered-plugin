# Node-RED SMS Gateway Plugin

A Node-RED plugin that provides SMS functionality through integration with a FastAPI SMS gateway service using secure API key authentication.

## Features

- **Send SMS Messages** - Send text messages to phone numbers
- **Retrieve Inbox** - Get received SMS messages
- **View Sent Messages** - Access sent message history
- **Secure Authentication** - API key-based authentication
- **Connection Testing** - Automatic connection verification
- **Error Handling** - Comprehensive error reporting and status updates

## Installation

### Method 1: Install from GitHub Release (Recommended)

1. **Download the latest release**:

   - Go to the [releases page](https://github.com/your-username/node-red-contrib-sms-gateway/releases)
   - Download the latest `.zip` or `.tar.gz` file

2. **Extract the archive**:

   ```bash
   # For zip files
   unzip node-red-contrib-sms-gateway-v1.0.0.zip

   # For tar.gz files
   tar -xzf node-red-contrib-sms-gateway-v1.0.0.tar.gz
   ```

3. **Install globally using npm**:

   ```bash
   cd node-red-contrib-sms-gateway
   npm install -g .
   ```

4. **Restart Node-RED** to load the new plugin

### Method 2: Manual Installation

1. Download and extract the latest release
2. Copy the plugin files to your Node-RED user directory:
   ```bash
   cp -r node-red-contrib-sms-gateway ~/.node-red/node_modules/
   ```
3. Restart Node-RED

## Prerequisites

- **FastAPI SMS Gateway Service** - You need a running FastAPI SMS service
- **API Key** - Valid API key from your SMS gateway
- **Node-RED** - Version 1.0.0 or higher
- **Node.js** - Version 12 or higher

## Quick Start

### 1. Configuration Setup

1. Drag the **SMS Gateway** node from the palette to your flow
2. Double-click the node to open the configuration
3. Click the pencil icon next to "Configuration" to create a new config
4. Fill in the configuration:
   - **Name**: Optional descriptive name
   - **Base URL**: Your FastAPI SMS gateway URL (e.g., `http://localhost:8000`)
   - **API Key**: Your API key from the SMS gateway dashboard

### 2. Getting Your API Key

1. Access your SMS gateway frontend/dashboard
2. Navigate to **API Keys** or **Settings** section
3. Generate a new API key or copy an existing one
4. Paste it into the Node-RED configuration

### 3. Basic Usage Example

**Send SMS Flow:**

```
[inject] → [SMS Gateway] → [debug]
```

Configure the SMS Gateway node:

- **Operation**: Send SMS
- **Phone Number**: +1234567890
- **Message**: Hello from Node-RED!

## Node Configuration

### SMS Gateway Config Node

- **Name**: Optional identifier for the configuration
- **Base URL**: FastAPI SMS gateway endpoint
- **API Key**: Authentication key (stored securely)

### SMS Gateway Node Options

#### Operations

- **Send SMS**: Send a text message to a phone number
- **Get Inbox**: Retrieve received messages
- **Get Sent Messages**: Retrieve sent message history

#### Input Fields

- **Name**: Node identifier
- **Configuration**: Reference to SMS Gateway config
- **Operation**: Selected operation type
- **Phone Number**: Target phone number (for send)
- **Message**: SMS content (for send)
- **Limit**: Maximum results to return (for inbox/sent)

## Message Properties

### Input Message Properties

You can override node configuration using message properties:

```javascript
msg.operation = "send"; // Override operation
msg.phoneNumber = "+1234567890"; // Phone number
msg.message = "Hello World!"; // Message content
msg.limit = 100; // Result limit
```

### Output Message Properties

The node outputs results in `msg.payload`:

- **Send SMS**: Confirmation object with message ID and status
- **Inbox/Sent**: Array of message objects

## Usage Examples

### 1. Send SMS on Button Press

```
[inject] → [function] → [SMS Gateway] → [debug]
```

Function node code:

```javascript
msg.phoneNumber = "+1234567890";
msg.message = "Alert: Button was pressed at " + new Date();
return msg;
```

### 2. Check Inbox Periodically

```
[inject (repeat every 5min)] → [SMS Gateway] → [function] → [debug]
```

Configure SMS Gateway:

- Operation: Get Inbox
- Limit: 10

### 3. Send SMS Based on Sensor Data

```
[sensor] → [switch] → [template] → [SMS Gateway]
```

Switch node condition: `msg.payload > 30`
Template node: `Alert: Temperature is {{payload}}°C`

## API Endpoints

The plugin communicates with these FastAPI endpoints:

- `POST /sms` - Send SMS
- `GET /sms/inbox` - Get received messages
- `GET /sms/sent` - Get sent messages

## Error Handling

The node provides detailed error messages for common issues:

- **401 Unauthorized**: Invalid API key
- **403 Forbidden**: API key lacks permissions
- **Network Error**: Cannot reach SMS gateway
- **Validation Error**: Missing required fields
- **Timeout Error**: Request took too long

Status indicators show:

- 🟡 **Yellow dot**: Operation in progress
- 🟢 **Green dot**: Success
- 🔴 **Red ring**: Error occurred

## Security Considerations

- API keys are stored securely using Node-RED's credential system
- All communications use HTTPS when available
- API keys are never logged or exposed in debug output
- Connection testing occurs on node deployment

## Troubleshooting

### Common Issues

**"SMS Gateway configuration is missing"**

- Ensure you've created and selected a configuration node

**"API Key is required"**

- Check that your API key is entered in the configuration

**"Authentication failed: Invalid API Key"**

- Verify your API key is correct and active
- Check if the key has expired

**"Network Error: Unable to reach SMS gateway"**

- Verify the Base URL is correct
- Ensure the SMS gateway service is running
- Check network connectivity

**"Connection failed" on deployment**

- The node tests connectivity when deployed
- Check your configuration and service availability

### Debug Tips

1. Use debug nodes to inspect message flow
2. Check Node-RED logs for detailed error messages
3. Verify your FastAPI service is responding to API calls
4. Test API key authentication directly with curl or Postman

## Development and Support

### Requirements for SMS Gateway Service

Your FastAPI service should implement these endpoints:

- Authentication via API key (Bearer token or X-API-Key header)
- JSON response format
- Standard HTTP status codes
- CORS support if needed

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### Version 1.0.0

- Initial release
- Basic SMS send/receive functionality
- API key authentication
- Connection testing
- Comprehensive error handling

---

For more information and updates, visit the [project repository](https://github.com/Sci-Project-team/nodered-plugin).
