export const dynamic = "force-dynamic";
import { getServices } from "@/actions/services";
import { getStaff } from "@/actions/staff";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage() {
  const [serviceList, staffList] = await Promise.all([getServices(), getStaff()]);

  const staff = staffList.map((s) => ({ id: s.id, name: s.name, color: s.color }));
  const services = serviceList.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    emoji: s.emoji,
    duration: s.duration,
    price: s.price.toString(),
    isActive: s.isActive,
    staffIds: s.staff.map((ss) => ss.staffId),
  }));

  return <ServicesClient initialServices={services} staffList={staff} />;
}
