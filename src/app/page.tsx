import { appointments, staff, services } from "@/lib/mock-data";
import { CalendarDays, CheckCircle2, TrendingUp, Clock, Plus } from "lucide-react";
import Link from "next/link";

const TODAY = "2026-06-03";

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const todayApps = appointments.filter((a) => a.datetime.startsWith(TODAY));
  const confirmed = todayApps.filter((a) => a.status === "confirmed").length;
  const completed = todayApps.filter((a) => a.status === "completed").length;
  const revenue = todayApps.filter((a) => a.status === "completed").reduce((sum, a) => sum + a.price, 0);

  const getService = (id: string) => services.find((s) => s.id === id);

  const grouped = staff.map((s) => ({
    staff: s,
    apps: todayApps.filter((a) => a.staffId === s.id).sort((a, b) => a.datetime.localeCompare(b.datetime)),
  })).filter((g) => g.apps.length > 0);

  const statusStyle: Record<string, string> = {
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  const statusLabel: Record<string, string> = {
    confirmed: "Onaylı",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Bugün
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>3 Haziran 2026, Salı</p>
        </div>
        <Link href="/appointments" className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium text-white shadow-sm" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Randevu</span>
          <span className="sm:hidden">Yeni</span>
        </Link>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { icon: CalendarDays, label: "Toplam", value: todayApps.length, color: "#B08D7A", bg: "#F5EDE8" },
          { icon: Clock, label: "Bekleyen", value: confirmed, color: "#6B9BCC", bg: "#EBF2FB" },
          { icon: CheckCircle2, label: "Tamamlanan", value: completed, color: "#6BAA8A", bg: "#EBF6F0" },
          { icon: TrendingUp, label: "Günlük Ciro", value: `${revenue.toLocaleString("tr-TR")}₺`, color: "#B08D7A", bg: "#F5EDE8" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E0DA]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span className="text-xs font-medium truncate" style={{ color: "#9A8A82" }}>{label}</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: "#3D2E26", fontFamily: "Cormorant Garamond, serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
        Bugünün Randevuları
      </h2>
      <div className="space-y-4">
        {grouped.map(({ staff: s, apps }) => (
          <div key={s.id} className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-3 border-b border-[#F0E8E2] flex items-center gap-2" style={{ background: "#FDFAF8" }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="font-medium text-sm" style={{ color: "#3D2E26" }}>{s.name}</span>
              <span className="text-xs ml-1" style={{ color: "#B08D7A" }}>{apps.length} randevu</span>
            </div>
            <div className="divide-y divide-[#F5F0EC]">
              {apps.map((a) => {
                const svc = getService(a.serviceId);
                return (
                  <div key={a.id} className="px-4 md:px-5 py-3 flex items-center justify-between hover:bg-[#FDFAF8] transition-colors gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold flex-shrink-0 w-11" style={{ color: "#B08D7A" }}>{formatTime(a.datetime)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#3D2E26" }}>{a.customerName}</p>
                        <p className="text-xs truncate" style={{ color: "#9A8A82" }}>{svc?.emoji} {svc?.name} · {a.duration} dk</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold" style={{ color: "#B08D7A" }}>{a.price.toLocaleString("tr-TR")}₺</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusStyle[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
