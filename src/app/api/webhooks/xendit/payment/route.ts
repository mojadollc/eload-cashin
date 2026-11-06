import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Not used. App uses PayMongo." }, { status: 410 });
}
