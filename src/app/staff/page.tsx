import { getStaff } from "@/actions/staff";
import { getServices } from "@/actions/services";
import { StaffClient } from "./StaffClient";

export default async function StaffPage() {
  const [staffList, serviceList] = await Promise.all([getStaff(), getServices()]);

  const services = serviceList.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));
  const staff = staffList.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    bio: s.bio,
    color: s.color,
    isActive: s.isActive,
    serviceIds: s.services.map((ss) => ss.serviceId),
    workingHours: s.workingHours.map((h) => ({
      day: h.day,
      start: h.start,
      end: h.end,
      dayOff: h.dayOff,
    })),
    appointmentCount: s._count.appointments,
  }));

  return <StaffClient initialStaff={staff} serviceList={services} />;
}
