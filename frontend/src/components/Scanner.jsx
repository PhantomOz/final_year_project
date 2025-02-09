import { useEffect } from "react";
import { useSelector } from "react-redux";
import useScanner from "../hooks/useScanner";
import {
  selectLastScannedProduct,
  selectIsScanning,
  selectScannerError,
} from "../store/slices/scannerSlice";

const Scanner = () => {
  const { barcode, hasScanner } = useScanner();
  const lastScannedProduct = useSelector(selectLastScannedProduct);
  const isScanning = useSelector(selectIsScanning);
  const error = useSelector(selectScannerError);

  useEffect(() => {
    // Vibrate on successful scan if supported
    if (lastScannedProduct && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [lastScannedProduct]);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg">
      <div className="text-sm font-medium text-gray-500">Scanner Status</div>
      <div className="mt-1">
        {!hasScanner ? (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-red-500">No Scanner Detected</span>
          </div>
        ) : isScanning ? (
          <div className="flex items-center">
            <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-blue-500">Scanning...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-500">Ready</span>
          </div>
        )}
      </div>
      {barcode && (
        <div className="mt-2">
          <div className="text-xs text-gray-500">Current Input:</div>
          <div className="font-mono text-sm">{barcode}</div>
        </div>
      )}
      {lastScannedProduct && (
        <div className="mt-2">
          <div className="text-xs text-gray-500">Last Scanned:</div>
          <div className="text-sm font-medium">{lastScannedProduct.name}</div>
          <div className="text-xs text-gray-500">
            ₦{lastScannedProduct.price}
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-sm text-red-500">Error: {error}</div>}
    </div>
  );
};

export default Scanner;
