import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async thunk for fetching analytics data
export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchData",
  async (dateRange) => {
    const response = await api.get(`/analytics?range=${dateRange}`);
    return response.data;
  }
);

// Format data for charts
const formatSalesTrendData = (data) => ({
  labels: data.dates,
  datasets: [
    {
      label: "Daily Sales",
      data: data.sales,
      fill: false,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
  ],
});

const formatTopProductsData = (data) => ({
  labels: data.products.map((p) => p.name),
  datasets: [
    {
      label: "Units Sold",
      data: data.products.map((p) => p.quantity),
      backgroundColor: "rgba(54, 162, 235, 0.5)",
      borderColor: "rgb(54, 162, 235)",
      borderWidth: 1,
    },
  ],
});

const formatPaymentMethodsData = (data) => ({
  labels: Object.keys(data.paymentMethods),
  datasets: [
    {
      data: Object.values(data.paymentMethods),
      backgroundColor: [
        "rgba(255, 99, 132, 0.5)",
        "rgba(54, 162, 235, 0.5)",
        "rgba(255, 206, 86, 0.5)",
      ],
      borderColor: [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
      ],
      borderWidth: 1,
    },
  ],
});

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    loading: false,
    error: null,
    data: {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalProductsSold: 0,
      salesTrend: null,
      topProducts: null,
      paymentMethods: null,
      lowStockProducts: [],
    },
    dateRange: "week",
  },
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
        const data = action.payload;

        state.data = {
          totalSales: data.totalSales,
          totalOrders: data.totalOrders,
          averageOrderValue: data.averageOrderValue,
          totalProductsSold: data.totalProductsSold,
          salesTrend: formatSalesTrendData(data.salesTrend),
          topProducts: formatTopProductsData(data.topProducts),
          paymentMethods: formatPaymentMethodsData(data.paymentMethods),
          lowStockProducts: data.lowStockProducts,
        };
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Selectors
export const selectAnalyticsData = (state) => state.analytics.data;
export const selectAnalyticsLoading = (state) => state.analytics.loading;
export const selectAnalyticsError = (state) => state.analytics.error;
export const selectDateRange = (state) => state.analytics.dateRange;

// Actions
export const { setDateRange } = analyticsSlice.actions;

export default analyticsSlice.reducer;
