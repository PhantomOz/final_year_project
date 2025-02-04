const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/auth");
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const transactionController = require("../controllers/transactionController");
const inventoryController = require("../controllers/inventoryController");
const scannerController = require("../controllers/scannerController");
const analyticsController = require("../controllers/analyticsController");
const dashboardController = require("../controllers/dashboardController");

// User routes
router.post(
  "/users/register",
  authMiddleware,
  isAdmin,
  userController.register
);
router.post("/users/login", userController.login);
router.get("/users/me", authMiddleware, userController.getCurrentUser);

// User management routes
router.get("/users", authMiddleware, isAdmin, userController.getAllUsers);
router.delete("/users/:id", authMiddleware, isAdmin, userController.deleteUser);
router.post(
  "/users/:id/change-password",
  authMiddleware,
  userController.changePassword
);
router.put("/users/:id", authMiddleware, isAdmin, userController.updateUser);

// Product routes
router.get("/categories", authMiddleware, productController.getCategories);
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  productController.createProduct
);
router.get("/products", authMiddleware, productController.getAllProducts);
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productController.updateProduct
);
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productController.deleteProduct
);
router.patch(
  "/products/:id/stock",
  authMiddleware,
  productController.updateProductStock
);

// Transaction routes
router.post(
  "/transactions",
  authMiddleware,
  transactionController.createTransaction
);
router.get(
  "/transactions",
  authMiddleware,
  transactionController.getTransactions
);
router.get(
  "/transactions/:id",
  authMiddleware,
  transactionController.getTransactionById
);
router.get(
  "/transactions/user/:userId",
  authMiddleware,
  transactionController.getTransactionsByUserId
);

// Inventory routes
router.get("/inventory", authMiddleware, inventoryController.getInventory);
router.get(
  "/inventory/low-stock",
  authMiddleware,
  inventoryController.getLowStock
);

// Scanner routes
router.post(
  "/scanner-input",
  authMiddleware,
  scannerController.handleScannerInput
);

// Dashboard routes
router.get(
  "/dashboard/stats",
  authMiddleware,
  dashboardController.getDashboardStats
);
router.get(
  "/dashboard/low-stock",
  authMiddleware,
  dashboardController.getLowStockItems
);

// Analytics routes
router.get(
  "/analytics/range-stats",
  authMiddleware,
  analyticsController.getRangeStats
);
router.get(
  "/analytics/sales-trends",
  authMiddleware,
  analyticsController.getSalesTrends
);
router.get(
  "/analytics/top-products",
  authMiddleware,
  analyticsController.getTopProducts
);
router.get(
  "/analytics/seasonal-trends",
  authMiddleware,
  isAdmin,
  analyticsController.getSeasonalTrends
);
router.get(
  "/analytics/low-stock",
  authMiddleware,
  analyticsController.getLowStockAlerts
);
router.get(
  "/analytics/detailed-stats",
  authMiddleware,
  isAdmin,
  analyticsController.getDetailedStats
);

module.exports = router;
