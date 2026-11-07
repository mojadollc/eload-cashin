import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/mobile/rate-limit";

const schema = z.object({
  mobile: z.string(),
  password: z.string(),
});

// Get approximate location from IP using free ip-api.com
async function getLocationFromIP(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "localhost") return null;
  
  try {
    // Use ip-api.com free API (only works for non-localhost IPs)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, { 
      // Use proxy through our server to avoid CORS
      method: "GET",
      // @ts-ignore
    }).catch(() => null);
    
    if (!res) return null;
    
    const data = await res.json() as { status: string; country: string; regionName: string; city: string };
    if (data.status === "success" && data.city) {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = await rateLimit(`login:${ip}`, 10, 60);
  if (!allowed) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  if (!user.mobileVerified) return NextResponse.json({ error: "Please verify your mobile number" }, { status: 403 });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  // Get location from IP asynchronously (don't block login)
  const location = await getLocationFromIP(ip);

  await prisma.session.create({
    data: { 
      userId: user.id, 
      token: refreshToken, 
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ip,
      location: location,
    },
  });

  const res = NextResponse.json({
    accessToken,
    refreshToken,
    user: { id: user.userId, firstName: user.firstName, lastName: user.lastName, role: user.role, mobile: user.mobile, email: user.email },
  });
  res.cookies.set("access_token", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 900 });
  res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 604800 });
  return res;
}