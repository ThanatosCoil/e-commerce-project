import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from "@/utils/api";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";

// Схема купона
export const CouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  discount: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number(),
  usageCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Coupon = z.infer<typeof CouponSchema>;

// Результат валидации купона
export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  message: string;
  code: string;
}

export const couponsApi = createApi({
  reducerPath: "couponsApi",
  baseQuery: createBaseQueryWithCSRF(API_ROUTES.COUPON),
  tagTypes: ["Coupon"],
  endpoints: (builder) => ({
    getCoupons: builder.query<Coupon[], void>({
      query: () => "/get",
      transformResponse: (response: { success: boolean; coupons: unknown }) => {
        // Проверка ответа с помощью Zod
        const result = z
          .object({
            success: z.boolean(),
            coupons: z.array(CouponSchema),
          })
          .parse(response);

        return result.coupons;
      },
      providesTags: ["Coupon"],
    }),

    // getCouponById: builder.query<Coupon, string>({
    //   query: (id) => `/api/coupon/get/${id}`,
    //   transformResponse: (response: { success: boolean; coupon: unknown }) => {
    //     const result = z
    //       .object({
    //         success: z.boolean(),
    //         coupon: CouponSchema,
    //       })
    //       .parse(response);

    //     return result.coupon;
    //   },
    //   providesTags: (result, error, id) => [{ type: "Coupon", id }],
    // }),

    createCoupon: builder.mutation<
      Coupon,
      Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usageCount">
    >({
      query: (couponData) => ({
        url: "/create",
        method: "POST",
        body: couponData,
      }),
      invalidatesTags: ["Coupon"],
    }),

    // updateCoupon: builder.mutation<
    //   Coupon,
    //   { id: string; data: Partial<Coupon> }
    // >({
    //   query: ({ id, data }) => ({
    //     url: `/api/coupon/update/${id}`,
    //     method: "PUT",
    //     body: data,
    //   }),
    //   invalidatesTags: (result, error, { id }) => [
    //     { type: "Coupon", id },
    //     "Coupon",
    //   ],
    // }),

    deleteCoupon: builder.mutation<void, string>({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),

    // Используем мутацию вместо query для валидации купона, чтобы обойти кэширование
    validateCoupon: builder.mutation<CouponValidationResult, string>({
      query: (code) => ({
        url: `/validate/${code}`,
        method: "GET",
      }),
      transformResponse: (
        response: {
          success: boolean;
          valid: boolean;
          discount?: number;
          message: string;
        },
        _meta,
        code
      ) => {
        return {
          valid: response.valid,
          discount: response.discount || 0,
          message: response.message,
          code, // Сохраняем код купона в ответе
        };
      },
    }),
  }),
});

export const {
  useGetCouponsQuery,
  //useGetCouponByIdQuery,
  useCreateCouponMutation,
  //useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponsApi;
