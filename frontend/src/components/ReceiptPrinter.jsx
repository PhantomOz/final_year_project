import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "../utils/formatCurrency";
// import { PrinterIcon } from "@heroicons/react/24/outline";

const Receipt = React.forwardRef(({ transaction }, ref) => (
  <div ref={ref} className="p-4 bg-white">
    <div className="text-center mb-4">
      <h2 className="text-xl font-bold">Store Name</h2>
      <p>123 Store Street</p>
      <p>City, State 12345</p>
      <p>Tel: (123) 456-7890</p>
    </div>

    <div className="mb-4">
      <p>Receipt #: {transaction?.id}</p>
      <p>Date: {new Date(transaction?.created_at).toLocaleString()}</p>
      <p>Cashier: {transaction?.username}</p>
    </div>

    <table className="w-full mb-4">
      <thead>
        <tr>
          <th className="text-left">Item</th>
          <th className="text-right">Qty</th>
          <th className="text-right">Price</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {transaction?.items?.map((item) => (
          <tr key={item?.product_id}>
            <td>{item?.product_name}</td>
            <td className="text-right">{item?.quantity}</td>
            <td className="text-right">{formatCurrency(item?.unit_price)}</td>
            <td className="text-right">
              {formatCurrency(item.quantity * item?.unit_price)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="border-t pt-4">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>
          {formatCurrency(transaction.subtotal || transaction.total_amount)}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Tax:</span>
        <span>{formatCurrency(transaction.tax || 0.0)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatCurrency(Number(transaction.total_amount))}</span>
      </div>
    </div>

    <div className="text-center mt-4">
      <p>Thank you for shopping with us!</p>
      <p>Please come again</p>
    </div>
  </div>
));

Receipt.displayName = "Receipt";

Receipt.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        product_id: PropTypes.string.isRequired,
        product_name: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        unit_price: PropTypes.number.isRequired,
      })
    ).isRequired,
    subtotal: PropTypes.number.isRequired,
    tax: PropTypes.number.isRequired,
    total_amount: PropTypes.number.isRequired,
  }).isRequired,
};

const ReceiptPrinter = ({ transaction }) => {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });
  console.log("Receipt-", transaction);

  return (
    <div>
      <button
        onClick={() => handlePrint()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Print Receipt
      </button>
      <div style={{ display: "block" }}>
        <Receipt ref={contentRef} transaction={transaction} />
      </div>
    </div>
  );
};

ReceiptPrinter.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    subtotal: PropTypes.number.isRequired,
    tax: PropTypes.number.isRequired,
    total_amount: PropTypes.number.isRequired,
  }).isRequired,
};

export default ReceiptPrinter;
