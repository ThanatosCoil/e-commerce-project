"use server";

import { protectCreateProductRules, protectProductApiRules } from "@/arcjet";
import { request } from "@arcjet/next";

export const protectCreateProductAction = async () => {
  const req = await request();
  const decision = await protectCreateProductRules.protect(req);

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
    }
  }

  return {
    success: true,
    status: 200,
  };
};

export const protectUpdateProductAction = async () => {
  const req = await request();
  const decision = await protectCreateProductRules.protect(req);

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
    }
  }

  return {
    success: true,
    status: 200,
  };
};

export const protectProductApi = async () => {
  try {
    const req = await request();
    const decision = await protectProductApiRules.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          success: false,
          error: "Too many requests. Please try again later.",
          status: 429,
        };
      } else if (decision.reason.isBot()) {
        return {
          success: false,
          error: "Suspicious activity detected. Access restricted.",
          status: 403,
        };
      }

      return {
        success: false,
        error: "Access restricted for security reasons.",
        status: 403,
      };
    }

    return {
      success: true,
      status: 200,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return {
      success: true,
      status: 200,
    };
  }
};
