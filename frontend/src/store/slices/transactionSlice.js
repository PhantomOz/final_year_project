import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import { updateStock } from "./productSlice";
import { useDispatch } from "react-redux";

// Async thunks
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async ({ startDate, endDate, limit } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (limit) params.append("limit", limit);

    const response = await api.get(`/transactions?${params}`);
    return response.data;
  }
);

export const createTransaction = createAsyncThunk(
  "transactions/create",
  async (transactionData, { dispatch }) => {
    const response = await api.post("/transactions", transactionData);
    console.log(transactionData);
    // Update stock levels for each product in the transaction
    for (const item of transactionData.items) {
      await dispatch(
        updateStock({
          id: item.product_id,
          quantity: item.quantity,
          type: "decrease",
        })
      );
    }

    return response.data;
  }
);

export const voidTransaction = createAsyncThunk(
  "transactions/void",
  async ({ id, reason }, { dispatch }) => {
    const response = await api.post(`/transactions/${id}/void`, { reason });

    // Restore stock levels for voided transaction
    for (const item of response.data.items) {
      await dispatch(
        updateStock({
          id: item.product_id,
          quantity: item.quantity,
          type: "increase",
        })
      );
    }

    return response.data;
  }
);

export const getTransactionById = createAsyncThunk(
  "transactions/getById",
  async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  }
);

export const getDailyTransactions = createAsyncThunk(
  "transactions/getDaily",
  async (date) => {
    const response = await api.get(`/transactions/daily?date=${date}`);
    return response.data;
  }
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState: {
    transactions: [],
    currentTransaction: null,
    dailyTransactions: [],
    loading: false,
    error: null,
    stats: {
      totalSales: 0,
      totalTransactions: 0,
      averageTransaction: 0,
    },
    filters: {
      startDate: null,
      endDate: null,
      paymentMethod: "all",
      minAmount: null,
      maxAmount: null,
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    updateStats: (state) => {
      const validTransactions = state.transactions.filter((t) => !t.voided);
      state.stats.totalTransactions = validTransactions.length;
      state.stats.totalSales = validTransactions.reduce(
        (sum, t) => sum + t.total_amount,
        0
      );
      state.stats.averageTransaction =
        state.stats.totalTransactions > 0
          ? state.stats.totalSales / state.stats.totalTransactions
          : 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.pagination.totalPages = action.payload.totalPages;
        state.updateStats();
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
        state.currentTransaction = action.payload;
        updateStats();
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Void Transaction
      .addCase(voidTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voidTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        updateStats();
      })
      .addCase(voidTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get Transaction by ID
      .addCase(getTransactionById.fulfilled, (state, action) => {
        state.currentTransaction = action.payload;
      })

      // Get Daily Transactions
      .addCase(getDailyTransactions.fulfilled, (state, action) => {
        state.dailyTransactions = action.payload;
      });
  },
});

// Selectors
export const selectTransactions = (state) => state.transactions.transactions;
export const selectCurrentTransaction = (state) =>
  state.transactions.currentTransaction;
export const selectTransactionLoading = (state) => state.transactions.loading;
export const selectTransactionError = (state) => state.transactions.error;
export const selectTransactionStats = (state) => state.transactions.stats;
export const selectTransactionFilters = (state) => state.transactions.filters;
export const selectTransactionPagination = (state) =>
  state.transactions.pagination;
export const selectDailyTransactions = (state) =>
  state.transactions.dailyTransactions;

// Filter transactions selector
export const selectFilteredTransactions = (state) => {
  const { transactions, filters } = state.transactions;
  return transactions.filter((transaction) => {
    const dateInRange =
      (!filters.startDate ||
        new Date(transaction.created_at) >= new Date(filters.startDate)) &&
      (!filters.endDate ||
        new Date(transaction.created_at) <= new Date(filters.endDate));
    const matchesPaymentMethod =
      filters.paymentMethod === "all" ||
      transaction.payment_method === filters.paymentMethod;
    const matchesAmount =
      (!filters.minAmount || transaction.total_amount >= filters.minAmount) &&
      (!filters.maxAmount || transaction.total_amount <= filters.maxAmount);
    return dateInRange && matchesPaymentMethod && matchesAmount;
  });
};

// Actions
export const {
  setFilters,
  setPagination,
  clearCurrentTransaction,
  updateStats,
} = transactionSlice.actions;

// Custom hook for transaction operations with notifications
export const useTransactionOperations = () => {
  const { showNotification } = useNotification();
  const dispatch = useDispatch();

  const handleTransactionOperation = async (operation, ...args) => {
    try {
      const result = await dispatch(operation(...args));
      showNotification("success", "Transaction completed successfully");
      return result;
    } catch (error) {
      showNotification("error", error.message || "Transaction failed");
      throw error;
    }
  };

  return {
    handleCreateTransaction: (...args) =>
      handleTransactionOperation(createTransaction, ...args),
    handleVoidTransaction: (...args) =>
      handleTransactionOperation(voidTransaction, ...args),
  };
};

export default transactionSlice.reducer;
