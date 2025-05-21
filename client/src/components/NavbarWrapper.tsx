"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Исключаем Navbar на страницах суперадмина и авторизации
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/auth"))
    return null;

  return <Navbar />;
}
