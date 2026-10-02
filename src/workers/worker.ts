import { Worker } from "bullmq";
import { redis } from "@/lib/redis/client";
import { processEload } from "@/services/eload/eload.service";
import { processCashout } from "@/services/cashout/cashout.service";

const connection = redis;

new Worker(
  "eload",
  async (job) => {
    const { transactionId, holdId } = job.data;
    return processEload(transactionId, holdId);
  },
  { connection, concurrency: 5 }
);

new Worker(
  "cashout",
  async (job) => {
    const { transactionId, holdId } = job.data;
    return processCashout(transactionId, holdId);
  },
  { connection, concurrency: 3 }
);

new Worker(
  "notification",
  async (job) => {
    const { userId, title, message, type } = job.data;
    const { prisma } = await import("@/lib/database/prisma");
    await prisma.notification.create({ data: { userId, title, message, type } });
  },
  { connection }
);

console.log("Workers started");
