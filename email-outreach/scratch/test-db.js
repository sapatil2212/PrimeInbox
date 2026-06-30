const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const dbUrlString = "mysql://bookmytime_remote:BookMyTimeRemote@123@77.37.47.89:3306/primeinbox";
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
  connectionLimit: 3,
  connectTimeout: 10000,
  acquireTimeout: 10000,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database at", host, "...");
  try {
    const start = Date.now();
    const count = await prisma.user.count();
    console.log("Successfully connected! User count:", count, "in", Date.now() - start, "ms");
  } catch (err) {
    console.error("Database connection failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
