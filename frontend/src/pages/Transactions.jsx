import { useState, useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
import { useTransactionOperations } from "../store/slices/transactionSlice";
import { useScannerOperations } from "../store/slices/scannerSlice";
// import { selectProducts } from "../store/slices/productSlice";
import {
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import ReceiptPrinter from "../components/ReceiptPrinter";
import { useNotification } from "../context/NotificationContext";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/formatCurrency";

const Transactions = () => {
  // const dispatch = useDispatch();
  // const products = useSelector(selectProducts);
  const { showNotification } = useNotification();
  const { handleCreateTransaction } = useTransactionOperations();
  const { handleScanProduct } = useScannerOperations();
  const { user } = useSelector((state) => state.auth);

  const barcodeInputRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  const addToCart = (product) => {
    if (!product) {
      showNotification("error", "Product does not exist in the database");
      return;
    }

    if (!product.id || !product.price) {
      console.error(
        "Invalid product format - missing required fields:",
        product
      );
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleScannedBarcode = async (barcode) => {
    try {
      const cleanBarcode = barcode.trim();
      console.log("Scanning barcode:", cleanBarcode);
      const product = await handleScanProduct(cleanBarcode);

      if (!product) {
        showNotification(
          "error",
          `Product with barcode ${cleanBarcode} not found in database`
        );
        return;
      }

      addToCart(product);
      showNotification("success", `Added ${product.name} to cart`);
    } catch (err) {
      console.error("Scan failed:", err);
      if (err.response?.status === 404) {
        showNotification(
          "error",
          `Product with barcode ${barcode} not found in database`
        );
      } else {
        showNotification("error", "Failed to scan product. Please try again.");
      }
    }
  };

  useEffect(() => {
    let lastKeyTime = Date.now();
    let accumulatedInput = "";

    const handleKeyPress = (e) => {
      // Ignore if focus is on input field
      if (e.target.tagName === "INPUT") {
        return;
      }

      const currentTime = Date.now();

      // If there's a long delay between keystrokes, start fresh
      if (currentTime - lastKeyTime > 100) {
        accumulatedInput = "";
      }

      // Add the character to our accumulated input
      if (/^[a-zA-Z0-9]+$/.test(e.key)) {
        accumulatedInput += e.key;
      }

      // Process barcode when Enter is pressed or after a delay
      if (e.key === "Enter") {
        if (accumulatedInput.length > 0) {
          handleScannedBarcode(accumulatedInput);
          accumulatedInput = "";
        }
      } else {
        // Set a timeout to process the barcode if no more keys are pressed
        setTimeout(() => {
          if (accumulatedInput.length >= 5 && currentTime === lastKeyTime) {
            // Only process if no new keys were pressed
            handleScannedBarcode(accumulatedInput);
            accumulatedInput = "";
          }
        }, 50);
      }

      lastKeyTime = currentTime;
      console.log("Accumulated:", accumulatedInput); // Debug log
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Handle manual barcode input
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const barcode = barcodeInputRef.current.value;
    if (barcode) {
      await handleScannedBarcode(barcode);
      barcodeInputRef.current.value = "";
    }
  };

  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    console.log("Cart-", cart);
    try {
      const transaction = await handleCreateTransaction({
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        payment_method: paymentMethod,
        total_amount: calculateTotal(),
        user_id: user?.id,
      });
      console.log("transactions -", transaction);
      setCompletedTransaction(transaction?.payload);
      setShowReceipt(true);
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner and Cart Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Scanner</h2>
            <form onSubmit={handleBarcodeSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Scan or enter barcode..."
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <MinusIcon className="h-4 w-4 text-gray-500" />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <PlusIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Checkout Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Checkout</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                      paymentMethod === "cash"
                        ? "border-blue-500 text-blue-500"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                      paymentMethod === "card"
                        ? "border-blue-500 text-blue-500"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Card
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && completedTransaction && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <ReceiptPrinter transaction={completedTransaction} />
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
