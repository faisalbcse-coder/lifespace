import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Execute SQLite PRAGMAs on connection for data safety, WAL mode, foreign keys, and busy timeout
  client.$queryRawUnsafe("PRAGMA foreign_keys = ON;").catch(() => {});
  client.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
  client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});

  return client;
};

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
