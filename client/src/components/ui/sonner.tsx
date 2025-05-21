"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast custom-toast",
          title: "font-semibold text-[0.95rem] text-black",
          description: "text-black font-medium",
          success: "bg-green-50 border border-green-200",
          error: "bg-white border-2 border-red-400",
          info: "bg-blue-50 border border-blue-200",
          warning: "bg-amber-50 border border-amber-200",
        },
        duration: 3500,
      }}
      position="bottom-right"
      closeButton={true}
      {...props}
    />
  );
};

export { Toaster };
