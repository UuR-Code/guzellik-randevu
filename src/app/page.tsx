export const dynamic = "force-dynamic";
import { getAppointments } from "@/actions/appointments";
import { CalendarDays, CheckCircle2, TrendingUp, Clock, Plus } from "lucide-react";
import Link from "next/link";

function formatTime(dt: Date | string) {
  return new Date(dt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

const statusStyle: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};
const statusLabel: Record<string, string> = {
  CONFIRMED: "Onaylı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

export default async function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const todayApps = await getAppointments({ date: today });

  const confirmed = todayApps.filter((a) => a.status === "CONFIRMED").length;
  const completed = todayApps.filter((a) => a.status === "COMPLETED").length;
  const revenue = todayApps
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + Number(a.price), 0);

  const staffMap = new Map<string, { name: string; color: string; apps: typeof todayApps }>();
  for (const a of todayApps) {
    if (!staffMap.has(a.staffId)) {
      staffMap.set(a.staffId, { name: a.staff.name, color: a.staff.color, apps: [] });
    }
    staffMap.get(a.staffId)!.apps.push(a);
  }
  const grouped = [...staffMap.values()].filter((g) => g.apps.length > 0);

  const todayLabel = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Bugün
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "#B08D7A" }}>{todayLabel}</p>
        </div>
        <Link href="/appointments" className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium text-white shadow-sm" style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)" }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Randevu</span>
          <span className="sm:hidden">Yeni</span>
        </Link>
      </div>

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

      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-8 text-center">
          <p style={{ color: "#9A8A82" }}>Bugün için randevu bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ name, color, apps }) => (
            <div key={name} className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-[#F0E8E2] flex items-center gap-2" style={{ background: "#FDFAF8" }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="font-medium text-sm" style={{ color: "#3D2E26" }}>{name}</span>
                <span className="text-xs ml-1" style={{ color: "#B08D7A" }}>{apps.length} randevu</span>
              </div>
              <div className="divide-y divide-[#F5F0EC]">
                {apps.map((a) => (
                  <div key={a.id} className="px-4 md:px-5 py-3 flex items-center justify-between hover:bg-[#FDFAF8] transition-colors gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold flex-shrink-0 w-11" style={{ color: "#B08D7A" }}>{formatTime(a.datetime)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#3D2E26" }}>{a.customerName}</p>
                        <p className="text-xs truncate" style={{ color: "#9A8A82" }}>{a.service.emoji} {a.service.name} · {a.duration} dk</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold" style={{ color: "#B08D7A" }}>{Number(a.price).toLocaleString("tr-TR")}₺</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusStyle[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
