const pool = require("../database/pool");

const inventoryController = {
  async getInventory(req, res) {
    try {
      const result = await pool.query(
        "SELECT * FROM products ORDER BY stock_quantity ASC"
      );
      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching inventory", error: error.message });
    }
  },

  async getLowStock(req, res) {
    try {
      const threshold = req.query.threshold || 10;
      const result = await pool.query(
        "SELECT * FROM products WHERE stock_quantity <= $1 ORDER BY stock_quantity ASC",
        [threshold]
      );
      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error fetching low stock items",
          error: error.message,
        });
    }
  },
};

module.exports = inventoryController;
