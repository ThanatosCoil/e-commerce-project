"use client";

import SuperAdminSidebar from "@/components/super-admin/sidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import "./styles/index.css";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950">
      <SuperAdminSidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div
        className={cn(
          "transition-all duration-300",

          "min-h-screen"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default SuperAdminLayout;
