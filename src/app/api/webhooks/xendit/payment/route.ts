import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Xendit is no longer used. Use PayMongo webhooks." }, { status: 410 });
}
