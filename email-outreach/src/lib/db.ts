import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const dbUrlString = process.env.DATABASE_URL;
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
    // Default mariadb connectTimeout is ~1000ms, which is too short to open a
    // socket to a remote DB over a latent link (causes "failed to create
    // socket" + pool-timeout cascades). Give the handshake and pool acquisition
    // a realistic window.
    connectTimeout: 30000,
    acquireTimeout: 30000,
    // Recycle idle connections so stale sockets to the remote host don't linger.
    idleTimeout: 60,
  });
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
