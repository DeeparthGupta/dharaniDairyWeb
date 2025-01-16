module.exports = {
  apps: [{
    name: "dharaniWeb",          // Application name
    script: "./server.js",         // Server
    watch: true,                   // Watch for file changes
    env: {
      NODE_ENV: "production",
      PORT: 5000                   
    },
    max_memory_restart: "500M",    // Restart if memory exceeds 500M
  }]
};