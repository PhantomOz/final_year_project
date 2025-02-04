import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import transactionReducer from "./slices/transactionSlice";
import analyticsReducer from "./slices/analyticsSlice";
import scannerReducer from "./slices/scannerSlice";
import userReducer from "./slices/userSlice";
import dashboardReducer from "./slices/dashboardSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist authentication state
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    products: productReducer,
    transactions: transactionReducer,
    users: userReducer,
    analytics: analyticsReducer,
    dashboard: dashboardReducer,
    scanner: scannerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
