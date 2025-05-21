"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      {/* Скелетон заголовка */}
      <div className="mb-8">
        <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Скелетон популярных продуктов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="border rounded-md p-4">
            <div className="h-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Скелетон категорий */}
      <div className="mb-8">
        <div className="h-8 w-1/4 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-24 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
