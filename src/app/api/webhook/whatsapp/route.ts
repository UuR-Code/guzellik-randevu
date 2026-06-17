import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ConvState = "IDLE" | "ASK_SERVICE" | "ASK_STAFF" | "ASK_DATETIME" | "ASK_SLOT" | "ASK_NAME" | "CONFIRM";

type BookingCtx = {
  customerName?: string;
  serviceId?: string;
  serviceName?: string;
  staffId?: string;
  staffName?: string;
  datetime?: string;
  pendingDate?: string;
  lastMsgId?: string;
};

// GET — Meta webhook verification
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

// POST — Incoming messages
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    if (!message || message.type !== "text") return NextResponse.json({ ok: true });

    const phone = message.from;
    const text = message.text.body.trim();
    const msgId = message.id;

    let conv = await prisma.waConversation.findUnique({ where: { phone } });
    const ctx = ((conv?.context ?? {}) as BookingCtx);
    if (ctx.lastMsgId === msgId) return NextResponse.json({ ok: true });

    if (!conv) {
      conv = await prisma.waConversation.create({ data: { phone, state: "IDLE", context: {} } });
    }

    const [services, staffList] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, include: { staff: { include: { staff: true } } } }),
      prisma.staff.findMany({ where: { isActive: true }, include: { workingHours: true } }),
    ]);

    let state = conv.state as ConvState;
    let newCtx: BookingCtx = { ...ctx, lastMsgId: msgId };
    let reply = "";

    switch (state) {
      case "IDLE": {
        const wantsBook = await llmYesNo(
          `Kullanıcı mesajı: "${text}"\nBu kişi randevu almak istiyor mu? Sadece "evet" veya "hayır" yaz.`
        );
        if (wantsBook) {
          reply = buildServiceList(services, newCtx.customerName);
          state = "ASK_SERVICE";
          newCtx = { customerName: newCtx.customerName, lastMsgId: msgId };
        } else {
          reply = await llmFreeReply(text, newCtx.customerName, "Belle Studio güzellik salonunun WhatsApp asistanısın. Kısa ve samimi cevap ver. Randevu dışı konularda yardım edemeyeceğini nazikçe belirt, randevu almaya yönlendir.");
        }
        break;
      }

      case "ASK_SERVICE": {
        const serviceNames = services.map(s => `${s.name} (id:${s.id})`).join(", ");
        const picked = await llmExtract(
          `Hizmetler: ${serviceNames}\nKullanıcı: "${text}"\nHangi hizmetin id'sini seçti? Sadece id yaz, hiçbiri değilse "null" yaz.`
        );
        const svc = services.find(s => s.id === picked);
        if (!svc) {
          reply = `Hangi hizmeti almak istersiniz? Lütfen aşağıdan seçin:\n\n${services.map(s => `${s.emoji} *${s.name}* — ${s.price}₺`).join("\n")}`;
        } else {
          newCtx.serviceId = svc.id;
          newCtx.serviceName = svc.name;
          const eligibleStaff = svc.staff.map(ss => ss.staff);
          if (eligibleStaff.length === 1) {
            newCtx.staffId = eligibleStaff[0].id;
            newCtx.staffName = eligibleStaff[0].name;
            reply = `${svc.emoji} *${svc.name}* seçildi! Uzmanınız: *${eligibleStaff[0].name}*\n\nHangi gün ve saat uygun? (ör: "yarın 14:00", "cuma öğleden sonra")`;
            state = "ASK_DATETIME";
          } else {
            reply = `${svc.emoji} *${svc.name}* için uzmanlarımız:\n\n${eligibleStaff.map(s => `👩 *${s.name}*`).join("\n")}\n\nHangisini tercih edersiniz?`;
            state = "ASK_STAFF";
          }
        }
        break;
      }

      case "ASK_STAFF": {
        const svc = services.find(s => s.id === newCtx.serviceId)!;
        const eligibleStaff = svc.staff.map(ss => ss.staff);
        const staffNames = eligibleStaff.map(s => `${s.name} (id:${s.id})`).join(", ");
        const picked = await llmExtract(
          `Uzmanlar: ${staffNames}\nKullanıcı: "${text}"\nHangi uzmanın id'sini seçti veya "farketmez" mi dedi? Id veya "any" yaz.`
        );
        const st = eligibleStaff.find(s => s.id === picked) ?? eligibleStaff[0];
        newCtx.staffId = st.id;
        newCtx.staffName = st.name;
        reply = `👩 *${st.name}* seçildi!\n\nHangi gün ve saat uygun?`;
        state = "ASK_DATETIME";
        break;
      }

      case "ASK_DATETIME": {
        const nowTR = new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const dateResult = await llmExtract(
          `Bugün: ${nowTR}\nKullanıcı: "${text}"\nTarih ve saati ISO 8601 +03:00 formatında çıkar. Sadece şu formatı döndür: "2026-06-20T14:00:00+03:00" veya sadece tarihi "2026-06-20" veya "null".`
        );
        if (!dateResult || dateResult === "null") {
          reply = "Hangi gün ve saat uygun? (ör: \"yarın 14:00\", \"cuma 15:30\", \"20 haziran öğleden sonra\")";
          break;
        }

        const st = staffList.find(s => s.id === newCtx.staffId)!;
        const svc = services.find(s => s.id === newCtx.serviceId)!;

        if (dateResult.includes("T")) {
          // Full datetime given
          newCtx.datetime = dateResult;
          if (newCtx.customerName) {
            reply = buildConfirmMsg(newCtx, svc);
            state = "CONFIRM";
          } else {
            reply = "Harika! 😊 Adınızı öğrenebilir miyim?";
            state = "ASK_NAME";
          }
        } else {
          // Only date given, show slots
          const slots = getSlots(st, svc, dateResult);
          if (slots.length === 0) {
            const dateLabel = new Date(dateResult).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });
            reply = `${dateLabel} günü *${st.name}* müsait değil. Başka bir gün tercih eder misiniz?`;
          } else {
            newCtx.pendingDate = dateResult;
            const dateLabel = new Date(dateResult).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });
            reply = `${dateLabel} için *${st.name}*'nın müsait saatleri:\n\n${slots.map(s => `⏰ ${s.label}`).join("\n")}\n\nHangi saat uygun?`;
            state = "ASK_SLOT";
          }
        }
        break;
      }

      case "ASK_SLOT": {
        const st = staffList.find(s => s.id === newCtx.staffId)!;
        const svc = services.find(s => s.id === newCtx.serviceId)!;
        const slots = getSlots(st, svc, newCtx.pendingDate!);
        const slotLabels = slots.map(s => `${s.label} (iso:${s.iso})`).join(", ");
        const picked = await llmExtract(
          `Müsait slotlar: ${slotLabels}\nKullanıcı: "${text}"\nHangi slotun iso değerini seçti? Sadece iso değerini yaz.`
        );
        const slot = slots.find(s => s.iso === picked) ?? slots.find(s => s.label.includes(picked ?? ""));
        if (!slot) {
          reply = `Lütfen aşağıdaki saatlerden birini seçin:\n\n${slots.map(s => `⏰ ${s.label}`).join("\n")}`;
        } else {
          newCtx.datetime = slot.iso;
          if (newCtx.customerName) {
            reply = buildConfirmMsg(newCtx, svc);
            state = "CONFIRM";
          } else {
            reply = "Harika! 😊 Adınızı öğrenebilir miyim?";
            state = "ASK_NAME";
          }
        }
        break;
      }

      case "ASK_NAME": {
        const name = await llmExtract(
          `Kullanıcı: "${text}"\nBu mesajdaki kişi adını çıkar. Sadece adı yaz (ör: "Uğur", "Ayşe Kaya").`
        );
        const finalName = name && name !== "null" ? name : text.trim();
        newCtx.customerName = finalName;
        const svc = services.find(s => s.id === newCtx.serviceId)!;
        reply = buildConfirmMsg(newCtx, svc);
        state = "CONFIRM";
        break;
      }

      case "CONFIRM": {
        const svc = services.find(s => s.id === newCtx.serviceId)!;
        const decision = await llmExtract(
          `Kullanıcı: "${text}"\nRandevu onaylamak için "evet", iptal için "hayır", değişiklik için ne değiştirmek istediğini ("isim", "tarih", "uzman", "hizmet") yaz.`
        );

        if (decision === "evet" || decision === "yes") {
          const appt = await prisma.appointment.create({
            data: {
              customerName: newCtx.customerName!,
              customerPhone: phone,
              staffId: newCtx.staffId!,
              serviceId: newCtx.serviceId!,
              datetime: new Date(newCtx.datetime!),
              duration: svc.duration,
              price: svc.price,
              status: "CONFIRMED",
            },
            include: { staff: true },
          });
          const timeStr = new Date(appt.datetime).toLocaleString("tr-TR", { timeZone: "UTC", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
          await sendOwner(`📅 Yeni randevu!\n👤 ${appt.customerName}\n💅 ${svc.name}\n🕐 ${timeStr}\n👩 ${appt.staff.name}`);
          reply = `✅ Randevunuz oluşturuldu, ${newCtx.customerName}!\n\n${svc.emoji} *${svc.name}*\n📅 ${timeStr}\n👩 *${appt.staff.name}*\n\nSizi bekliyoruz! 🌸`;
          state = "IDLE";
          newCtx = { customerName: newCtx.customerName, lastMsgId: msgId };
        } else if (decision === "hayır" || decision === "no") {
          reply = "Randevu iptal edildi. Yeni randevu almak ister misiniz?";
          state = "IDLE";
          newCtx = { customerName: newCtx.customerName, lastMsgId: msgId };
        } else if (decision === "isim") {
          reply = "Adınızı güncelleyelim, yeni adınız nedir?";
          state = "ASK_NAME";
        } else if (decision === "tarih") {
          reply = "Hangi gün ve saat uygun?";
          state = "ASK_DATETIME";
        } else if (decision === "uzman") {
          const eligibleStaff = svc.staff.map(ss => ss.staff);
          reply = `Uzmanlarımız:\n\n${eligibleStaff.map(s => `👩 *${s.name}*`).join("\n")}\n\nHangisini tercih edersiniz?`;
          state = "ASK_STAFF";
        } else if (decision === "hizmet") {
          reply = buildServiceList(services, newCtx.customerName);
          state = "ASK_SERVICE";
          newCtx = { customerName: newCtx.customerName, lastMsgId: msgId };
        } else {
          reply = `${buildConfirmMsg(newCtx, svc)}\n\nOnaylıyor musunuz? (evet/hayır)`;
        }
        break;
      }
    }

    await sendWhatsApp(phone, reply);
    await prisma.waConversation.update({
      where: { phone },
      data: { state, context: newCtx },
    });
  } catch (err) {
    console.error("Webhook error:", err);
  }
  return NextResponse.json({ ok: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildServiceList(services: { id: string; name: string; emoji: string; price: { toString(): string }; duration: number }[], name?: string) {
  const greeting = name ? `Merhaba ${name}! 👋 ` : "Merhaba! 👋 ";
  const list = services.map(s => `${s.emoji} *${s.name}* — ${s.price}₺ (${s.duration} dk)`).join("\n");
  return `${greeting}Belle Studio'ya hoş geldiniz! ✨\n\nHizmetlerimiz:\n\n${list}\n\nHangisini almak istersiniz?`;
}

function buildConfirmMsg(ctx: BookingCtx, svc: { emoji: string; name: string }) {
  const dt = new Date(ctx.datetime!);
  const timeStr = dt.toLocaleString("tr-TR", { timeZone: "UTC", day: "2-digit", month: "long", weekday: "long", hour: "2-digit", minute: "2-digit" });
  return `📋 *Randevu Özeti*\n\n👤 *Ad:* ${ctx.customerName}\n${svc.emoji} *Hizmet:* ${svc.name}\n📅 *Tarih:* ${timeStr}\n👩 *Uzman:* ${ctx.staffName}\n\nOnaylıyor musunuz? (evet/hayır veya değişiklik yapmak istediğinizi belirtin)`;
}

type SlotItem = { label: string; iso: string; time: string };

function getSlots(st: { workingHours: { day: string; start: string | null; end: string | null; dayOff: boolean }[] }, svc: { duration: number }, dateStr: string): SlotItem[] {
  const date = new Date(dateStr + "T00:00:00Z");
  const dayName = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getUTCDay()];
  const wh = st.workingHours.find(h => h.day === dayName);
  if (!wh || wh.dayOff || !wh.start) return [];
  const [sh, sm] = wh.start.split(":").map(Number);
  const [eh, em] = (wh.end || "18:00").split(":").map(Number);
  const slots: SlotItem[] = [];
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + svc.duration <= endMin && slots.length < 10) {
    const h = String(Math.floor(cur / 60)).padStart(2, "0");
    const m = String(cur % 60).padStart(2, "0");
    const label = `${h}:${m}`;
    const iso = `${dateStr}T${h}:${m}:00+03:00`;
    slots.push({ label, iso, time: label });
    cur += 30;
  }
  return slots;
}

async function llmYesNo(prompt: string): Promise<boolean> {
  const r = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 10,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (r.content[0] as Anthropic.TextBlock).text.toLowerCase().trim();
  return text.startsWith("evet") || text.startsWith("yes");
}

async function llmExtract(prompt: string): Promise<string | null> {
  const r = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (r.content[0] as Anthropic.TextBlock).text.trim();
  return text === "null" ? null : text;
}

async function llmFreeReply(userText: string, name: string | undefined, systemHint: string): Promise<string> {
  const r = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: systemHint + (name ? ` Kullanıcının adı: ${name}.` : ""),
    messages: [{ role: "user", content: userText }],
  });
  return (r.content[0] as Anthropic.TextBlock).text.trim();
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
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
    }
  );
  if (!res.ok) console.error("WhatsApp send error:", await res.text());
}

async function sendOwner(message: string) {
  if (!process.env.OWNER_PHONE) return;
  await sendWhatsApp(process.env.OWNER_PHONE, message).catch(e => console.error("Owner WA error:", e));
}
