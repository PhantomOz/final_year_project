import { useNotification } from "../context/NotificationContext";

export const STOCK_THRESHOLD = 10;

export const useInventoryAlerts = () => {
  const { showNotification } = useNotification();

  const checkLowStock = (products) => {
    const lowStockItems = products.filter(
      (product) => product.stock_quantity <= STOCK_THRESHOLD
    );

    if (lowStockItems.length > 0) {
      showNotification(
        "warning",
        `Low stock alert: ${lowStockItems.length} items need reordering`
      );
    }
  };

  const checkExpiredProducts = (products) => {
    const today = new Date();
    const expiringSoon = products.filter((product) => {
      if (!product.expiry_date) return false;
      const expiryDate = new Date(product.expiry_date);
      const daysUntilExpiry = (expiryDate - today) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30;
    });

    if (expiringSoon.length > 0) {
      showNotification(
        "warning",
        `Expiration alert: ${expiringSoon.length} items expiring soon`
      );
    }
  };

  return {
    checkLowStock,
    checkExpiredProducts,
  };
};
