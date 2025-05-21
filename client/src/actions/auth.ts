"use server";
import { protectSignUpRules, protectLoginRules } from "@/arcjet";
import { request } from "@arcjet/next";

export const protectSignupAction = async (email: string) => {
  const req = await request();
  const decision = await protectSignUpRules.protect(req, { email });

  if (decision.isDenied()) {
    if (decision.reason.isEmail()) {
      const emailTypes = decision.reason.emailTypes;
      if (emailTypes.includes("DISPOSABLE")) {
        return {
          error: "Disposable email address are not allowed",
          success: false,
          status: 403,
        };
      } else if (emailTypes.includes("INVALID")) {
        return {
          error: "Invalid email",
          success: false,
          status: 403,
        };
      } else if (emailTypes.includes("NO_MX_RECORDS")) {
        return {
          error: "Email domain does not have a valid MX record",
          success: false,
          status: 403,
        };
      }
    } else if (decision.reason.isBot()) {
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
    }
  }

  return {
    success: true,
    status: 200,
  };
};

export const protectLoginAction = async (email: string) => {
  const req = await request();
  const decision = await protectLoginRules.protect(req, { email });

  if (decision.isDenied()) {
    if (decision.reason.isEmail()) {
      const emailTypes = decision.reason.emailTypes;
      if (emailTypes.includes("DISPOSABLE")) {
        return {
          error: "Disposable email address are not allowed",
          success: false,
          status: 403,
        };
      } else if (emailTypes.includes("INVALID")) {
        return {
          error: "Invalid email",
          success: false,
          status: 403,
        };
      } else if (emailTypes.includes("NO_MX_RECORDS")) {
        return {
          error: "Email domain does not have a valid MX record",
          success: false,
          status: 403,
        };
      }
    }
  }

  return {
    success: true,
    status: 200,
  };
};
