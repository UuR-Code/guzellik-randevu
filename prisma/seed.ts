import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  // Admin user
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@bellestudio.com" },
    update: {},
    create: { email: "admin@bellestudio.com", password: hash, name: "Admin" },
  });

  // Staff
  const ayse = await prisma.staff.upsert({
    where: { id: "s1" },
    update: {},
    create: {
      id: "s1", name: "Ayşe Kaya", phone: "0532 111 22 33",
      bio: "10 yıl deneyimli tırnak uzmanı", color: "#E8A4C8",
      workingHours: {
        create: [
          { day: "Pzt", start: "09:00", end: "18:00", dayOff: false },
          { day: "Sal", start: "09:00", end: "18:00", dayOff: false },
          { day: "Çar", start: "09:00", end: "18:00", dayOff: false },
          { day: "Per", start: "09:00", end: "18:00", dayOff: false },
          { day: "Cum", start: "09:00", end: "18:00", dayOff: false },
          { day: "Cmt", start: "10:00", end: "16:00", dayOff: false },
          { day: "Paz", start: null, end: null, dayOff: true },
        ],
      },
    },
  });

  const fatma = await prisma.staff.upsert({
    where: { id: "s2" },
    update: {},
    create: {
      id: "s2", name: "Fatma Demir", phone: "0533 444 55 66",
      bio: "Saç tasarımı ve boyama uzmanı", color: "#A8D8B9",
      workingHours: {
        create: [
          { day: "Pzt", start: "10:00", end: "19:00", dayOff: false },
          { day: "Sal", start: "10:00", end: "19:00", dayOff: false },
          { day: "Çar", start: null, end: null, dayOff: true },
          { day: "Per", start: "10:00", end: "19:00", dayOff: false },
          { day: "Cum", start: "10:00", end: "19:00", dayOff: false },
          { day: "Cmt", start: "10:00", end: "17:00", dayOff: false },
          { day: "Paz", start: null, end: null, dayOff: true },
        ],
      },
    },
  });

  const zeynep = await prisma.staff.upsert({
    where: { id: "s3" },
    update: {},
    create: {
      id: "s3", name: "Zeynep Arslan", phone: "0541 777 88 99",
      bio: "Cilt bakımı ve makyaj uzmanı", color: "#B4C8E8",
      workingHours: {
        create: [
          { day: "Pzt", start: "09:00", end: "17:00", dayOff: false },
          { day: "Sal", start: "09:00", end: "17:00", dayOff: false },
          { day: "Çar", start: "09:00", end: "17:00", dayOff: false },
          { day: "Per", start: null, end: null, dayOff: true },
          { day: "Cum", start: "09:00", end: "17:00", dayOff: false },
          { day: "Cmt", start: "10:00", end: "15:00", dayOff: false },
          { day: "Paz", start: null, end: null, dayOff: true },
        ],
      },
    },
  });

  // Services
  const manikur = await prisma.service.upsert({
    where: { id: "srv1" },
    update: {},
    create: { id: "srv1", name: "Manikür", description: "Kalıcı oje, şekillendirme dahil", emoji: "💅", duration: 45, price: 350 },
  });
  const pedikur = await prisma.service.upsert({
    where: { id: "srv2" },
    update: {},
    create: { id: "srv2", name: "Pedikür", description: "Oje + bakım paketi", emoji: "🦶", duration: 60, price: 400 },
  });
  const sacBoyama = await prisma.service.upsert({
    where: { id: "srv3" },
    update: {},
    create: { id: "srv3", name: "Saç Boyama", description: "Fön dahil, tüm teknikler", emoji: "💇", duration: 90, price: 800 },
  });
  const sacKesimi = await prisma.service.upsert({
    where: { id: "srv4" },
    update: {},
    create: { id: "srv4", name: "Saç Kesimi", description: "Yıkama ve fön dahil", emoji: "✂️", duration: 45, price: 300 },
  });
  const ciltBakim = await prisma.service.upsert({
    where: { id: "srv5" },
    update: {},
    create: { id: "srv5", name: "Cilt Bakımı", description: "Derin temizlik + maske", emoji: "🧖", duration: 60, price: 550 },
  });
  const makyaj = await prisma.service.upsert({
    where: { id: "srv6" },
    update: {},
    create: { id: "srv6", name: "Profesyonel Makyaj", description: "Özel gün, gelin makyajı", emoji: "💄", duration: 90, price: 1200, isActive: false },
  });

  // Staff-Service relations
  const relations = [
    { staffId: ayse.id, serviceId: manikur.id },
    { staffId: ayse.id, serviceId: pedikur.id },
    { staffId: ayse.id, serviceId: ciltBakim.id },
    { staffId: fatma.id, serviceId: pedikur.id },
    { staffId: fatma.id, serviceId: sacBoyama.id },
    { staffId: fatma.id, serviceId: sacKesimi.id },
    { staffId: zeynep.id, serviceId: ciltBakim.id },
    { staffId: zeynep.id, serviceId: makyaj.id },
  ];

  for (const rel of relations) {
    await prisma.staffService.upsert({
      where: { staffId_serviceId: rel },
      update: {},
      create: rel,
    });
  }

  // Sample appointments
  const appts = [
    { id: "a1", customerName: "Selin Yıldız", customerPhone: "0530 123 45 67", staffId: "s1", serviceId: "srv1", datetime: new Date("2026-06-03T10:00:00"), duration: 45, price: 350, status: "CONFIRMED" as const },
    { id: "a2", customerName: "Merve Çelik", customerPhone: "0535 234 56 78", staffId: "s2", serviceId: "srv3", datetime: new Date("2026-06-03T11:00:00"), duration: 90, price: 800, status: "CONFIRMED" as const },
    { id: "a3", customerName: "Elif Şahin", customerPhone: "0542 345 67 89", staffId: "s3", serviceId: "srv5", datetime: new Date("2026-06-03T09:30:00"), duration: 60, price: 550, status: "COMPLETED" as const },
    { id: "a4", customerName: "Büşra Koç", customerPhone: "0543 456 78 90", staffId: "s1", serviceId: "srv2", datetime: new Date("2026-06-03T14:00:00"), duration: 60, price: 400, status: "CONFIRMED" as const },
    { id: "a5", customerName: "Hande Aydın", customerPhone: "0544 567 89 01", staffId: "s2", serviceId: "srv4", datetime: new Date("2026-06-03T15:30:00"), duration: 45, price: 300, status: "CANCELLED" as const },
  ];

  for (const a of appts) {
    await prisma.appointment.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  console.log("✅ Seed tamamlandı");
}

main().catch(console.error).finally(() => prisma.$disconnect());
