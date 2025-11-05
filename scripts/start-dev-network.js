#!/usr/bin/env node

/**
 * Start Dev Server with Network Access
 * 
 * This script starts the Next.js dev server with network access
 * so you can access it from other devices on your network
 */

const { spawn } = require('child_process');
const os = require('os');

// Get network interfaces
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and IPv6 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Allow network access
const NETWORK_IP = getNetworkIP();

console.log('🚀 Starting Next.js Dev Server with Network Access');
console.log('================================================\n');

console.log(`📡 Local access: http://localhost:${PORT}`);
console.log(`🌐 Network access: http://${NETWORK_IP}:${PORT}`);
console.log(`🧪 Test page: http://${NETWORK_IP}:${PORT}/test-image-upload.html`);
console.log(`🧪 Test page (local): http://localhost:${PORT}/test-image-upload.html`);

console.log('\n📋 Available test URLs:');
console.log(`- Image Upload Test: http://${NETWORK_IP}:${PORT}/test-image-upload.html`);
console.log(`- API Base: http://${NETWORK_IP}:${PORT}/api`);
console.log(`- Properties API: http://${NETWORK_IP}:${PORT}/api/properties`);
console.log(`- Upload API: http://${NETWORK_IP}:${PORT}/api/properties/upload-images`);

console.log('\n🔧 Environment Variables:');
console.log(`- PORT: ${PORT}`);
console.log(`- HOST: ${HOST}`);
console.log(`- NETWORK_IP: ${NETWORK_IP}`);

console.log('\n💡 Tips:');
console.log('- Use the network IP to access from other devices');
console.log('- Make sure your firewall allows connections on port ' + PORT);
console.log('- The test page will automatically detect the correct API base URL');

console.log('\n🚀 Starting server...\n');

// Start the Next.js dev server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
    HOST: HOST
  }
});

// Handle server events
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n📊 Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  server.kill('SIGTERM');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  server.kill('SIGTERM');
  process.exit(1);
});




