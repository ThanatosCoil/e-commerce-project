import { API_BASE_URL } from "@/utils/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";
import { protectProductApi } from "@/actions/product";

// Схема продукта
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  description: z.string(),
  category: z.string(),
  gender: z.string(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  stock: z.number(),
  price: z.number(),
  discount: z.number().default(0),
  images: z.array(z.string()),
  soldCount: z.number(),
  rating: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>; // Создаем тип Product на основе схемы

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: createBaseQueryWithCSRF(API_BASE_URL),
  tagTypes: ["Product", "Reviews", "UserReview", "User", "Review", "Vote"],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => "/api/product/get",
      transformResponse: (response: {
        success: boolean;
        products: unknown;
      }) => {
        // Проверка ответа с помощью Zod
        const result = z
          .object({
            success: z.boolean(),
            products: z.array(ProductSchema),
          })
          .parse(response);

        return result.products;
      },
      providesTags: ["Product"],
    }),

    getPublicProducts: builder.query<
      {
        products: Product[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      },
      {
        page?: number;
        limit?: number;
        searchQuery?: string;
        category?: string;
        brand?: string;
        gender?: string;
        colors?: string[];
        sizes?: string[];
        sortBy?: string;
        minPrice?: number;
        maxPrice?: number;
        hasDiscount?: boolean;
      }
    >({
      async queryFn(args, queryApi, extraOptions, baseQuery) {
        // Проверяем ограничения запросов перед выполнением запроса к API
        const rateCheck = await protectProductApi();
        if (!rateCheck.success) {
          return {
            error: {
              status: rateCheck.status,
              data: rateCheck.error,
            },
          };
        }

        // Создаем URL с параметрами
        const {
          page = 1,
          limit = 12,
          searchQuery = "",
          category = "",
          brand = "",
          gender = "",
          colors = [],
          sizes = [],
          sortBy = "name",
          minPrice,
          maxPrice,
          hasDiscount,
        } = args;

        let queryParams = `page=${page}&limit=${limit}`;

        // Добавляем фильтры только если они не пустые
        if (searchQuery)
          queryParams += `&searchQuery=${encodeURIComponent(searchQuery)}`;
        if (category)
          queryParams += `&category=${encodeURIComponent(category)}`;
        if (brand) queryParams += `&brand=${encodeURIComponent(brand)}`;
        if (gender) queryParams += `&gender=${encodeURIComponent(gender)}`;
        if (colors.length > 0)
          queryParams += `&colors=${encodeURIComponent(colors.join(","))}`;
        if (sizes.length > 0)
          queryParams += `&sizes=${encodeURIComponent(sizes.join(","))}`;
        if (sortBy) queryParams += `&sortBy=${encodeURIComponent(sortBy)}`;
        if (minPrice !== undefined) queryParams += `&minPrice=${minPrice}`;
        if (maxPrice !== undefined) queryParams += `&maxPrice=${maxPrice}`;
        if (hasDiscount) queryParams += `&hasDiscount=true`;

        const result = await baseQuery(`/api/product/public?${queryParams}`);

        if (result.error) return { error: result.error };

        try {
          // Проверка ответа с помощью Zod
          const data = result.data as any;
          const validatedData = z
            .object({
              success: z.boolean(),
              products: z.array(ProductSchema),
              pagination: z.object({
                total: z.number(),
                page: z.number(),
                limit: z.number(),
                pages: z.number(),
              }),
            })
            .parse(data);

          return {
            data: {
              products: validatedData.products,
              pagination: validatedData.pagination,
            },
          };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: "Failed to validate response data",
            },
          };
        }
      },
      providesTags: ["Product"],
    }),

    getProductById: builder.query<Product, string>({
      query: (id) => `/api/product/get/${id}`,
      transformResponse: (response: { success: boolean; product: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            product: ProductSchema,
          })
          .parse(response);

        return result.product;
      },
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),

    createProduct: builder.mutation<Product, FormData>({
      query: (productData) => ({
        url: "/api/product/create",
        method: "POST",
        body: productData, // FormData для файловых загрузок
        responseHandler: async (response) => {
          if (!response.ok) {
            // Получаем текст ошибки
            const text = await response.text();
            console.error("Error response:", text);
            // Пытаемся преобразовать его в JSON
            try {
              return JSON.parse(text);
            } catch (e) {
              // Если не получается парсить как JSON, возвращаем как текст
              return { success: false, message: text };
            }
          }
          // Стандартная обработка успешного ответа
          return response.json();
        },
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation<Product, { id: string; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/api/product/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        "Product",
      ],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/product/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    getLatestProducts: builder.query<Product[], number>({
      async queryFn(limit = 4, queryApi, extraOptions, baseQuery) {
        // Проверяем ограничения запросов перед выполнением запроса к API
        const rateCheck = await protectProductApi();
        if (!rateCheck.success) {
          return {
            error: {
              status: rateCheck.status,
              data: rateCheck.error,
            },
          };
        }

        const result = await baseQuery(`/api/product/latest?limit=${limit}`);
        if (result.error) return { error: result.error };

        try {
          // Проверка ответа с помощью Zod
          const data = result.data as any;
          const validatedData = z
            .object({
              success: z.boolean(),
              latestProducts: z.array(ProductSchema),
            })
            .parse(data);

          return { data: validatedData.latestProducts };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: "Failed to validate response data",
            },
          };
        }
      },
      providesTags: ["Product"],
    }),

    // Отзывы
    getProductReviews: builder.query({
      query: (productId) => `/api/reviews/product/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: "LIST" },
        ...(result?.reviews || []).map((review: any) => ({
          type: "Review" as const,
          id: review.id,
        })),
      ],
    }),

    getUserReview: builder.query({
      query: (productId) => `/api/reviews/user/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: `USER-${productId}` },
      ],
    }),

    createOrUpdateReview: builder.mutation({
      query: (body) => ({
        url: "/api/reviews",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Review", id: "LIST" },
        { type: "Review", id: `USER-${productId}` },
        { type: "Product", id: productId },
      ],
    }),

    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/api/reviews/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, reviewId) => [
        { type: "Review", id: "LIST" },
        { type: "Review", id: reviewId },
      ],
    }),

    // Новые эндпоинты для голосов
    voteReview: builder.mutation({
      query: ({ reviewId, isUpvote }) => ({
        url: `/api/reviews/${reviewId}/vote`,
        method: "POST",
        body: { isUpvote },
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Review", id: reviewId },
        { type: "Vote", id: `${reviewId}` },
      ],
    }),

    getUserVote: builder.query({
      query: (reviewId) => `/api/reviews/${reviewId}/vote`,
      providesTags: (result, error, reviewId) => [
        { type: "Vote", id: `${reviewId}` },
      ],
    }),

    deleteVote: builder.mutation({
      query: (reviewId) => ({
        url: `/api/reviews/${reviewId}/vote`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, reviewId) => [
        { type: "Review", id: reviewId },
        { type: "Vote", id: `${reviewId}` },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetLatestProductsQuery,
  useGetPublicProductsQuery,
  useGetProductReviewsQuery,
  useGetUserReviewQuery,
  useCreateOrUpdateReviewMutation,
  useDeleteReviewMutation,
  useVoteReviewMutation,
  useGetUserVoteQuery,
  useDeleteVoteMutation,
} = apiSlice;
