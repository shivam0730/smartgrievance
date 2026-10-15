import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@/generated/prisma/client";
    
// Purana (galat):
import { PrismaClient } from "@/generated/prisma/client";

// Naya (sahi):
// import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

console.log("DB URL exists:", !!process.env.DATABASE_URL);
