"use client";

import { useState } from "react";
import { appointments as initialApps, staff, services } from "@/lib/mock-data";
import type { Appointment, Status } from "@/lib/mock-data";
import { Plus, Search, CheckCircle, XCircle, Edit2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatDT(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

const statusStyle: Record<Status, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};
const statusLabel: Record<Status, string> = {
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export default function AppointmentsPage() {
  const [apps, setApps] = useState(initialApps);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStaff, setFilterStaff] = useState<string>("all");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newApp, setNewApp] = useState({ customerName: "", customerPhone: "", staffId: "", serviceId: "", datetime: "", notes: "" });

  const filtered = apps
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) => filterStaff === "all" || a.staffId === filterStaff)
    .filter((a) => a.customerName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));

  const updateStatus = (id: string, status: Status) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const saveEdit = () => {
    if (!editing) return;
    setApps((prev) => prev.map((a) => (a.id === editing.id ? editing : a)));
    setEditing(null);
  };

  const addApp = () => {
    const svc = services.find((s) => s.id === newApp.serviceId);
    if (!svc || !newApp.customerName || !newApp.staffId || !newApp.datetime) return;
    const app: Appointment = {
      id: `a${Date.now()}`,
      customerName: newApp.customerName,
      customerPhone: newApp.customerPhone,
      staffId: newApp.staffId,
      serviceId: newApp.serviceId,
      datetime: newApp.datetime,
      duration: svc.duration,
      price: svc.price,
      status: "confirmed",
      notes: newApp.notes,
    };
    setApps((prev) => [...prev, app]);
    setShowNew(false);
    setNewApp({ customerName: "", customerPhone: "", staffId: "", serviceId: "", datetime: "", notes: "" });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Randevular
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>{apps.length} toplam randevu</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Randevu</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      {/* Filters */}
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
              <SelectItem value="confirmed">Onaylı</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStaff} onValueChange={(v) => setFilterStaff(v ?? "all")}>
            <SelectTrigger className="flex-1 sm:w-40 bg-white border-[#E8E0DA] rounded-xl text-sm">
              <SelectValue placeholder="Tüm Uzmanlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Uzmanlar</SelectItem>
              {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
              const s = staff.find((x) => x.id === a.staffId);
              const svc = services.find((x) => x.id === a.serviceId);
              const { date, time } = formatDT(a.datetime);
              return (
                <tr key={a.id} className="hover:bg-[#FDFAF8] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#3D2E26]">{a.customerName}</p>
                    <p className="text-xs text-[#9A8A82]">{a.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s?.color }} />
                      <span className="text-[#3D2E26]">{s?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#3D2E26]">{svc?.emoji} {svc?.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#3D2E26]">{date}</p>
                    <p className="text-xs font-semibold text-[#B08D7A]">{time}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#B08D7A]">{a.price.toLocaleString("tr-TR")}₺</td>
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
                      {a.status === "confirmed" && (
                        <>
                          <button onClick={() => updateStatus(a.id, "completed")} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateStatus(a.id, "cancelled")} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
          const s = staff.find((x) => x.id === a.staffId);
          const svc = services.find((x) => x.id === a.serviceId);
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
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s?.color }} />
                    <span className="text-[#3D2E26]">{s?.name.split(" ")[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Hizmet</p>
                  <p className="text-[#3D2E26]">{svc?.emoji} {svc?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Tarih</p>
                  <p className="text-[#3D2E26]">{date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9A8A82] uppercase tracking-wide font-semibold mb-0.5">Saat & Fiyat</p>
                  <p className="font-semibold text-[#B08D7A]">{time} · {a.price.toLocaleString("tr-TR")}₺</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#F5F0EC]">
                <button onClick={() => setEditing(a)} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-[#F5EDE8] text-[#B08D7A] transition-colors border border-[#E8E0DA]">
                  <Edit2 className="w-3 h-3" /> Düzenle
                </button>
                {a.status === "confirmed" && (
                  <>
                    <button onClick={() => updateStatus(a.id, "completed")} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-50 text-green-600 transition-colors border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Tamamla
                    </button>
                    <button onClick={() => updateStatus(a.id, "cancelled")} className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-50 text-red-500 transition-colors border border-red-200">
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
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Tarih & Saat</label>
                <input type="datetime-local" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={editing.datetime.slice(0, 16)} onChange={(e) => setEditing({ ...editing, datetime: e.target.value + ":00" })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Not</label>
                <textarea className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] resize-none"
                  rows={2} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
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
                {services.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.name} — {s.duration} dk · {s.price}₺</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Uzman</label>
              <select className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newApp.staffId} onChange={(e) => setNewApp({ ...newApp, staffId: e.target.value })}>
                <option value="">Seçin</option>
                {staff.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Tarih & Saat</label>
              <input type="datetime-local" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newApp.datetime} onChange={(e) => setNewApp({ ...newApp, datetime: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={addApp} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
