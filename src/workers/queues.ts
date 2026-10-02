import { Queue } from "bullmq";
import { redis } from "@/lib/redis/client";

const connection = redis;

export const eloadQueue = new Queue("eload", { connection });
export const cashoutQueue = new Queue("cashout", { connection });
export const webhookQueue = new Queue("webhook", { connection });
export const notificationQueue = new Queue("notification", { connection });
