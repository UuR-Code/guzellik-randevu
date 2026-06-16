"use client";

import { useState } from "react";
import { staff as initialStaff, services, appointments } from "@/lib/mock-data";
import type { Staff } from "@/lib/mock-data";
import { Phone, Edit2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function StaffPage() {
  const [staffList, setStaffList] = useState(initialStaff);
  const [editing, setEditing] = useState<Staff | null>(null);

  const toggleActive = (id: string) => {
    setStaffList((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const saveEdit = () => {
    if (!editing) return;
    setStaffList((prev) => prev.map((s) => s.id === editing.id ? editing : s));
    setEditing(null);
  };

  const toggleService = (svcId: string) => {
    if (!editing) return;
    const has = editing.services.includes(svcId);
    setEditing({ ...editing, services: has ? editing.services.filter((x) => x !== svcId) : [...editing.services, svcId] });
  };

  const getStaffAppCount = (id: string) => appointments.filter((a) => a.staffId === id).length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Uzmanlar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>{staffList.filter((s) => s.isActive).length} aktif uzman</p>
        </div>
        <Button className="gap-1.5 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Uzman Ekle</span>
          <span className="sm:hidden">Ekle</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {staffList.map((s) => {
          const svcList = services.filter((svc) => s.services.includes(svc.id));
          const appCount = getStaffAppCount(s.id);
          return (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${s.isActive ? "border-[#E8E0DA]" : "border-[#F0EAE5] opacity-60"}`}>
              <div className="h-1.5" style={{ background: s.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{ background: s.color }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#3D2E26]">{s.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-[#9A8A82]">
                        <Phone className="w-3 h-3" />
                        {s.phone}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setEditing(s)} className="p-1.5 rounded-lg hover:bg-[#F5EDE8] text-[#B08D7A] transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {s.bio && <p className="text-xs text-[#9A8A82] mb-4 italic">{s.bio}</p>}

                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2">Hizmetler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {svcList.map((svc) => (
                      <span key={svc.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5EDE8", color: "#B08D7A" }}>
                        {svc.emoji} {svc.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2">Çalışma Saatleri</p>
                  <div className="grid grid-cols-7 gap-0.5">
                    {s.workingHours.map((h) => (
                      <div key={h.day} className="text-center">
                        <div className="text-[9px] text-[#9A8A82] mb-0.5">{h.day}</div>
                        <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${h.dayOff ? "bg-gray-100" : ""}`}
                          style={!h.dayOff ? { background: s.color + "40" } : {}}>
                          {h.dayOff
                            ? <span className="text-[8px] text-gray-400">—</span>
                            : <Clock className="w-2.5 h-2.5" style={{ color: s.color }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F5F0EC]">
                  <span className="text-xs text-[#9A8A82]">{appCount} toplam randevu</span>
                  <button
                    onClick={() => toggleActive(s.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${s.isActive ? "bg-[#B08D7A]" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white rounded-2xl border-[#E8E0DA] max-w-lg mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26", fontSize: "1.3rem" }}>
              Uzman Düzenle
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Ad Soyad</label>
                  <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Telefon</label>
                  <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Bio</label>
                <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2 block">Hizmetler</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${editing.services.includes(svc.id) ? "text-white border-transparent" : "border-[#E8E0DA] text-[#7A6A62]"}`}
                      style={editing.services.includes(svc.id) ? { background: "#B08D7A" } : {}}
                    >
                      {svc.emoji} {svc.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2 block">Çalışma Saatleri</label>
                <div className="space-y-2">
                  {editing.workingHours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-3">
                      <span className="text-sm w-8 text-[#3D2E26] font-medium">{h.day}</span>
                      <button
                        onClick={() => {
                          const wh = [...editing.workingHours];
                          wh[i] = { ...wh[i], dayOff: !wh[i].dayOff };
                          setEditing({ ...editing, workingHours: wh });
                        }}
                        className={`text-xs px-2 py-0.5 rounded-full border ${h.dayOff ? "border-red-200 bg-red-50 text-red-500" : "border-green-200 bg-green-50 text-green-600"}`}
                      >
                        {h.dayOff ? "İzin" : "Çalışıyor"}
                      </button>
                      {!h.dayOff && (
                        <div className="flex items-center gap-1 text-xs text-[#9A8A82]">
                          <input type="time" className="px-2 py-0.5 bg-[#FAF7F4] border border-[#E8E0DA] rounded-lg text-xs outline-none"
                            value={h.start}
                            onChange={(e) => {
                              const wh = [...editing.workingHours];
                              wh[i] = { ...wh[i], start: e.target.value };
                              setEditing({ ...editing, workingHours: wh });
                            }} />
                          <span>—</span>
                          <input type="time" className="px-2 py-0.5 bg-[#FAF7F4] border border-[#E8E0DA] rounded-lg text-xs outline-none"
                            value={h.end}
                            onChange={(e) => {
                              const wh = [...editing.workingHours];
                              wh[i] = { ...wh[i], end: e.target.value };
                              setEditing({ ...editing, workingHours: wh });
                            }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
