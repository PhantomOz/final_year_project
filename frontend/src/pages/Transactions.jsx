import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTransaction } from "../store/slices/transactionSlice";
import { scanProduct } from "../store/slices/scannerSlice";

const Transactions = () => {
  const dispatch = useDispatch();
  const barcodeInputRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Focus barcode input when component mounts
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const barcode = barcodeInputRef.current.value;
    try {
      const product = await dispatch(scanProduct(barcode)).unwrap();
      addToCart(product);
      barcodeInputRef.current.value = "";
    } catch (err) {
      console.error("Error scanning product:", err);
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product_id === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        { product_id: product.id, quantity: 1, unit_price: product.price },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product_id !== productId)
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      await dispatch(
        createTransaction({
          user_id: user.id,
          items: cart,
          payment_method: paymentMethod,
        })
      ).unwrap();

      setCart([]);
      setPaymentMethod("cash");
      alert("Transaction completed successfully!");
    } catch (err) {
      console.error("Error processing transaction:", err);
      alert("Error processing transaction. Please try again.");
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">New Transaction</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Input */}
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Barcode
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Scan or enter barcode"
            />
          </form>

          {/* Cart */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Cart</h2>
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center py-2"
              >
                <span>
                  {item.product_id} x {item.quantity} @ ${item.unit_price}
                </span>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Checkout</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="text-xl font-bold mb-4">
            Total: ${total.toFixed(2)}
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Complete Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
