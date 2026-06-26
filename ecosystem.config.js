module.exports = {
  apps: [
    {
      name: "primeinbox-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./email-outreach",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "primeinbox-backend",
      script: "dist/index.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
