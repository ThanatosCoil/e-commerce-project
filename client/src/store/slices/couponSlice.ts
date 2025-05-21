import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Типы для купона
interface CouponState {
  appliedCoupon: {
    code: string;
    discount: number;
    valid: boolean;
    message: string;
  } | null;
}

// Начальное состояние
const initialState: CouponState = {
  appliedCoupon: null,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    applyCoupon: (
      state,
      action: PayloadAction<{
        code: string;
        discount: number;
        valid: boolean;
        message: string;
      }>
    ) => {
      state.appliedCoupon = action.payload;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
});

export const { applyCoupon, removeCoupon } = couponSlice.actions;
export default couponSlice.reducer;
