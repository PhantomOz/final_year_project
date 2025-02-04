const pool = require("../database/pool");

const dashboardController = {
  async getDashboardStats(req, res) {
    try {
      const result = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM transactions) as total_sales,
          (SELECT COUNT(*) FROM products) as total_products,
          (SELECT COUNT(*) FROM products WHERE stock_quantity <= 10) as low_stock_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM transactions) as total_revenue
      `);

      const dashboardStats = {
        totalSales: parseInt(result.rows[0].total_sales),
        totalProducts: parseInt(result.rows[0].total_products),
        lowStockCount: parseInt(result.rows[0].low_stock_count),
        totalRevenue: parseFloat(result.rows[0].total_revenue),
      };

      res.json(dashboardStats);
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      res.status(500).json({
        message: "Error fetching dashboard stats",
        error: error.message,
      });
    }
  },

  async getLowStockItems(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.stock_quantity,
          c.name as category
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.stock_quantity <= 10
        ORDER BY p.stock_quantity ASC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Low Stock Items Error:", error);
      res.status(500).json({
        message: "Error fetching low stock items",
        error: error.message,
      });
    }
  },
};

module.exports = dashboardController;
