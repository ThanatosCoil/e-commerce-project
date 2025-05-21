import { API_BASE_URL } from "@/utils/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";

// Схема для баннеров
export const FeatureBannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  displayOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FeatureBanner = z.infer<typeof FeatureBannerSchema>;

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: createBaseQueryWithCSRF(API_BASE_URL),
  tagTypes: ["FeatureBanner", "FeaturedProduct"],
  endpoints: (builder) => ({
    // Баннеры
    getFeatureBanners: builder.query<FeatureBanner[], void>({
      query: () => "/api/settings/banners",
      transformResponse: (response: { success: boolean; banners: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            banners: z.array(FeatureBannerSchema),
          })
          .parse(response);

        return result.banners;
      },
      providesTags: ["FeatureBanner"],
    }),

    addFeatureBanners: builder.mutation<FeatureBanner[], FormData>({
      query: (bannerData) => ({
        url: "/api/settings/banners",
        method: "POST",
        body: bannerData,
        formData: true,
        responseHandler: async (response) => {
          if (!response.ok) {
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch (e) {
              return { success: false, message: text };
            }
          }
          return response.json();
        },
      }),
      invalidatesTags: ["FeatureBanner"],
    }),

    deleteFeatureBanner: builder.mutation<void, string>({
      query: (bannerId) => ({
        url: `/api/settings/banners/${bannerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FeatureBanner"],
    }),

    updateBannerOrder: builder.mutation<
      void,
      Array<{ id: string; order: number }>
    >({
      query: (bannerOrder) => ({
        url: `/api/settings/banners/order`,
        method: "POST",
        body: { bannerOrder },
      }),
      invalidatesTags: ["FeatureBanner"],
    }),

    // Товары
    getFeaturedProducts: builder.query<any[], void>({
      query: () => "/api/settings/featured",
      transformResponse: (response: {
        success: boolean;
        featuredProducts: unknown;
      }) => {
        const result = z
          .object({
            success: z.boolean(),
            featuredProducts: z.array(z.any()),
          })
          .parse(response);

        return result.featuredProducts;
      },
      providesTags: ["FeaturedProduct"],
    }),

    updateFeaturedProducts: builder.mutation<void, string[]>({
      query: (productIds) => ({
        url: "/api/settings/featured",
        method: "POST",
        body: { productIds },
      }),
      invalidatesTags: ["FeaturedProduct"],
    }),
  }),
});

export const {
  useGetFeatureBannersQuery,
  useAddFeatureBannersMutation,
  useDeleteFeatureBannerMutation,
  useUpdateBannerOrderMutation,
  useGetFeaturedProductsQuery,
  useUpdateFeaturedProductsMutation,
} = settingsApi;
