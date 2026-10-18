import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      kycStatus: true,
      kycDocuments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, docType: true, fileUrl: true, status: true, reviewNote: true, createdAt: true },
      },
    },
  });
  if (!user) return fail("User not found", 404);
  return ok(user);
});

const schema = z.object({
  docType: z.enum(["GOVERNMENT_ID", "SELFIE", "PROOF_OF_ADDRESS"]),
  fileUrl: z.string().url(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400);

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { kycStatus: true } });
  if (user?.kycStatus === "VERIFIED") return fail("KYC already verified", 400);

  // Replace existing pending doc of same type
  await prisma.kycDocument.deleteMany({
    where: { userId: payload.userId, docType: parsed.data.docType, status: "PENDING" },
  });

  const doc = await prisma.kycDocument.create({
    data: { userId: payload.userId, docType: parsed.data.docType, fileUrl: parsed.data.fileUrl },
  });

  // Auto-set kycStatus to PENDING when first doc submitted
  await prisma.user.update({
    where: { id: payload.userId },
    data: { kycStatus: "PENDING" },
  });

  return ok(doc, 201);
});
