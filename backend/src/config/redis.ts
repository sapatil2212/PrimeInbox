import Redis from "ioredis";
import { env } from "./env";

const redisUrl = new URL(env.REDIS_URL);

export const redisConnection = {
  host: redisUrl.hostname || "127.0.0.1",
  port: parseInt(redisUrl.port || "6379"),
  password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
  maxRetriesPerRequest: null, // Required for BullMQ workers
};

export const createRedisClient = () => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
};
