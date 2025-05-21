"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  LogOut,
  Package,
  PackagePlus,
  Percent,
  Settings,
  ShoppingBag,
  TicketPercent,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const menuItems = [
  {
    name: "Products",
    icon: Package,
    href: "/super-admin/products/list",
  },
  {
    name: "Add Product",
    icon: PackagePlus,
    href: "/super-admin/products/add",
  },
  {
    name: "Orders",
    icon: ShoppingBag,
    href: "/super-admin/orders",
  },
  {
    name: "Coupons",
    icon: Percent,
    href: "/super-admin/coupons/list",
  },
  {
    name: "Create Coupon",
    icon: TicketPercent,
    href: "/super-admin/coupons/add",
  },
  {
    name: "Settings",
    icon: Settings,
    href: "/super-admin/settings",
  },
  {
    name: "Logout",
    icon: LogOut,
    href: "",
  },
];

function SuperAdminSidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Чтобы не было несоответствия из за темы
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/super-admin/login");
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  // Добавляем обработчик для закрытия сайдбара при клике вне его области
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebar = document.getElementById("admin-sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        toggleButton &&
        !toggleButton.contains(e.target as Node)
      ) {
        toggle();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, toggle]);

  return (
    <>
      {/* Кнопка меню  */}
      <Button
        id="sidebar-toggle"
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 bg-white/80 dark:bg-gray-800/80 rounded-md shadow-md hover:shadow-lg transition-all",
          isOpen ? "left-52 duration-300" : "left-4 duration-300 ease-out"
        )}
        onClick={toggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Затемнение фона при открытом сайдбаре */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggle}
        />
      )}

      {/* Сайдбар */}
      <div
        id="admin-sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 transition-all duration-300 shadow-xl overflow-y-auto",
          "w-64 transform",
          isOpen ? "translate-x-0" : "translate-x-[-100%]",
          "border-r"
        )}
      >
        <div className="flex h-16 items-center px-4 mt-1">
          <h1 className="font-semibold">Admin Panel</h1>
        </div>

        {/* Кнопка переключения темы */}
        <div className="px-4 py-2">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full flex justify-start items-center gap-2"
          >
            {mounted && (
              <>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-1 py-4">
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                if (item.name === "Logout") {
                  handleLogout();
                } else {
                  router.push(item.href);
                }
                toggle(); // Закрываем сайдбар после выбора пункта меню
              }}
              className={cn(
                "flex cursor-pointer items-center px-4 py-3 text-sm hover:bg-gray-200/80 dark:hover:bg-gray-800 transition-all duration-200"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default SuperAdminSidebar;
