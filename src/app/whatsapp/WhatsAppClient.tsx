"use client";

import { useState } from "react";
import { MessageCircle, Settings, Phone, Key, Clock, ChevronDown, ChevronRight } from "lucide-react";

type Message = { role: string; content: string };
type Conversation = {
  id: string; phone: string; state: string;
  updatedAt: string; history: Message[];
};
type Settings = {
  ownerPhone: string; phoneNumberId: string;
  hasToken: boolean; hasCronSecret: boolean; cronUrl: string;
};

function formatPhone(p: string) {
  return p.startsWith("9") ? `+${p}` : p;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}

function ConvCard({ conv }: { conv: Conversation }) {
  const [open, setOpen] = useState(false);
  const lastMsg = conv.history[conv.history.length - 1];

  return (
    <div className="border border-[#E8E0DA] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F4] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#B08D7A] flex items-center justify-center text-white text-sm font-bold">
            {formatPhone(conv.phone).slice(-2)}
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-[#3D2C2C]">{formatPhone(conv.phone)}</p>
            {lastMsg && (
              <p className="text-xs text-[#9B7B6B] truncate max-w-[220px]">
                {lastMsg.role === "user" ? "👤 " : "🤖 "}
                {typeof lastMsg.content === "string" ? lastMsg.content : "..."}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            conv.state === "ACTIVE"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}>
            {conv.state}
          </span>
          <span className="text-xs text-[#9B7B6B]">{timeAgo(conv.updatedAt)}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#E8E0DA] bg-[#FAF7F4] p-4 space-y-2 max-h-80 overflow-y-auto">
          {conv.history.length === 0 ? (
            <p className="text-xs text-[#9B7B6B] text-center">Konuşma geçmişi yok</p>
          ) : (
            conv.history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.role === "user"
                    ? "bg-[#B08D7A] text-white rounded-br-none"
                    : "bg-white text-[#3D2C2C] border border-[#E8E0DA] rounded-bl-none"
                }`}>
                  {typeof m.content === "string" ? m.content : JSON.stringify(m.content)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function WhatsAppClient({ conversations, settings }: { conversations: Conversation[]; settings: Settings }) {
  const [tab, setTab] = useState<"conversations" | "settings">("conversations");

  return (
    <div className="min-h-screen bg-[#FAF7F4] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#B08D7A] flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#3D2C2C]">WhatsApp Bot</h1>
            <p className="text-sm text-[#9B7B6B]">{conversations.length} aktif konuşma</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E8E0DA] rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("conversations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "conversations"
                ? "bg-[#B08D7A] text-white"
                : "text-[#9B7B6B] hover:text-[#3D2C2C]"
            }`}
          >
            Konuşmalar
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "settings"
                ? "bg-[#B08D7A] text-white"
                : "text-[#9B7B6B] hover:text-[#3D2C2C]"
            }`}
          >
            Ayarlar
          </button>
        </div>

        {/* Conversations */}
        {tab === "conversations" && (
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-16 text-[#9B7B6B]">
                <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p>Henüz konuşma yok</p>
              </div>
            ) : (
              conversations.map((c) => <ConvCard key={c.id} conv={c} />)
            )}
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E8E0DA] rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-[#3D2C2C] flex items-center gap-2">
                <Settings size={16} /> Bağlantı Bilgileri
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <SettingRow icon={<Phone size={14} />} label="Müdür Telefonu" value={settings.ownerPhone ? `+${settings.ownerPhone}` : "—"} />
                <SettingRow icon={<Key size={14} />} label="Phone Number ID" value={settings.phoneNumberId || "—"} />
                <SettingRow icon={<Key size={14} />} label="WhatsApp Token" value={settings.hasToken ? "✅ Tanımlı" : "❌ Eksik"} />
                <SettingRow icon={<Key size={14} />} label="Cron Secret" value={settings.hasCronSecret ? "✅ Tanımlı" : "❌ Eksik"} />
              </div>
            </div>

            <div className="bg-white border border-[#E8E0DA] rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-[#3D2C2C] flex items-center gap-2">
                <Clock size={16} /> Hatırlatma Cron
              </h2>
              <p className="text-sm text-[#9B7B6B]">
                Aşağıdaki URL&apos;yi <strong>cron-job.org</strong>&apos;da her 10 dakikada bir çalışacak şekilde ekle:
              </p>
              <div className="bg-[#FAF7F4] border border-[#E8E0DA] rounded-lg px-3 py-2 text-xs font-mono text-[#3D2C2C] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-domain"}/api/cron/reminders?secret=<span className="text-[#B08D7A]">[CRON_SECRET]</span>
              </div>
              <p className="text-xs text-[#9B7B6B]">
                1 gün önce ve 2 saat önce otomatik hatırlatma mesajı gönderir.
              </p>
            </div>

            <div className="bg-white border border-[#E8E0DA] rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-[#3D2C2C] flex items-center gap-2">
                <MessageCircle size={16} /> Webhook Bilgileri
              </h2>
              <p className="text-sm text-[#9B7B6B]">Meta WhatsApp Configuration sayfasına girilecek URL:</p>
              <div className="bg-[#FAF7F4] border border-[#E8E0DA] rounded-lg px-3 py-2 text-xs font-mono text-[#3D2C2C] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-domain"}/api/webhook/whatsapp
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F0EAE5] last:border-0">
      <div className="flex items-center gap-2 text-[#9B7B6B] text-sm">
        {icon} {label}
      </div>
      <span className="text-sm font-medium text-[#3D2C2C]">{value}</span>
    </div>
  );
}
