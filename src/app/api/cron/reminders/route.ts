import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { day: 0, hour: 0, errors: 0 };

  const windows = [
    { type: "1day", hoursAhead: 24, label: "yarın" },
    { type: "2hour", hoursAhead: 2, label: "2 saat sonra" },
  ];

  for (const window of windows) {
    const target = new Date(now.getTime() + window.hoursAhead * 60 * 60 * 1000);
    const from = new Date(target.getTime() - 10 * 60 * 1000); // -10 min
    const to = new Date(target.getTime() + 10 * 60 * 1000);   // +10 min

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        datetime: { gte: from, lte: to },
        reminders: { none: { type: window.type } },
      },
      include: { service: true, staff: true },
    });

    for (const appt of appointments) {
      try {
        const timeStr = new Date(appt.datetime).toLocaleString("tr-TR", {
          day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
        });
        const msg =
          `💅 Merhaba ${appt.customerName}! Belle Studio randevu hatırlatması:\n\n` +
          `📅 ${timeStr}\n` +
          `✨ ${appt.service.emoji} ${appt.service.name}\n` +
          `👩 ${appt.staff.name}\n\n` +
          `Randevunuz ${window.label} — sizi bekliyoruz! 🌸\n` +
          `İptal için bu numarayı arayabilirsiniz.`;

        await sendWhatsApp(appt.customerPhone, msg);

        await prisma.sentReminder.create({
          data: { appointmentId: appt.id, type: window.type },
        });

        if (window.type === "1day") results.day++;
        else results.hour++;
      } catch (err) {
        console.error("Reminder error:", appt.id, err);
        results.errors++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results, checkedAt: now.toISOString() });
}

async function sendWhatsApp(to: string, message: string) {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}
