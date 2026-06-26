import { runCampaignScheduler } from "./cron/scheduler";
import { resetHourlyLimits, resetDailyLimits } from "./cron/limits-reset";
import { db } from "./config/db";

console.log("🚀 PrimeInbox Background Worker starting up...");

// 1. Start Campaign Scheduler Loop (runs once every 60 seconds)
const schedulerInterval = setInterval(() => {
  runCampaignScheduler().catch((err) => {
    console.error("[Scheduler Error] Failure in campaign run loop:", err);
  });
}, 60000);

// Run campaign scheduler immediately on startup
runCampaignScheduler().catch((err) => {
  console.error("[Scheduler Error] Initial campaign scan failed:", err);
});

// 2. Start Cron Checkers (runs once every minute to align hourly/daily resets)
const cronInterval = setInterval(() => {
  const now = new Date();
  
  // Every hour on the hour (minute 0)
  if (now.getMinutes() === 0) {
    resetHourlyLimits().catch((err) => console.error("[Cron Error] Hourly limits reset failed:", err));
  }

  // Every day at midnight (hour 0, minute 0)
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    resetDailyLimits().catch((err) => console.error("[Cron Error] Daily limits reset failed:", err));
  }
}, 60000);

console.log("✅ Scheduler initialized — running without Redis (direct dispatch mode).");

// 3. Graceful Shutdown handlers
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Commencing graceful shutdown...`);

  // Clear intervals
  clearInterval(schedulerInterval);
  clearInterval(cronInterval);

  try {
    // Close Database Client connection
    console.log("Disconnecting Prisma Client...");
    await db.$disconnect();
    console.log("Prisma Client disconnected.");

    console.log("👋 Graceful shutdown completed. Exiting process.");
    process.exit(0);
  } catch (error) {
    console.error("⚠️ Error during shutdown sequence:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
