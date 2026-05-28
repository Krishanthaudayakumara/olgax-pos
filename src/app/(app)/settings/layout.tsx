import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}

function SettingsLayoutClient({ children }: { children: ReactNode }) {
  // Using a client-side version to access usePathname
  const pathname = usePathname();

  const tabs = [
    { label: "General", href: "/settings", id: "general" },
    { label: "Users", href: "/settings/users", id: "users" },
  ];

  return (
    <div className="flex flex-col">
      {/* Navigation tabs */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex max-w-4xl px-4 sm:px-6">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
