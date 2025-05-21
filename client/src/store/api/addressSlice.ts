import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from "@/utils/api";
import { z } from "zod";
import { createBaseQueryWithCSRF } from "./baseApi";

// Схема адреса
export const AddressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  address: z.string(),
  country: z.string(),
  city: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Address = z.infer<typeof AddressSchema>;

export interface CreateAddressRequest {
  name: string;
  address: string;
  country: string;
  city: string;
  zipCode: string;
  phone: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends CreateAddressRequest {
  id: string;
}

export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery: createBaseQueryWithCSRF(API_ROUTES.ADDRESS),
  tagTypes: ["Addresses"],
  endpoints: (builder) => ({
    getAddresses: builder.query<Address[], void>({
      query: () => "/",
      transformResponse: (response: { success: boolean; address: unknown }) => {
        // Проверка ответа с помощью Zod
        const result = z
          .object({
            success: z.boolean(),
            address: z.array(AddressSchema),
          })
          .parse(response);

        return result.address;
      },
      providesTags: ["Addresses"],
    }),

    createAddress: builder.mutation<Address, CreateAddressRequest>({
      query: (address) => ({
        url: "/",
        method: "POST",
        body: address,
      }),
      transformResponse: (response: { success: boolean; address: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            address: AddressSchema,
          })
          .parse(response);

        return result.address;
      },
      invalidatesTags: ["Addresses"],
    }),

    updateAddress: builder.mutation<Address, UpdateAddressRequest>({
      query: ({ id, ...address }) => ({
        url: `/${id}`,
        method: "PUT",
        body: address,
      }),
      transformResponse: (response: { success: boolean; address: unknown }) => {
        const result = z
          .object({
            success: z.boolean(),
            address: AddressSchema,
          })
          .parse(response);

        return result.address;
      },
      invalidatesTags: ["Addresses"],
    }),

    deleteAddress: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Addresses"],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApi;
