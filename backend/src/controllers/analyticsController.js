const pool = require("../database/pool");

const getDateRangeFilter = (range) => {
  switch (range) {
    case "day":
      return "created_at >= CURRENT_DATE";
    case "week":
      return "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    case "month":
      return "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    case "year":
      return "created_at >= CURRENT_DATE - INTERVAL '365 days'";
    default:
      return "created_at >= CURRENT_DATE";
  }
};

const getTimeGrouping = (range) => {
  switch (range) {
    case "day":
      return "hour";
    case "week":
      return "day";
    case "month":
      return "day";
    case "year":
      return "month";
    default:
      return "hour";
  }
};

const analyticsController = {
  async getRangeStats(req, res) {
    try {
      const { range = "day" } = req.query;
      const dateFilter = getDateRangeFilter(range);

      const result = await pool.query(`
        SELECT
          COUNT(*) as transaction_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COUNT(DISTINCT user_id) as unique_users
        FROM transactions t
        WHERE ${dateFilter}
      `);

      res.json({
        transactionCount: parseInt(result.rows[0].transaction_count),
        totalAmount: parseFloat(result.rows[0].total_amount),
        uniqueUsers: parseInt(result.rows[0].unique_users),
      });
    } catch (error) {
      console.error("Range Stats Error:", error);
      res.status(500).json({
        message: "Error fetching range statistics",
        error: error.message,
      });
    }
  },

  async getSalesTrends(req, res) {
    try {
      const { range = "day" } = req.query;
      const dateFilter = getDateRangeFilter(range);

      const result = await pool.query(`
        WITH daily_sales AS (
          SELECT 
            DATE_TRUNC('day', t.created_at) as sale_date,
            SUM(t.total_amount) as daily_total
          FROM transactions t
          WHERE ${dateFilter}
          GROUP BY DATE_TRUNC('day', t.created_at)
          ORDER BY sale_date
        )
        SELECT 
          TO_CHAR(sale_date, 'YYYY-MM-DD') as date,
          COALESCE(daily_total, 0) as total
        FROM daily_sales
      `);

      const data = {
        labels: result.rows.map((row) => row.date),
        datasets: [
          {
            label: "Sales",
            data: result.rows.map((row) => row.total),
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      };

      res.json(data);
    } catch (error) {
      console.error("Sales Trends Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching sales trends", error: error.message });
    }
  },

  async getTopProducts(req, res) {
    try {
      const { range = "day" } = req.query;
      const dateFilter = getDateRangeFilter(range).replace(
        "created_at",
        "t.created_at"
      );

      const result = await pool.query(`
        SELECT 
          p.name,
          SUM(ti.quantity) as total_quantity,
          SUM(ti.quantity * ti.unit_price) as total_revenue
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN products p ON p.id = ti.product_id
        WHERE ${dateFilter}
        GROUP BY p.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `);

      const data = {
        labels: result.rows.map((row) => row.name),
        datasets: [
          {
            label: "Revenue",
            data: result.rows.map((row) => row.total_revenue),
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      };

      res.json(data);
    } catch (error) {
      console.error("Top Products Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching top products", error: error.message });
    }
  },

  async getSeasonalTrends(req, res) {
    try {
      const { range = "day" } = req.query;
      const dateFilter = getDateRangeFilter(range);

      const result = await pool.query(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM transactions
        WHERE ${dateFilter}
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `);

      const data = {
        labels: result.rows.map((row) => row.payment_method),
        datasets: [
          {
            data: result.rows.map((row) => row.total_amount),
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
              "rgba(255, 206, 86, 0.5)",
            ],
          },
        ],
      };

      res.json(data);
    } catch (error) {
      console.error("Seasonal Trends Error:", error);
      res.status(500).json({
        message: "Error fetching seasonal trends",
        error: error.message,
      });
    }
  },

  async getLowStockAlerts(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.stock_quantity as current_stock,
          p.category,
          COALESCE(
            (SELECT ROUND(AVG(ti.quantity))
             FROM transaction_items ti
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE ti.product_id = p.id
             AND t.created_at >= NOW() - INTERVAL '30 days'
            ), 0) as avg_monthly_demand
        FROM products p
        WHERE p.stock_quantity <= 
          GREATEST(10, (
            SELECT COALESCE(ROUND(AVG(ti.quantity) * 2), 10)
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.product_id = p.id
            AND t.created_at >= NOW() - INTERVAL '30 days'
          ))
        ORDER BY p.stock_quantity ASC
      `);

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching low stock alerts",
        error: error.message,
      });
    }
  },

  async getDashboardStats(req, res) {
    try {
      const { range = "day" } = req.query;
      const dateFilter = getDateRangeFilter(range);

      const stats = await pool.query(`
        SELECT
          COUNT(*) as period_transactions,
          COALESCE(SUM(total_amount), 0) as period_revenue,
          COUNT(DISTINCT user_id) as active_users,
          (SELECT COUNT(*) FROM products WHERE stock_quantity <= 10) as low_stock_items
        FROM transactions
        WHERE ${dateFilter}
      `);

      const dashboardStats = {
        periodTransactions: parseInt(stats.rows[0].period_transactions),
        periodRevenue: parseFloat(stats.rows[0].period_revenue),
        activeUsers: parseInt(stats.rows[0].active_users),
        lowStockItems: parseInt(stats.rows[0].low_stock_items),
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

  async getDetailedStats(req, res) {
    try {
      const dailyStats = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_revenue,
          COUNT(DISTINCT user_id) as unique_users
        FROM transactions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      const monthlyStats = await pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_revenue,
          COUNT(DISTINCT user_id) as unique_users,
          ROUND(AVG(total_amount), 2) as average_transaction_value
        FROM transactions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      const yearlyStats = await pool.query(`
        SELECT 
          DATE_TRUNC('year', created_at) as year,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_revenue,
          COUNT(DISTINCT user_id) as unique_users,
          ROUND(AVG(total_amount), 2) as average_transaction_value
        FROM transactions 
        GROUP BY DATE_TRUNC('year', created_at)
        ORDER BY year DESC
      `);

      const topProductsByPeriod = await pool.query(`
        WITH monthly_products AS (
          SELECT 
            p.name,
            DATE_TRUNC('month', t.created_at) as month,
            SUM(ti.quantity) as total_quantity,
            SUM(ti.quantity * ti.unit_price) as total_revenue
          FROM transaction_items ti
          JOIN transactions t ON t.id = ti.transaction_id
          JOIN products p ON p.id = ti.product_id
          WHERE t.created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY p.name, DATE_TRUNC('month', t.created_at)
        )
        SELECT 
          name,
          month,
          total_quantity,
          total_revenue,
          RANK() OVER (PARTITION BY month ORDER BY total_revenue DESC) as rank
        FROM monthly_products
        WHERE month >= CURRENT_DATE - INTERVAL '12 months'
        ORDER BY month DESC, total_revenue DESC
      `);

      res.json({
        daily: dailyStats.rows,
        monthly: monthlyStats.rows,
        yearly: yearlyStats.rows,
        topProducts: topProductsByPeriod.rows,
      });
    } catch (error) {
      console.error("Detailed Stats Error:", error);
      res.status(500).json({
        message: "Error fetching detailed statistics",
        error: error.message,
      });
    }
  },

  formatDate(date, range) {
    // Implement date formatting logic based on the range
    return date.toISOString().split("T")[0]; // Placeholder, actual implementation needed
  },
};

module.exports = analyticsController;
