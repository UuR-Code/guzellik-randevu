"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getServices() {
  return prisma.service.findMany({
    include: { staff: { include: { staff: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createService(data: {
  name: string; description?: string; emoji?: string;
  duration: number; price: number; staffIds: string[];
}) {
  const { staffIds, ...rest } = data;
  const service = await prisma.service.create({
    data: {
      ...rest,
      staff: { create: staffIds.map((staffId) => ({ staffId })) },
    },
    include: { staff: { include: { staff: true } } },
  });
  revalidatePath("/services");
  return service;
}

export async function updateService(id: string, data: {
  name?: string; description?: string; emoji?: string;
  duration?: number; price?: number; staffIds?: string[]; isActive?: boolean;
}) {
  const { staffIds, ...rest } = data;
  if (staffIds !== undefined) {
    await prisma.staffService.deleteMany({ where: { serviceId: id } });
    await prisma.staffService.createMany({
      data: staffIds.map((staffId) => ({ staffId, serviceId: id })),
    });
  }
  const service = await prisma.service.update({
    where: { id },
    data: rest,
    include: { staff: { include: { staff: true } } },
  });
  revalidatePath("/services");
  return service;
}

export async function deleteService(id: string) {
  await prisma.service.delete({ where: { id } });
  revalidatePath("/services");
}
