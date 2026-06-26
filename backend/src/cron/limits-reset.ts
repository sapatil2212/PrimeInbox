import { db } from "../config/db";

/**
 * Resets all SMTP account hourly sending counts back to zero.
 * Intended to be executed every hour on the hour.
 */
export async function resetHourlyLimits() {
  console.log("[Cron] Resetting SMTP hourly sending limits...");
  try {
    const result = await db.smtpAccount.updateMany({
      data: {
        currentHourlyCount: 0,
      },
    });
    console.log(`[Cron] Reset ${result.count} SMTP hourly limit counters.`);
  } catch (error) {
    console.error("[Cron] Failed to reset SMTP hourly sending limits:", error);
  }
}

/**
 * Resets all SMTP account daily sending counts back to zero.
 * Intended to be executed every day at midnight (00:00).
 */
export async function resetDailyLimits() {
  console.log("[Cron] Resetting SMTP daily sending limits...");
  try {
    const result = await db.smtpAccount.updateMany({
      data: {
        currentDailyCount: 0,
      },
    });
    console.log(`[Cron] Reset ${result.count} SMTP daily limit counters.`);
  } catch (error) {
    console.error("[Cron] Failed to reset SMTP daily sending limits:", error);
  }
}
