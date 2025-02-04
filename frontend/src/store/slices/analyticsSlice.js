import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import openaiService from "../../services/openaiService";

const initialState = {
  loading: false,
  error: null,
  dateRange: "daily",
  salesTrends: {
    labels: [],
    datasets: [
      {
        label: "Sales",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Moving Average",
        data: [],
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1,
        borderDash: [5, 5],
      },
    ],
  },
  topProducts: {
    labels: [],
    datasets: [
      {
        label: "Revenue",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  },
  seasonalTrends: {
    labels: [],
    datasets: [
      {
        label: "Monthly Sales",
        data: [],
        borderColor: "rgb(153, 102, 255)",
        tension: 0.1,
      },
    ],
  },
  lowStockProducts: [],
  dashboardStats: {
    todayTransactions: 0,
    todayRevenue: 0,
    activeUsers: 0,
    lowStockItems: 0,
    totalProducts: 0,
    totalSales: 0,
  },
  insights: {
    loading: false,
    error: null,
    data: null,
  },
};

// Async thunks for fetching different types of analytics data
export const fetchSalesTrends = createAsyncThunk(
  "analytics/fetchSalesTrends",
  async (timeFrame) => {
    const response = await api.get(
      `/analytics/sales-trends?timeFrame=${timeFrame}`
    );
    return response.data;
  }
);

export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async () => {
    const response = await api.get("/analytics/top-products");
    return response.data;
  }
);

export const fetchSeasonalTrends = createAsyncThunk(
  "analytics/fetchSeasonalTrends",
  async () => {
    const response = await api.get("/analytics/seasonal-trends");
    return response.data;
  }
);

export const fetchLowStockAlerts = createAsyncThunk(
  "analytics/fetchLowStockAlerts",
  async () => {
    const response = await api.get("/analytics/low-stock");
    return response.data;
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async () => {
    const response = await api.get("/analytics/dashboard-stats");
    return response.data;
  }
);

export const generateAIInsights = createAsyncThunk(
  "analytics/generateInsights",
  async (_, { getState }) => {
    const state = getState();
    const analyticsData = {
      salesTrends: state.analytics.salesTrends,
      topProducts: state.analytics.topProducts,
      seasonalTrends: state.analytics.seasonalTrends,
      dashboardStats: state.analytics.dashboardStats,
    };

    const insights = await openaiService.generateInsights(analyticsData);
    return insights;
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
    // Sales Trends
    builder
      .addCase(fetchSalesTrends.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSalesTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.salesTrends = action.payload;
      })
      .addCase(fetchSalesTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Top Products
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload;
      })
      // Seasonal Trends
      .addCase(fetchSeasonalTrends.fulfilled, (state, action) => {
        state.seasonalTrends = action.payload;
      })
      // Low Stock Alerts
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.lowStockProducts = action.payload;
      })
      // Dashboard Stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // AI Insights
      .addCase(generateAIInsights.pending, (state) => {
        state.insights.loading = true;
        state.insights.error = null;
      })
      .addCase(generateAIInsights.fulfilled, (state, action) => {
        state.insights.loading = false;
        state.insights.data = action.payload;
      })
      .addCase(generateAIInsights.rejected, (state, action) => {
        state.insights.loading = false;
        state.insights.error = action.error.message;
      });
  },
});

export const { setDateRange } = analyticsSlice.actions;

// Selectors
export const selectAnalyticsState = (state) => state.analytics;
export const selectDateRange = (state) => state.analytics.dateRange;
export const selectSalesTrends = (state) => state.analytics.salesTrends;
export const selectTopProducts = (state) => state.analytics.topProducts;
export const selectSeasonalTrends = (state) => state.analytics.seasonalTrends;
export const selectLowStockProducts = (state) =>
  state.analytics.lowStockProducts;
export const selectDashboardStats = (state) => state.analytics.dashboardStats;
export const selectAnalyticsLoading = (state) => state.analytics.loading;
export const selectAnalyticsError = (state) => state.analytics.error;
export const selectInsights = (state) => state.analytics.insights;

export default analyticsSlice.reducer;
