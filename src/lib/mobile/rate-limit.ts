import { redis } from "@/lib/redis/client";

/**
 * Sliding window rate limiter using Redis.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(redisKey, 0, now - windowMs);
  pipe.zadd(redisKey, now, `${now}`);
  pipe.zcard(redisKey);
  pipe.expire(redisKey, windowSeconds);
  const results = await pipe.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
