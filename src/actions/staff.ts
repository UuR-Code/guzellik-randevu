"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStaff() {
  return prisma.staff.findMany({
    include: {
      services: { include: { service: true } },
      workingHours: { orderBy: { id: "asc" } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createStaff(data: {
  name: string; phone?: string; bio?: string; color?: string;
  serviceIds: string[];
  workingHours: { day: string; start?: string; end?: string; dayOff: boolean }[];
}) {
  const { serviceIds, workingHours, ...rest } = data;
  const staff = await prisma.staff.create({
    data: {
      ...rest,
      services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
      workingHours: { create: workingHours },
    },
    include: { services: { include: { service: true } }, workingHours: true },
  });
  revalidatePath("/staff");
  return staff;
}

export async function updateStaff(id: string, data: {
  name?: string; phone?: string; bio?: string; isActive?: boolean;
  serviceIds?: string[];
  workingHours?: { day: string; start?: string; end?: string; dayOff: boolean }[];
}) {
  const { serviceIds, workingHours, ...rest } = data;
  if (serviceIds !== undefined) {
    await prisma.staffService.deleteMany({ where: { staffId: id } });
    await prisma.staffService.createMany({
      data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
    });
  }
  if (workingHours !== undefined) {
    await prisma.workingHour.deleteMany({ where: { staffId: id } });
    await prisma.workingHour.createMany({
      data: workingHours.map((h) => ({ ...h, staffId: id })),
    });
  }
  const staff = await prisma.staff.update({
    where: { id },
    data: rest,
    include: { services: { include: { service: true } }, workingHours: true },
  });
  revalidatePath("/staff");
  return staff;
}
