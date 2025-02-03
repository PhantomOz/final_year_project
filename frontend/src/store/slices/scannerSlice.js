import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import { useDispatch } from "react-redux";

// Async thunks
export const handleScanProduct = createAsyncThunk(
  "scanner/scanProduct",
  async (barcode) => {
    console.log("received barcode- ", barcode);
    const response = await api.post("/scanner-input", { barcode });
    console.log(response);
    return response.data;
  }
);

export const batchScanProducts = createAsyncThunk(
  "scanner/batchScan",
  async (barcodes) => {
    const response = await api.post("/scanner-input/batch", { barcodes });
    return response.data;
  }
);

export const validateBarcode = createAsyncThunk(
  "scanner/validateBarcode",
  async (barcode) => {
    const response = await api.post("/scanner-input/validate", { barcode });
    return response.data;
  }
);

const initialState = {
  isConnected: false,
  isScanning: false,
  lastScannedProduct: null,
  scannedProducts: [],
  scanHistory: [],
  error: null,
  loading: false,
  settings: {
    autoSubmit: true,
    scanDelay: 100,
    validateBarcodes: true,
    scanSound: true,
    vibrateOnScan: true,
  },
  deviceInfo: {
    type: null,
    name: null,
    connectionType: null,
  },
};

const scannerSlice = createSlice({
  name: "scanner",
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setScanning: (state, action) => {
      state.isScanning = action.payload;
    },
    clearScanHistory: (state) => {
      state.scanHistory = [];
    },
    clearScannedProducts: (state) => {
      state.scannedProducts = [];
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setDeviceInfo: (state, action) => {
      state.deviceInfo = { ...state.deviceInfo, ...action.payload };
    },
    addToScanHistory: (state, action) => {
      state.scanHistory.unshift({
        barcode: action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 100 scans
      if (state.scanHistory.length > 100) {
        state.scanHistory.pop();
      }
    },
    clearLastScannedProduct: (state) => {
      state.lastScannedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Scan Product
      .addCase(handleScanProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handleScanProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.lastScannedProduct = action.payload;
        state.scanHistory.unshift({
          ...action.payload,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 50 scans
        if (state.scanHistory.length > 50) {
          state.scanHistory.pop();
        }

        // Play scan sound if enabled
        if (state.settings.scanSound) {
          playScannedSound();
        }

        // Vibrate if enabled
        if (state.settings.vibrateOnScan && navigator.vibrate) {
          navigator.vibrate(50);
        }
      })
      .addCase(handleScanProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Batch Scan
      .addCase(batchScanProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(batchScanProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.scannedProducts.push(...action.payload);
        action.payload.forEach((product) => {
          state.addToScanHistory(product.barcode);
        });
      })
      .addCase(batchScanProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Validate Barcode
      .addCase(validateBarcode.fulfilled, (state, action) => {
        if (!action.payload.isValid) {
          playErrorSound();
        }
      });
  },
});

// Helper function for playing scan sound
const playScannedSound = () => {
  const audio = new Audio("/assets/sounds/scan-beep.mp3");
  audio.play().catch(() => {
    // Ignore audio play errors
  });
};

// Helper function for playing error sound
const playErrorSound = () => {
  const audio = new Audio("/assets/sounds/error-beep.mp3");
  audio.play().catch(() => {
    // Ignore audio play errors
  });
};

// Selectors
export const selectScannerState = (state) => state.scanner;
export const selectScannedProducts = (state) => state.scanner.scannedProducts;
export const selectScanHistory = (state) => state.scanner.scanHistory;
export const selectScannerSettings = (state) => state.scanner.settings;
export const selectScannerDeviceInfo = (state) => state.scanner.deviceInfo;
export const selectScannerError = (state) => state.scanner.error;
export const selectScannerLoading = (state) => state.scanner.loading;
export const selectLastScannedProduct = (state) =>
  state.scanner.lastScannedProduct;
export const selectIsScanning = (state) => state.scanner.isScanning;

// Actions
export const {
  setConnected,
  setScanning,
  clearScanHistory,
  clearScannedProducts,
  updateSettings,
  setDeviceInfo,
  addToScanHistory,
  clearLastScannedProduct,
} = scannerSlice.actions;

// Custom hook for scanner operations with notifications
export const useScannerOperations = () => {
  const { showNotification } = useNotification();
  const dispatch = useDispatch();

  const handleScannerOperation = async (operation, ...args) => {
    console.log(operation, ...args);
    try {
      const result = await dispatch(operation(...args));
      console.log(result);
      return result.payload;
    } catch (error) {
      showNotification("error", error.message || "Scanner operation failed");
      throw error;
    }
  };

  return {
    handleScanProduct: (...args) =>
      handleScannerOperation(handleScanProduct, ...args),
    handleBatchScan: (...args) =>
      handleScannerOperation(batchScanProducts, ...args),
    handleValidateBarcode: (...args) =>
      handleScannerOperation(validateBarcode, ...args),
  };
};

export default scannerSlice.reducer;
