import Link from "next/link";

/**
 * hero=true gives it the orange "Get started"-button accent + leaf icon
 * treatment so Organic Advisor visibly stands out from the other three.
 */
export default function QuickAccessCard({ href, icon: Icon, title, subtitle, hero = false }) {
  return (
    <Link
      href={href}
      className={`rounded-md p-3 flex flex-col gap-2 border transition-colors ${
        hero
          ? "bg-gold-500 border-gold-500 text-paper"
          : "bg-paper border-line text-ink-900"
      }`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-sm ${
          hero ? "bg-white/20" : "bg-green-100 text-green-800"
        }`}
      >
        <Icon size={16} color={hero ? "#ffffff" : "var(--green-800)"} />
      </span>
      <div>
        <p className={`text-sm font-medium ${hero ? "text-paper" : "text-ink-900"}`}>{title}</p>
        <p className={`text-xs ${hero ? "text-white/85" : "text-ink-600"}`}>{subtitle}</p>
      </div>
    </Link>
  );
}
