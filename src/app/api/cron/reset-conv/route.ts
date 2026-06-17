import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const phone = req.nextUrl.searchParams.get("phone");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (phone) {
    await prisma.waConversation.updateMany({
      where: { phone },
      data: { state: "IDLE", context: {} },
    });
    return NextResponse.json({ ok: true, reset: phone });
  }
  await prisma.waConversation.updateMany({ data: { state: "IDLE", context: {} } });
  return NextResponse.json({ ok: true, reset: "all" });
}
