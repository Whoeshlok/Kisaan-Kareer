"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, TrendingUp, Bell, User } from "lucide-react";

// Do not change: Home, Ask, Mandi, Alerts, Profile — in this order.
const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ask", label: "Ask", icon: Mic },
  { href: "/mandi", label: "Mandi", icon: TrendingUp },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-paper border-t border-line flex justify-around py-2">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
          >
            <Icon size={20} color={active ? "var(--green-600)" : "var(--ink-400)"} />
            <span
              className="text-xs"
              style={{ color: active ? "var(--green-600)" : "var(--ink-400)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
