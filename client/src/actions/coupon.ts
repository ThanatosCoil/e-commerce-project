"use server";

import { protectCreateCouponRules } from "@/arcjet";
import { request } from "@arcjet/next";

export const protectCreateCouponAction = async (couponData?: {
  code: string;
}) => {
  // Получаем базовый запрос
  const req = await request();

  // Если есть данные купона, добавляем их в URL запроса для проверки
  // Arcjet проверяет URL и другие части запроса на наличие чувствительной информации
  if (couponData?.code) {
    // @ts-ignore - для прямого доступа к внутренним свойствам запроса
    if (req.url && req.url instanceof URL) {
      // @ts-ignore
      req.url.searchParams.append("coupon", couponData.code);
    }
  }

  const decision = await protectCreateCouponRules.protect(req);

  if (decision.isDenied()) {
    if (decision.reason.isBot()) {
      return {
        error: "Bot activity detected",
        success: false,
        status: 403,
      };
    } else if (decision.reason.isRateLimit()) {
      return {
        error: "Too many requests. Please try again later.",
        success: false,
        status: 429,
      };
    } else if (decision.reason.isShield()) {
      return {
        error: "Invalid activity detected",
        success: false,
        status: 403,
      };
    } else if (decision.reason.isSensitiveInfo()) {
      return {
        error: "Sensitive information detected",
        success: false,
        status: 403,
      };
    }
  }

  return {
    success: true,
    status: 200,
  };
};
