import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import { authApi } from "./api/authSlice";
import { couponsApi } from "./api/couponsSlice";
import { settingsApi } from "./api/settingsSlice";
import { cartApi } from "./api/cartSlice";
import { addressApi } from "./api/addressSlice";
import { orderApi } from "./api/orderSlice";
import authReducer from "./slices/authSlice";
import couponReducer from "./slices/couponSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [couponsApi.reducerPath]: couponsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    auth: authReducer,
    coupon: couponReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      authApi.middleware,
      couponsApi.middleware,
      settingsApi.middleware,
      cartApi.middleware,
      addressApi.middleware,
      orderApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
