import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "@/lib/redis/client";
import { processEload } from "@/services/eload/eload.service";
import { processCashout } from "@/services/cashout/cashout.service";

process.on("uncaughtException", (err) => console.error("[worker] uncaughtException:", err));
process.on("unhandledRejection", (err) => console.error("[worker] unhandledRejection:", err));

const connection = redis;

const eloadWorker = new Worker(
  "eload",
  async (job) => {
    const { transactionId, holdId } = job.data;
    console.log(`[eload] processing job ${job.id} txn=${transactionId}`);
    return processEload(transactionId, holdId);
  },
  { connection, concurrency: 5 }
);
eloadWorker.on("completed", (job) => console.log(`[eload] job ${job.id} completed`));
eloadWorker.on("failed", (job, err) => console.error(`[eload] job ${job?.id} failed:`, err.message));
eloadWorker.on("error", (err) => console.error("[eload] worker error:", err));

const cashoutWorker = new Worker(
  "cashout",
  async (job) => {
    const { transactionId, holdId } = job.data;
    console.log(`[cashout] processing job ${job.id} txn=${transactionId}`);
    return processCashout(transactionId, holdId);
  },
  { connection, concurrency: 3 }
);
cashoutWorker.on("completed", (job) => console.log(`[cashout] job ${job.id} completed`));
cashoutWorker.on("failed", (job, err) => console.error(`[cashout] job ${job?.id} failed:`, err.message));
cashoutWorker.on("error", (err) => console.error("[cashout] worker error:", err));

const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { userId, title, message, type } = job.data;
    const { prisma } = await import("@/lib/database/prisma");
    await prisma.notification.create({ data: { userId, title, message, type } });
  },
  { connection }
);
notificationWorker.on("error", (err) => console.error("[notification] worker error:", err));

console.log("Workers started");
