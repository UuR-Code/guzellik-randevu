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
        description: "Uzmanın müsait saatlerini getir. date parametresi verilirse o güne ait slotları döner, verilmezse sonraki 7 günü tarar.",
        input_schema: {
          type: "object" as const,
          properties: {
            staff_id: { type: "string" },
            service_id: { type: "string" },
            date: { type: "string", description: "ISO 8601 tarih (ör: 2026-06-20). Opsiyonel." },
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

    const nowTR = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
    const systemPrompt = `Sen Belle Studio güzellik salonunun WhatsApp asistanısın. Türkçe konuş. Kısa ve samimi ol. Emoji kullanabilirsin.

Şu anki Türkiye saati: ${nowTR}

MUTLAK KURALLAR (asla ihlal etme):
- Salon telefonu: 0554 464 70 61. Başka numara YAZMA, uydurma.
- Uzman veya hizmet adı UYDURMAYACAKSIN. Sadece tool'dan gelen sonuçları kullan.
- Her zaman önce get_services çağır, servis ID'sini asla tahmin etme.
- get_available_staff sonucu boş gelirse: "Bu hizmet için şu an uygun uzmanımız yok, lütfen 0554 464 70 61'i ara." de.
- get_available_slots sonucu boş gelirse: "Bu tarihte uygun saat yok, başka bir gün deneyelim mi?" de ve başka gün sor.
- Müşteri "farketmez", "sen seç" derse ilk gelen uzmanı/saati seç ve devam et — pes etme.
- Randevu akışı bitmeden asla "telefon et" veya "salona gel" deme.

RANDEVU AKIŞI (sırasıyla, bu sırayı bozma):
1. get_services çağır → hizmet listesini göster, müşteriden seçmesini iste
2. get_available_staff çağır (service_id ile) → uzman listesini göster
3. Tarih/saat öğren → get_available_slots çağır (staff_id + service_id ile)
4. İsim al → create_appointment çağır

KESİN KURAL: Randevu onayı vermeden önce create_appointment tool'unu MUTLAKA çağırmalısın. Tool çağırmadan "randevun oluşturuldu" veya "randevun hazır" YAZMA. create_appointment sonucunda gelen ID'yi onay mesajında göster.

TARİH/SAAT: Tüm datetime değerlerini "+03:00" offset ile ISO 8601 formatında gönder. Örnek: "2026-06-20T14:00:00+03:00"

Mevcut konuşma durumu: ${conv.state}`;

    // Load conversation history (last 10 exchanges)
    const ctx = (conv.context ?? {}) as Record<string, unknown>;
    const history: Anthropic.MessageParam[] = Array.isArray(ctx.history)
      ? (ctx.history as Anthropic.MessageParam[]).slice(-20)
      : [];

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: text },
    ];

    let reply = "";
    let continueLoop = true;
    let appointmentCreated = false;

    while (continueLoop) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        const candidateReply = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");

        // If Claude is confirming a booking without having called create_appointment, force the tool call
        const looksLikeConfirmation = /randev|oluştur|ayarland|kaydedil|hazır|onaylandı/i.test(candidateReply);
        if (looksLikeConfirmation && !appointmentCreated) {
          messages.push({ role: "assistant", content: candidateReply });
          messages.push({ role: "user", content: "create_appointment tool'unu çağırarak randevuyu sisteme kaydet. Tool çağırmadan randevu oluşturulmuş sayılmaz." });
          continue;
        }

        reply = candidateReply;
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
              const specificDate = input.date ? new Date(input.date) : null;
              const daysToCheck = specificDate ? 1 : 7;

              for (let d = 0; d < (specificDate ? 1 : 7); d++) {
                let checkDate: Date;
                if (specificDate) {
                  checkDate = new Date(specificDate);
                } else {
                  checkDate = new Date(now);
                  checkDate.setDate(checkDate.getDate() + d + 1);
                }
                const dayName = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][checkDate.getDay()];
                const wh = st.workingHours.find((h) => h.day === dayName);
                if (!wh || wh.dayOff || !wh.start) continue;
                const [sh, sm] = wh.start.split(":").map(Number);
                const [eh, em] = (wh.end || "18:00").split(":").map(Number);
                let cur = sh * 60 + sm;
                const endMin = eh * 60 + em;
                const dateStr = checkDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", timeZone: "UTC" });
                while (cur + svc.duration <= endMin) {
                  const h = String(Math.floor(cur / 60)).padStart(2, "0");
                  const m = String(cur % 60).padStart(2, "0");
                  slots.push(`${dateStr} ${h}:${m}`);
                  cur += 30;
                  if (slots.length >= 8) break;
                }
              }
              void daysToCheck;
              result = slots.length > 0 ? slots.join("\n") : "Müsait slot bulunamadı";
            }
          } else if (toolUse.name === "create_appointment") {
            console.log("create_appointment input:", JSON.stringify(input));
            appointmentCreated = true;
            const svc = services.find((s) => s.id === input.service_id);
            if (!svc) { result = `Hizmet bulunamadı: service_id=${input.service_id}`; console.error("Service not found:", input.service_id); }
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
                `📅 Yeni randevu!\n👤 ${appt.customerName}\n💅 ${svc.name}\n🕐 ${new Date(appt.datetime).toLocaleString("tr-TR", { timeZone: "UTC" })}\n👩 ${appt.staff.name}`
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

      // Save history (only text exchanges, max 20 items)
      const newHistory: Anthropic.MessageParam[] = [
        ...history,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ].slice(-20);

      await prisma.waConversation.update({
        where: { phone },
        data: { state: "ACTIVE", context: { lastMsgId: msgId, history: newHistory } },
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
