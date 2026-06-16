import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET — Meta webhook doğrulama
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Gelen mesajları işle
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    if (!message || message.type !== "text") return NextResponse.json({ ok: true });

    const phone = message.from;
    const text = message.text.body.trim();
    const msgId = message.id;

    // Duplicate check via conversation context
    const convCheck = await prisma.waConversation.findUnique({ where: { phone } });
    if ((convCheck?.context as Record<string, string>)?.lastMsgId === msgId) {
      return NextResponse.json({ ok: true });
    }

    // Get or create conversation
    let conv = await prisma.waConversation.findUnique({ where: { phone } });
    if (!conv) {
      conv = await prisma.waConversation.create({
        data: { phone, state: "IDLE", context: {} },
      });
    }

    // Load data for AI tools
    const [services, staff] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, include: { staff: { include: { staff: true } } } }),
      prisma.staff.findMany({ where: { isActive: true }, include: { workingHours: true } }),
    ]);

    // Claude tool-use
    const tools: Anthropic.Tool[] = [
      {
        name: "get_services",
        description: "Aktif hizmetlerin listesini döndür",
        input_schema: { type: "object" as const, properties: {}, required: [] },
      },
      {
        name: "get_available_staff",
        description: "Belirli bir hizmeti yapabilen uzmanları listele",
        input_schema: {
          type: "object" as const,
          properties: { service_id: { type: "string", description: "Hizmet ID'si" } },
          required: ["service_id"],
        },
      },
      {
        name: "get_available_slots",
        description: "Uzmanın müsait saatlerini getir (sonraki 3 gün)",
        input_schema: {
          type: "object" as const,
          properties: {
            staff_id: { type: "string" },
            service_id: { type: "string" },
          },
          required: ["staff_id", "service_id"],
        },
      },
      {
        name: "create_appointment",
        description: "Randevu oluştur",
        input_schema: {
          type: "object" as const,
          properties: {
            customer_name: { type: "string" },
            staff_id: { type: "string" },
            service_id: { type: "string" },
            datetime: { type: "string", description: "ISO 8601 format" },
          },
          required: ["customer_name", "staff_id", "service_id", "datetime"],
        },
      },
    ];

    const systemPrompt = `Sen Belle Studio güzellik salonunun WhatsApp asistanısın. Türkçe konuş. Kısa ve samimi ol. Emoji kullanabilirsin.

Mevcut konuşma durumu: ${conv.state}
Bağlam: ${JSON.stringify(conv.context)}

Müşteri senden randevu almak istiyorsa:
1. Hangi hizmeti istediğini sor (get_services kullan)
2. O hizmeti yapan uzmanları göster (get_available_staff kullan)
3. Müsait saatleri göster (get_available_slots kullan)
4. İsmini öğren ve randevuyu oluştur (create_appointment kullan)`;

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: text },
    ];

    let reply = "";
    let continueLoop = true;

    while (continueLoop) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        reply = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        continueLoop = false;
      } else if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          let result = "";
          const input = toolUse.input as Record<string, string>;

          if (toolUse.name === "get_services") {
            result = services.map((s) => `${s.emoji} ${s.name} (${s.duration} dk) — ${s.price}₺ [ID: ${s.id}]`).join("\n");
          } else if (toolUse.name === "get_available_staff") {
            const svc = services.find((s) => s.id === input.service_id);
            if (!svc) { result = "Hizmet bulunamadı"; }
            else {
              const eligible = svc.staff.map((ss) => ss.staff);
              result = eligible.map((s) => `${s.name} [ID: ${s.id}]`).join("\n") || "Müsait uzman yok";
            }
          } else if (toolUse.name === "get_available_slots") {
            const st = staff.find((s) => s.id === input.staff_id);
            const svc = services.find((s) => s.id === input.service_id);
            if (!st || !svc) { result = "Bulunamadı"; }
            else {
              const slots: string[] = [];
              const now = new Date();
              for (let d = 1; d <= 3; d++) {
                const date = new Date(now);
                date.setDate(date.getDate() + d);
                const dayName = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getDay()];
                const wh = st.workingHours.find((h) => h.day === dayName);
                if (!wh || wh.dayOff || !wh.start) continue;
                const [sh, sm] = wh.start.split(":").map(Number);
                const [eh, em] = (wh.end || "18:00").split(":").map(Number);
                let cur = sh * 60 + sm;
                const endMin = eh * 60 + em;
                while (cur + svc.duration <= endMin) {
                  const h = String(Math.floor(cur / 60)).padStart(2, "0");
                  const m = String(cur % 60).padStart(2, "0");
                  const dateStr = date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" });
                  slots.push(`${dateStr} ${h}:${m}`);
                  cur += 30;
                  if (slots.length >= 6) break;
                }
                if (slots.length >= 6) break;
              }
              result = slots.length > 0 ? slots.join("\n") : "Müsait slot bulunamadı";
            }
          } else if (toolUse.name === "create_appointment") {
            const svc = services.find((s) => s.id === input.service_id);
            if (!svc) { result = "Hizmet bulunamadı"; }
            else {
              const appt = await prisma.appointment.create({
                data: {
                  customerName: input.customer_name,
                  customerPhone: phone,
                  staffId: input.staff_id,
                  serviceId: input.service_id,
                  datetime: new Date(input.datetime),
                  duration: svc.duration,
                  price: svc.price,
                  status: "CONFIRMED",
                },
                include: { staff: true },
              });
              // Notify salon owner
              await sendWhatsApp(
                process.env.OWNER_PHONE!,
                `📅 Yeni randevu!\n👤 ${appt.customerName}\n💅 ${svc.name}\n🕐 ${new Date(appt.datetime).toLocaleString("tr-TR")}\n👩 ${appt.staff.name}`
              );
              result = `Randevu oluşturuldu: ${appt.id}`;
            }
          }

          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
        }

        messages.push({ role: "user", content: toolResults });
      } else {
        continueLoop = false;
      }
    }

    if (reply) {
      await sendWhatsApp(phone, reply);
      await prisma.waConversation.update({
        where: { phone },
        data: { state: "ACTIVE", context: { lastMsgId: msgId, lastMessage: text, lastReply: reply } },
      });
    }
  } catch (err) {
    console.error("Webhook error:", err);
  }

  return NextResponse.json({ ok: true });
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
  if (!res.ok) console.error("WhatsApp send error:", await res.text());
}
