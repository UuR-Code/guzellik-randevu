"use client";

import { useState } from "react";
import { Save, MapPin, Clock, Phone, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    salonName: "Belle Studio",
    address: "Bağcılar Mah. Güzel Sokak No:12, İstanbul",
    phone: "0212 555 44 33",
    openTime: "09:00",
    closeTime: "19:00",
    slotInterval: "15",
    confirmationMsg: "Merhaba {isim}, randevunuz onaylandı! 📅 {tarih} saat {saat} — {hizmet} ({uzman}). Belle Studio sizi bekliyor 💅",
    reminderMsg: "Merhaba {isim}, yarın saat {saat} randevunuz var! 💅 {hizmet} — {uzman}. Sizi bekliyoruz ✨",
    cancellationMsg: "Merhaba {isim}, {tarih} tarihli randevunuz iptal edilmiştir. Yeni randevu için bize ulaşabilirsiniz.",
  });

  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "mt-1 w-full px-3 py-2 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] transition-colors";
  const labelClass = "text-xs font-semibold text-[#9A8A82] uppercase tracking-wide";

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
            Ayarlar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B08D7A" }}>Salon bilgileri ve sistem tercihleri</p>
        </div>
        <Button onClick={save} className="gap-2 text-white" style={{ background: saved ? "#6BAA8A" : "linear-gradient(135deg, #B08D7A, #C9A898)", border: "none", transition: "background 0.3s" }}>
          <Save className="w-4 h-4" />
          {saved ? "Kaydedildi ✓" : "Kaydet"}
        </Button>
      </div>

      <div className="space-y-5">
        {/* Salon Info */}
        <div className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F5EDE8" }}>
              <MapPin className="w-3.5 h-3.5 text-[#B08D7A]" />
            </div>
            <h2 className="font-semibold text-[#3D2E26]">Salon Bilgileri</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Salon Adı</label>
              <input className={inputClass} value={settings.salonName} onChange={(e) => setSettings({ ...settings, salonName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Adres</label>
              <input className={inputClass} value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input className={inputClass} value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F5EDE8" }}>
              <Clock className="w-3.5 h-3.5 text-[#B08D7A]" />
            </div>
            <h2 className="font-semibold text-[#3D2E26]">Çalışma Saatleri & Slotlar</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Açılış</label>
              <input type="time" className={inputClass} value={settings.openTime} onChange={(e) => setSettings({ ...settings, openTime: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Kapanış</label>
              <input type="time" className={inputClass} value={settings.closeTime} onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Slot Aralığı (dk)</label>
              <select className={inputClass} value={settings.slotInterval} onChange={(e) => setSettings({ ...settings, slotInterval: e.target.value })}>
                <option value="10">10 dakika</option>
                <option value="15">15 dakika</option>
                <option value="30">30 dakika</option>
                <option value="60">60 dakika</option>
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F5EDE8" }}>
              <MessageSquare className="w-3.5 h-3.5 text-[#B08D7A]" />
            </div>
            <h2 className="font-semibold text-[#3D2E26]">WhatsApp Mesaj Şablonları</h2>
          </div>
          <p className="text-xs text-[#9A8A82] mb-4">
            Kullanılabilir değişkenler: <code className="bg-[#FAF7F4] px-1 rounded text-[#B08D7A]">{"{isim}"}</code>{" "}
            <code className="bg-[#FAF7F4] px-1 rounded text-[#B08D7A]">{"{tarih}"}</code>{" "}
            <code className="bg-[#FAF7F4] px-1 rounded text-[#B08D7A]">{"{saat}"}</code>{" "}
            <code className="bg-[#FAF7F4] px-1 rounded text-[#B08D7A]">{"{hizmet}"}</code>{" "}
            <code className="bg-[#FAF7F4] px-1 rounded text-[#B08D7A]">{"{uzman}"}</code>
          </p>
          <div className="space-y-3">
            {[
              { label: "Onay Mesajı", key: "confirmationMsg" },
              { label: "Hatırlatma Mesajı", key: "reminderMsg" },
              { label: "İptal Mesajı", key: "cancellationMsg" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={(settings as Record<string, string>)[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: "#F5EDE8" }}>
            <Bell className="w-4 h-4 text-[#B08D7A] flex-shrink-0" />
            <p className="text-xs text-[#B08D7A]">WhatsApp entegrasyonu sonraki aşamada aktif edilecektir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
