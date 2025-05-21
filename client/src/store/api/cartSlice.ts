import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from "@/utils/api";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";

// Схема элемента корзины
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  price: z.number().nullable(),
  discount: z.number().nullable(),
  image: z.string().nullable(),
  quantity: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  stock: z.number().optional(),
  availableStock: z.number().optional(),
  createdAt: z.string().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: createBaseQueryWithCSRF(API_ROUTES.CART),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    getCart: builder.query<CartItem[], void>({
      query: () => "/",
      transformResponse: (response: { success: boolean; data: unknown }) => {
        // Проверка ответа с помощью Zod
        const result = z
          .object({
            success: z.boolean(),
            data: z.array(CartItemSchema),
          })
          .parse(response);

        return result.data;
      },
      providesTags: ["Cart"],
    }),

    addToCart: builder.mutation<
      CartItem,
      {
        productId: string;
        quantity: number;
        size?: string;
        color?: string;
      }
    >({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),

    updateCartItemQuantity: builder.mutation<
      CartItem,
      { id: string; quantity: number }
    >({
      query: ({ id, quantity }) => ({
        url: `/${id}`,
        method: "PUT",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),

    removeFromCart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<void, void>({
      query: () => ({
        url: "/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} = cartApi;
