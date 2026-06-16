"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";

export async function getAppointments(filters?: { date?: string; staffId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.staffId && filters.staffId !== "all") where.staffId = filters.staffId;
  if (filters?.status && filters.status !== "all") where.status = filters.status as AppointmentStatus;
  if (filters?.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    where.datetime = { gte: start, lt: end };
  }
  return prisma.appointment.findMany({
    where,
    include: { staff: true, service: true },
    orderBy: { datetime: "asc" },
  });
}

export async function createAppointment(data: {
  customerName: string;
  customerPhone: string;
  staffId: string;
  serviceId: string;
  datetime: string;
  notes?: string;
}) {
  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) throw new Error("Hizmet bulunamadı");
  const appointment = await prisma.appointment.create({
    data: {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      staffId: data.staffId,
      serviceId: data.serviceId,
      datetime: new Date(data.datetime),
      duration: service.duration,
      price: service.price,
      notes: data.notes,
    },
    include: { staff: true, service: true },
  });
  revalidatePath("/appointments");
  revalidatePath("/");
  return appointment;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: { staff: true, service: true },
  });
  revalidatePath("/appointments");
  revalidatePath("/");

  if (status === "COMPLETED" || status === "CANCELLED") {
    const timeStr = new Date(appointment.datetime).toLocaleString("tr-TR", { timeZone: "UTC", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
    const emoji = status === "COMPLETED" ? "✅" : "❌";
    const label = status === "COMPLETED" ? "Tamamlandı" : "İptal edildi";
    const msg = `${emoji} Randevu ${label}\n👤 ${appointment.customerName}\n💅 ${appointment.service.name}\n🕐 ${timeStr}\n👩 ${appointment.staff.name}`;
    await sendOwnerWhatsApp(msg).catch((e) => console.error("Owner WA error:", e));
  }

  return appointment;
}

async function sendOwnerWhatsApp(message: string) {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) return;
  await fetch(
    `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: ownerPhone,
        type: "text",
        text: { body: message },
      }),
    }
  );
}

export async function updateAppointment(id: string, data: {
  customerName?: string;
  staffId?: string;
  datetime?: string;
  notes?: string;
}) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...data,
      ...(data.datetime ? { datetime: new Date(data.datetime) } : {}),
    },
    include: { staff: true, service: true },
  });
  revalidatePath("/appointments");
  revalidatePath("/");
  return appointment;
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/appointments");
  revalidatePath("/");
}
