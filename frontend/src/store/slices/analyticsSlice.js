import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import openaiService from "../../services/openaiService";

// Async thunks
export const fetchRangeStats = createAsyncThunk(
  "analytics/fetchRangeStats",
  async (range) => {
    const response = await api.get(`/analytics/range-stats?range=${range}`);
    return response.data;
  }
);

export const fetchSalesTrends = createAsyncThunk(
  "analytics/fetchSalesTrends",
  async (range) => {
    const response = await api.get(`/analytics/sales-trends?range=${range}`);
    return response.data;
  }
);

export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async (range) => {
    const response = await api.get(`/analytics/top-products?range=${range}`);
    return response.data;
  }
);

export const generateAIInsights = createAsyncThunk(
  "analytics/generateInsights",
  async (data) => {
    const insights = await openaiService.generateInsights(data);
    return insights;
  }
);

const initialState = {
  selectedRange: "day",
  rangeStats: {
    data: null,
    loading: false,
    error: null,
  },
  salesTrends: {
    data: null,
    loading: false,
    error: null,
  },
  topProducts: {
    data: null,
    loading: false,
    error: null,
  },
  insights: {
    data: null,
    loading: false,
    error: null,
  },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.selectedRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Range Stats
      .addCase(fetchRangeStats.pending, (state) => {
        state.rangeStats.loading = true;
        state.rangeStats.error = null;
      })
      .addCase(fetchRangeStats.fulfilled, (state, action) => {
        state.rangeStats.loading = false;
        state.rangeStats.data = action.payload;
      })
      .addCase(fetchRangeStats.rejected, (state, action) => {
        state.rangeStats.loading = false;
        state.rangeStats.error = action.error.message;
      })
      // Sales Trends
      .addCase(fetchSalesTrends.pending, (state) => {
        state.salesTrends.loading = true;
        state.salesTrends.error = null;
      })
      .addCase(fetchSalesTrends.fulfilled, (state, action) => {
        state.salesTrends.loading = false;
        state.salesTrends.data = action.payload;
      })
      .addCase(fetchSalesTrends.rejected, (state, action) => {
        state.salesTrends.loading = false;
        state.salesTrends.error = action.error.message;
      })
      // Top Products
      .addCase(fetchTopProducts.pending, (state) => {
        state.topProducts.loading = true;
        state.topProducts.error = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts.loading = false;
        state.topProducts.data = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.topProducts.loading = false;
        state.topProducts.error = action.error.message;
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

// Actions
export const { setDateRange } = analyticsSlice.actions;

// Selectors
export const selectSelectedRange = (state) => state.analytics.selectedRange;
export const selectRangeStats = (state) => state.analytics.rangeStats;
export const selectSalesTrends = (state) => state.analytics.salesTrends;
export const selectTopProducts = (state) => state.analytics.topProducts;
export const selectInsights = (state) => state.analytics.insights;

export default analyticsSlice.reducer;
