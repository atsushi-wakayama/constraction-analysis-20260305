"use client";

import { usePathname } from "next/navigation";
import { Sidebar, SidebarLayoutShell } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // ログインページではサイドバー非表示
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }
  return (
    <>
      <Sidebar />
      <SidebarLayoutShell>{children}</SidebarLayoutShell>
    </>
  );
}
