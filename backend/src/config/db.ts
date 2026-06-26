import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "./env";

const createPrismaClient = () => {
  const dbUrlString = env.DATABASE_URL;
  if (!dbUrlString) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }
  
  const dbUrl = new URL(dbUrlString);
  const host = dbUrl.hostname;
  const port = parseInt(dbUrl.port || "3306");
  const user = dbUrl.username;
  const password = decodeURIComponent(dbUrl.password || "");
  const database = dbUrl.pathname.replace(/^\//, "");
  
  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 10,
  });
  
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const db = createPrismaClient();
