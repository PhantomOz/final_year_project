import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const initialState = {
  loading: false,
  error: null,
  dateRange: "week",
  salesData: {
    labels: [],
    datasets: [
      {
        label: "Sales",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  },
  topProducts: {
    labels: [],
    datasets: [
      {
        label: "Top Products",
        data: [],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  },
  kpiData: {
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
  },
  totalSales: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  totalProductsSold: 0,
};

// Async thunk for fetching analytics data
export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchData",
  async (timeRange) => {
    const response = await api.get(
      `/analytics/dashboard?timeRange=${timeRange}`
    );
    return response.data;
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.loading = false;
        state.salesData = {
          labels: action.payload.salesData.labels,
          datasets: [
            {
              label: "Sales",
              data: action.payload.salesData.data,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
            },
          ],
        };
        state.topProducts = {
          labels: action.payload.topProducts.labels,
          datasets: [
            {
              label: "Top Products",
              data: action.payload.topProducts.data,
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
          ],
        };
        state.kpiData = {
          totalSales: action.payload.totalSales,
          totalProducts: action.payload.totalProducts,
          lowStockItems: action.payload.lowStockItems,
        };
        state.totalSales = action.payload.totalSales;
        state.totalOrders = action.payload.totalOrders;
        state.averageOrderValue = action.payload.averageOrderValue;
        state.totalProductsSold = action.payload.totalProductsSold;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setDateRange } = analyticsSlice.actions;

// Selectors
export const selectAnalyticsData = (state) => ({
  salesData: state.analytics.salesData,
  topProducts: state.analytics.topProducts,
  kpiData: state.analytics.kpiData,
  totalSales: state.analytics.totalSales,
  totalOrders: state.analytics.totalOrders,
  averageOrderValue: state.analytics.averageOrderValue,
  totalProductsSold: state.analytics.totalProductsSold,
});
export const selectAnalyticsLoading = (state) => state.analytics.loading;
export const selectAnalyticsError = (state) => state.analytics.error;
export const selectDateRange = (state) => state.analytics.dateRange;

export default analyticsSlice.reducer;
