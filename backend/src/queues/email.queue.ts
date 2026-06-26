import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

// Define the name of the queue
export const EMAIL_QUEUE_NAME = "email-sending";

// Create and export the email queue
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Wait 5s, then 10s, then 20s...
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep successful logs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed logs for 7 days
      count: 5000,
    },
  },
});
