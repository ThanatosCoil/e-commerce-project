import arcjet, {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
  validateEmail,
} from "@arcjet/next";

export const protectSignUpRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    protectSignup({
      email: {
        mode: "LIVE",
        block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      },
      bots: {
        mode: "LIVE",
        allow: [],
      },
      rateLimit: {
        mode: "LIVE",
        interval: "10m",
        max: 5,
      },
    }),
  ],
});

export const protectLoginRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    validateEmail({
      mode: "LIVE",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

export const protectCreateProductRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "60s",
      max: 10,
    }),
    shield({
      mode: "LIVE",
    }),
  ],
});

export const protectCreateCouponRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "60s",
      max: 10,
    }),
    shield({
      mode: "LIVE",
    }),
    sensitiveInfo({
      mode: "LIVE",
      deny: ["EMAIL", "CREDIT_CARD_NUMBER", "PHONE_NUMBER"],
    }),
  ],
});

export const protectPaymentRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE",
      deny: ["CATEGORY:SEARCH_ENGINE"],
    }),
    shield({
      mode: "LIVE",
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "10m",
      max: 10,
    }),
  ],
});

export const protectProductApiRules = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 30,
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});
