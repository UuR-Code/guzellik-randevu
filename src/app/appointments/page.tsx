import { getAppointments } from "@/actions/appointments";
import { getStaff } from "@/actions/staff";
import { getServices } from "@/actions/services";
import { AppointmentsClient } from "./AppointmentsClient";

export default async function AppointmentsPage() {
  const [appointments, staffList, serviceList] = await Promise.all([
    getAppointments(),
    getStaff(),
    getServices(),
  ]);

  const staff = staffList.map((s) => ({ id: s.id, name: s.name, color: s.color }));
  const services = serviceList.map((s) => ({
    id: s.id, name: s.name, emoji: s.emoji, duration: s.duration,
    price: s.price.toString(), isActive: s.isActive,
  }));

  return (
    <AppointmentsClient
      initialApps={appointments.map((a) => ({
        ...a,
        price: a.price.toString(),
        service: { ...a.service, price: a.service.price.toString() },
      }))}
      staffList={staff}
      serviceList={services}
    />
  );
}
