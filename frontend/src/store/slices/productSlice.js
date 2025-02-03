import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { useNotification } from "../../context/NotificationContext";

// Async thunks
export const fetchProducts = createAsyncThunk("products/fetchAll", async () => {
  const response = await api.get("/products");
  return response.data;
});

export const createProduct = createAsyncThunk(
  "products/create",
  async (productData) => {
    const response = await api.post("/products", productData);
    return response.data;
  }
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, ...productData }) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk("products/delete", async (id) => {
  await api.delete(`/products/${id}`);
  return id;
});

export const updateStock = createAsyncThunk(
  "products/updateStock",
  async ({ id, quantity, type }) => {
    const response = await api.patch(`/products/${id}/stock`, {
      quantity,
      type,
    });
    return response.data;
  }
);

export const searchProducts = createAsyncThunk(
  "products/search",
  async (searchTerm) => {
    const response = await api.get(`/products/search?q=${searchTerm}`);
    return response.data;
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    filteredProducts: [],
    loading: false,
    error: null,
    selectedProduct: null,
    searchTerm: "",
    categories: [],
    lowStockThreshold: 10,
  },
  reducers: {
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      // Filter products locally if they're already loaded
      if (state.products.length > 0) {
        state.filteredProducts = state.products.filter(
          (product) =>
            product.name.toLowerCase().includes(action.payload.toLowerCase()) ||
            product.barcode.includes(action.payload)
        );
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setLowStockThreshold: (state, action) => {
      state.lowStockThreshold = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.filteredProducts = action.payload;
        // Extract unique categories
        state.categories = [
          ...new Set(action.payload.map((product) => product.category)),
        ];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        state.filteredProducts = state.products;
        if (!state.categories.includes(action.payload.category)) {
          state.categories.push(action.payload.category);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
          state.filteredProducts = state.products;
        }
        // Update categories if needed
        state.categories = [
          ...new Set(state.products.map((product) => product.category)),
        ];
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (product) => product.id !== action.payload
        );
        state.filteredProducts = state.products;
        // Update categories
        state.categories = [
          ...new Set(state.products.map((product) => product.category)),
        ];
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update Stock
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
          state.filteredProducts = state.products;
        }
      })

      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredProducts = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectFilteredProducts = (state) =>
  state.products.filteredProducts;
export const selectProductLoading = (state) => state.products.loading;
export const selectProductError = (state) => state.products.error;
export const selectSelectedProduct = (state) => state.products.selectedProduct;
export const selectCategories = (state) => state.products.categories;
export const selectLowStockProducts = (state) =>
  state.products.products.filter(
    (product) => product.stock_quantity <= state.products.lowStockThreshold
  );

// Actions
export const {
  setSelectedProduct,
  setSearchTerm,
  clearError,
  setLowStockThreshold,
} = productSlice.actions;

// Custom hook for product operations with notifications
export const useProductOperations = () => {
  const { showNotification } = useNotification();

  const handleProductOperation = async (operation, ...args) => {
    try {
      await operation(...args);
      showNotification("success", "Operation completed successfully");
    } catch (error) {
      showNotification("error", error.message || "Operation failed");
      throw error;
    }
  };

  return {
    handleCreateProduct: (...args) =>
      handleProductOperation(createProduct, ...args),
    handleUpdateProduct: (...args) =>
      handleProductOperation(updateProduct, ...args),
    handleDeleteProduct: (...args) =>
      handleProductOperation(deleteProduct, ...args),
    handleUpdateStock: (...args) =>
      handleProductOperation(updateStock, ...args),
  };
};

export default productSlice.reducer;
