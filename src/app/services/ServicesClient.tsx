"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService, deleteService } from "@/actions/services";
import { Plus, Edit2, Trash2, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type StaffRow = { id: string; name: string; color: string };
type ServiceRow = {
  id: string; name: string; description: string | null; emoji: string;
  duration: number; price: string; isActive: boolean; staffIds: string[];
};

function toggleArr(arr: string[], id: string) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function ServicesClient({ initialServices, staffList }: { initialServices: ServiceRow[]; staffList: StaffRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: "", description: "", duration: "", price: "", staffIds: [] as string[], emoji: "✨" });

  const refresh = () => router.refresh();

  const handleToggleActive = (svc: ServiceRow) => {
    startTransition(async () => {
      await updateService(svc.id, { isActive: !svc.isActive });
      refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteService(id);
      refresh();
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      await updateService(editing.id, {
        name: editing.name,
        description: editing.description ?? undefined,
        emoji: editing.emoji,
        duration: editing.duration,
        price: parseFloat(editing.price),
        staffIds: editing.staffIds,
      });
      setEditing(null);
      refresh();
    });
  };

  const handleAdd = () => {
    if (!newSvc.name || !newSvc.duration || !newSvc.price) return;
    startTransition(async () => {
      await createService({
        name: newSvc.name,
        description: newSvc.description || undefined,
        emoji: newSvc.emoji,
        duration: parseInt(newSvc.duration),
        price: parseFloat(newSvc.price),
        staffIds: newSvc.staffIds,
      });
      setShowNew(false);
      setNewSvc({ name: "", description: "", duration: "", price: "", staffIds: [], emoji: "✨" });
      refresh();
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Hizmetler
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>{initialServices.filter((s) => s.isActive).length} aktif hizmet</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Hizmet</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {initialServices.map((svc) => {
          const svcStaff = staffList.filter((s) => svc.staffIds.includes(s.id));
          return (
            <div key={svc.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${svc.isActive ? "border-[#E8E0DA] opacity-100" : "border-[#F0EAE5] opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#F5EDE8" }}>
                    {svc.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3D2E26]">{svc.name}</h3>
                    <p className="text-xs text-[#9A8A82]">{svc.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(svc)} className="p-1.5 rounded-lg hover:bg-[#F5EDE8] text-[#B08D7A] transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(svc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5 text-[#B08D7A]" />
                  {svc.duration} dk
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#B08D7A]">
                  <DollarSign className="w-3.5 h-3.5" />
                  {Number(svc.price).toLocaleString("tr-TR")}₺
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {svcStaff.length > 0 ? svcStaff.map((s) => (
                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.color + "30", color: "#3D2E26" }}>
                      {s.name.split(" ")[0]}
                    </span>
                  )) : <span className="text-xs text-[#C0B0A8]">Uzman atanmamış</span>}
                </div>
                <button
                  onClick={() => handleToggleActive(svc)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${svc.isActive ? "bg-[#B08D7A]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${svc.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
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
              Hizmet Düzenle
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Hizmet Adı</label>
                  <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Emoji</label>
                  <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Açıklama</label>
                <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Süre (dk)</label>
                  <input type="number" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Fiyat (₺)</label>
                  <input type="number" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                    value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2 block">Uzmanlar</label>
                <div className="flex flex-wrap gap-2">
                  {staffList.map((s) => (
                    <button key={s.id}
                      onClick={() => setEditing({ ...editing, staffIds: toggleArr(editing.staffIds, s.id) })}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${editing.staffIds.includes(s.id) ? "text-white border-transparent" : "border-[#E8E0DA] text-[#7A6A62]"}`}
                      style={editing.staffIds.includes(s.id) ? { background: s.color } : {}}>
                      {s.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Service Modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-white rounded-2xl border-[#E8E0DA] mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26", fontSize: "1.3rem" }}>
              Yeni Hizmet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Hizmet Adı</label>
                <input placeholder="örn. Manikür" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Emoji</label>
                <input className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={newSvc.emoji} onChange={(e) => setNewSvc({ ...newSvc, emoji: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Açıklama</label>
              <input placeholder="Kısa açıklama" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                value={newSvc.description} onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Süre (dk)</label>
                <input type="number" placeholder="45" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={newSvc.duration} onChange={(e) => setNewSvc({ ...newSvc, duration: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Fiyat (₺)</label>
                <input type="number" placeholder="350" className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A]"
                  value={newSvc.price} onChange={(e) => setNewSvc({ ...newSvc, price: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide mb-2 block">Uzmanlar</label>
              <div className="flex flex-wrap gap-2">
                {staffList.map((s) => (
                  <button key={s.id}
                    onClick={() => setNewSvc({ ...newSvc, staffIds: toggleArr(newSvc.staffIds, s.id) })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${newSvc.staffIds.includes(s.id) ? "text-white border-transparent" : "border-[#E8E0DA] text-[#7A6A62]"}`}
                    style={newSvc.staffIds.includes(s.id) ? { background: s.color } : {}}>
                    {s.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none" }}>Kaydet</Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1 border-[#E8E0DA] text-[#9A8A82]">İptal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
