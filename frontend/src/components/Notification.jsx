import { createPortal } from "react-dom";

const Notification = ({ type, message, onClose }) => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return createPortal(
    <div
      className={`fixed top-4 right-4 z-50 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg`}
    >
      <div className="flex items-center">
        <span className="mr-4">{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Notification;
