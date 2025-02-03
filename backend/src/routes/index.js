const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/auth");
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const transactionController = require("../controllers/transactionController");
const inventoryController = require("../controllers/inventoryController");
const scannerController = require("../controllers/scannerController");

// User routes
router.post(
  "/users/register",
  authMiddleware,
  isAdmin,
  userController.register
);
router.post("/users/login", userController.login);
router.get("/users/me", authMiddleware, userController.getCurrentUser);

// Product routes
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

module.exports = router;
