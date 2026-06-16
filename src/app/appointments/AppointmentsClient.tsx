"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/actions/appointments";
import { Plus, Search, CheckCircle, XCircle, Edit2, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentStatus } from "@prisma/client";

type StaffRow = { id: string; name: string; color: string };
type ServiceRow = { id: string; name: string; emoji: string; duration: number; price: string | number; isActive: boolean };
type AppRow = {
  id: string; customerName: string; customerPhone: string;
  staffId: string; serviceId: string; datetime: Date | string;
  duration: number; price: string | number; status: AppointmentStatus; notes?: string | null;
  staff: StaffRow; service: ServiceRow;
};

const statusStyle: Record<AppointmentStatus, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};
const statusLabel: Record<AppointmentStatus, string> = {
  CONFIRMED: "Onaylı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

function formatDT(dt: Date | string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function AppointmentsClient({
  initialApps, staffList, serviceList,
}: {
  initialApps: AppRow[]; staffList: StaffRow[]; serviceList: ServiceRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [editing, setEditing] = useState<AppRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newApp, setNewApp] = useState({ customerName: "", customerPhone: "", staffId: "", serviceId: "", datetime: "", notes: "" });

  const filtered = initialApps
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) => filterStaff === "all" || a.staffId === filterStaff)
    .filter((a) => a.customerName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const refresh = () => startTransition(() => router.refresh());

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    startTransition(async () => {
      await updateAppointmentStatus(id, status);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteAppointment(id);
      router.refresh();
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      await updateAppointment(editing.id, {
        customerName: editing.customerName,
        staffId: editing.staffId,
        datetime: new Date(editing.datetime).toISOString(),
        notes: editing.notes ?? undefined,
      });
      setEditing(null);
      router.refresh();
    });
  };

  const handleAddApp = () => {
    if (!newApp.customerName || !newApp.staffId || !newApp.serviceId || !newApp.datetime) return;
    startTransition(async () => {
      await createAppointment({
        ...newApp,
        datetime: new Date(newApp.datetime).toISOString(),
      });
      setShowNew(false);
      setNewApp({ customerName: "", customerPhone: "", staffId: "", serviceId: "", datetime: "", notes: "" });
      router.refresh();
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Randevular
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>{initialApps.length} toplam randevu</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Randevu</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B08D7A]" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] transition-colors"
            placeholder="Müşteri ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="flex-1 sm:w-36 bg-white border-[#E8E0DA] rounded-xl text-sm">
              <Filter className="w-3 h-3 mr-1 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="CONFIRMED">Onaylı</SelectItem>
              <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
              <SelectItem value="CANCELLED">İptal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStaff} onValueChange={(v) => setFilterStaff(v ?? "all")}>
            <SelectTrigger className="flex-1 sm:w-40 bg-white border-[#E8E0DA] rounded-xl text-sm">
              <SelectValue placeholder="Tüm Uzmanlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Uzmanlar</SelectItem>
              {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E8E0DA] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0E8E2]" style={{ background: "#FDFAF8" }}>
              {["Müşteri", "Uzman", "Hizmet", "Tarih & Saat", "Fiyat", "Durum", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0EC]">
            {filtered.map((a) => {
              const { date, time } = formatDT(a.datetime);
              return (
                <tr key={a.id} className="hover:bg-[#FDFAF8] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#3D2E26]">{a.customerName}</p>
                    <p className="text-xs text-[#9A8A82]">{a.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.staff.color }} />
                      <span className="text-[#3D2E26]">{a.staff.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#3D2E26]">{a.service.emoji} {a.service.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#3D2E26]">{date}</p>
                    <p className="text-xs font-semibold text-[#B08D7A]">{time}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#B08D7A]">{Number(a.price).toLocaleString("tr-TR")}₺</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg hover:bg-[#F5EDE8] text-[#B08D7A] transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {a.status === "CONFIRMED" && (
                        <>
                          <button onClick={() => handleStatusChange(a.id, "COMPLETED")} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleStatusChange(a.id, "CANCELLED")} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => {
          const { date, time } = formatDT(a.datetime);
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#3D2E26]">{a.customerName}</p>
                  <p className="text-xs text-[#9A8A82]">{a.customerPhone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Uzman</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.staff.color }} />
                    <span className="text-[#3D2E26]">{a.staff.name.split(" ")[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Hizmet</p>
                  <p className="text-[#3D2E26]">{a.service.emoji} {a.service.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Tarih</p>
                  <p className="text-[#3D2E26]">{date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Saat & Fiyat</p>
                  <p className="font-semibold text-[#B08D7A]">{time} · {Number(a.price).toLocaleString("tr-TR")}₺</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#F5F0EC]">
                <button onClick={() => setEditing(a)} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-[#F5EDE8] text-[#B08D7A] transition-colors border border-[#E8E0DA]">
                  <Edit2 className="w-3 h-3" /> Düzenle
                </button>
                {a.status === "CONFIRMED" && (
                  <>
                    <button onClick={() => handleStatusChange(a.id, "COMPLETED")} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-50 text-green-600 transition-colors border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Tamamla
                    </button>
                    <button onClick={() => handleStatusChange(a.id, "CANCELLED")} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-50 text-red-500 transition-colors border border-red-200">
                      <XCircle className="w-3 h-3" /> İptal
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white rounded-2xl border-[#E8E0DA] mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26", fontSize: "1.3rem" }}>
              Randevu Düzenle
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Müşteri</label>
                <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={editing.customerName} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Uzman</label>
                <select className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={editing.staffId} onChange={(e) => setEditing({ ...editing, staffId: e.target.value })}>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Tarih & Saat</label>
                <input type="datetime-local" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={new Date(editing.datetime).toISOString().slice(0, 16)}
                  onChange={(e) => setEditing({ ...editing, datetime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Not</label>
                <textarea className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] resize-none"
                  rows={2} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-white rounded-2xl border-[#E8E0DA] mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26", fontSize: "1.3rem" }}>
              Yeni Randevu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {[
              { label: "Müşteri Adı", key: "customerName", placeholder: "Ad Soyad" },
              { label: "Telefon", key: "customerPhone", placeholder: "05xx xxx xx xx" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">{label}</label>
                <input placeholder={placeholder} className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={(newApp as Record<string, string>)[key]} onChange={(e) => setNewApp({ ...newApp, [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Hizmet</label>
              <select className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newApp.serviceId} onChange={(e) => setNewApp({ ...newApp, serviceId: e.target.value })}>
                <option value="">Seçin</option>
                {serviceList.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.name} — {s.duration} dk · {Number(s.price)}₺</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Uzman</label>
              <select className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newApp.staffId} onChange={(e) => setNewApp({ ...newApp, staffId: e.target.value })}>
                <option value="">Seçin</option>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Tarih & Saat</label>
              <input type="datetime-local" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newApp.datetime} onChange={(e) => setNewApp({ ...newApp, datetime: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddApp} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
