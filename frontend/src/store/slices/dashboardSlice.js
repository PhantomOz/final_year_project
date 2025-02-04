import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  }
);

export const fetchLowStockItems = createAsyncThunk(
  "dashboard/fetchLowStockItems",
  async () => {
    const response = await api.get("/dashboard/low-stock");
    return response.data;
  }
);

const initialState = {
  stats: {
    data: null,
    loading: false,
    error: null,
  },
  lowStockItems: {
    data: null,
    loading: false,
    error: null,
  },
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.stats.loading = true;
        state.stats.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats.loading = false;
        state.stats.data = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.stats.loading = false;
        state.stats.error = action.error.message;
      })
      // Low Stock Items
      .addCase(fetchLowStockItems.pending, (state) => {
        state.lowStockItems.loading = true;
        state.lowStockItems.error = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.lowStockItems.loading = false;
        state.lowStockItems.data = action.payload;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.lowStockItems.loading = false;
        state.lowStockItems.error = action.error.message;
      });
  },
});

// Selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectLowStockItems = (state) => state.dashboard.lowStockItems;

export default dashboardSlice.reducer;
