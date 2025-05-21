import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from "@/utils/api";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  productCategory: z.string(),
  quantity: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  price: z.number(),
  discount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Схемы для связанных сущностей
export const AddressSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  country: z.string(),
  city: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  isDefault: z.boolean().optional(),
});

export const CouponSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  discount: z.number(),
});

// Схема для пользователя
export const UserSchema = z.object({
  name: z.string().nullable(),
  email: z.string(),
});

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  addressId: z.string(),
  total: z.number(),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"]),
  paymentMethod: z.enum(["CREDIT_CARD", "CASH_ON_DELIVERY"]),
  paymentStatus: z.enum(["PENDING", "SUCCESS", "FAILED"]),
  paymentId: z.string().nullable(),
  paymentDate: z.string().nullable().optional(),
  couponId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(OrderItemSchema),
  address: AddressSchema.nullable().optional(),
  coupon: CouponSchema.nullable().optional(),
  user: UserSchema.optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: "CREDIT_CARD" | "CASH_ON_DELIVERY";
  couponId?: string;
  paymentIntentId?: string; // Для Stripe платежей
  total: number;
}

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: createBaseQueryWithCSRF(API_ROUTES.ORDER),
  tagTypes: ["Orders", "Order", "AdminOrders"],
  endpoints: (builder) => ({
    createOrder: builder.mutation<{ orderId: string }, CreateOrderRequest>({
      query: (orderData) => ({
        url: "/create",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Orders", "AdminOrders"],
    }),

    getOrders: builder.query<Order[], void>({
      query: () => "/",
      transformResponse: (response: { success: boolean; orders: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            orders: z.array(OrderSchema),
          })
          .parse(response);
        return result.orders;
      },
      providesTags: ["Orders"],
    }),

    // Эндпоинт для получения всех заказов (только для администратора)
    getAllOrders: builder.query<Order[], void>({
      query: () => "/admin/all",
      transformResponse: (response: { success: boolean; orders: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            orders: z.array(OrderSchema),
          })
          .parse(response);
        return result.orders;
      },
      providesTags: ["AdminOrders"],
    }),

    getOrderById: builder.query<Order, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: { success: boolean; order: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            order: OrderSchema,
          })
          .parse(response);
        return result.order;
      },
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),

    // Создаёт платежный интент с помощью Stripe
    createPaymentIntent: builder.mutation<
      { clientSecret: string },
      { amount: number }
    >({
      query: (data) => ({
        url: "/payment-intent",
        method: "POST",
        body: data,
      }),
    }),

    // Обновляет статус оплаты заказа
    updatePaymentStatus: builder.mutation<
      void,
      { orderId: string; paymentIntentId: string; status: "SUCCESS" | "FAILED" }
    >({
      query: (data) => ({
        url: `/payment-status/${data.orderId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        "Orders",
        "AdminOrders",
      ],
    }),

    // Обновляет статус заказа
    updateOrderStatus: builder.mutation<
      void,
      {
        orderId: string;
        status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELED";
      }
    >({
      query: (data) => ({
        url: `/status/${data.orderId}`,
        method: "PUT",
        body: { status: data.status },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        "Orders",
        "AdminOrders",
      ],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useCreatePaymentIntentMutation,
  useUpdatePaymentStatusMutation,
  useUpdateOrderStatusMutation,
} = orderApi;
