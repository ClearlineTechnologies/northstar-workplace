import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { workcraftDb?: PrismaClient };
export const db = globalDb.workcraftDb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.workcraftDb = db;
