export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { WhatsAppClient } from "./WhatsAppClient";

export default async function WhatsAppPage() {
  const conversations = await prisma.waConversation.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const convData = conversations.map((c) => {
    const ctx = (c.context ?? {}) as Record<string, unknown>;
    const history = Array.isArray(ctx.history)
      ? (ctx.history as { role: string; content: string }[])
      : [];
    return {
      id: c.id,
      phone: c.phone,
      state: c.state,
      updatedAt: c.updatedAt.toISOString(),
      history,
    };
  });

  const settings = {
    ownerPhone: process.env.OWNER_PHONE ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    hasToken: !!process.env.WHATSAPP_TOKEN,
    hasCronSecret: !!process.env.CRON_SECRET,
    cronUrl: process.env.WHATSAPP_PHONE_NUMBER_ID
      ? `/api/cron/reminders?secret=***`
      : "",
  };

  return <WhatsAppClient conversations={convData} settings={settings} />;
}
