import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { API_BASE_URL } from "./utils/api";

const publicRoutes = [
  "/auth/register",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
];
const superAdminRoutes = ["/super-admin", "/super-admin/:path*"];
const userRoutes = [
  "/home",
  "/about",
  "/account",
  "/products",
  "/products/:path*",
  "/cart",
  "/orders",
  "/order-confirmation/:path*",
  "/checkout",
];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const { role } = payload as { role: string };

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "SUPER_ADMIN" ? "/super-admin" : "/home",
            request.url
          )
        );
      }

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) =>
          route.includes(":path*")
            ? pathname.startsWith(route.split(":path*")[0])
            : pathname === route
        )
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) =>
          route.includes(":path*")
            ? pathname.startsWith(route.split(":path*")[0])
            : pathname === route
        )
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.log("Token verification error", error);
      try {
        // Пытаемся обновить токен
        const refreshResponse = await fetch(
          `${API_BASE_URL}/api/auth/refresh-token`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
            },
          }
        );

        if (refreshResponse.ok) {
          // Получаем ответ от сервера
          const jsonResponse = await refreshResponse.json();

          // Получаем заголовки Set-Cookie из ответа
          const cookies = refreshResponse.headers.getSetCookie();

          // Создаем ответ с перенаправлением на текущий URL
          const response = NextResponse.redirect(request.url);

          // Устанавливаем полученные cookie
          for (const cookie of cookies) {
            // Извлекаем имя cookie
            const cookieName = cookie.split("=")[0];
            response.headers.append("Set-Cookie", cookie);
          }

          return response;
        } else {
          // Если обновление не удалось, перенаправляем на страницу логина
          const response = NextResponse.redirect(
            new URL("/auth/login", request.url)
          );
          response.cookies.delete("accessToken");
          response.cookies.delete("refreshToken");
          return response;
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // В случае ошибки при обновлении токена перенаправляем на страницу логина
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
  }

  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
