import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import transactionReducer from "./slices/transactionSlice";
import analyticsReducer from "./slices/analyticsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    transactions: transactionReducer,
    analytics: analyticsReducer,
  },
});

export default store;
