"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Scissors, Users, Settings, Sparkles, Menu, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/appointments", icon: CalendarDays, label: "Randevular" },
  { href: "/services", icon: Scissors, label: "Hizmetler" },
  { href: "/staff", icon: Users, label: "Uzmanlar" },
  { href: "/whatsapp", icon: MessageCircle, label: "WhatsApp Bot" },
  { href: "/settings", icon: Settings, label: "Ayarlar" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const toggle = document.getElementById("sidebar-toggle");
      if (sidebar && !sidebar.contains(e.target as Node) && !toggle?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-[#E8E0DA]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #B08D7A, #E8D5CB)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight" style={{ fontFamily: "Cormorant Garamond, serif", color: "#3D2E26" }}>
              Belle Studio
            </h1>
            <p className="text-[10px] text-[#B08D7A] tracking-wide uppercase">Güzellik & Bakım</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active ? "text-white font-medium shadow-sm" : "text-[#7A6A62] hover:bg-[#FAF7F4] hover:text-[#3D2E26]"
              )}
              style={active ? { background: "linear-gradient(135deg, #B08D7A, #C9A898)" } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#E8E0DA]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#E8D5CB] flex items-center justify-center text-xs font-semibold text-[#B08D7A]">A</div>
          <div className="text-xs">
            <p className="font-medium text-[#3D2E26]">Admin</p>
            <p className="text-[#B08D7A]">Salon Yöneticisi</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-white border-r border-[#E8E0DA] flex-col shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E8E0DA] flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #B08D7A, #E8D5CB)" }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[#3D2E26]" style={{ fontFamily: "Cormorant Garamond, serif" }}>Belle Studio</span>
        </div>
        <button
          id="sidebar-toggle"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-xl hover:bg-[#FAF7F4] text-[#7A6A62] transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" />
      )}

      {/* Mobile drawer */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-64 z-40 bg-white flex flex-col shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
