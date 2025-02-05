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

const formatCurrency = (value) => {
  return `₦${value.toFixed(2)}`;
};

const generateInsightsFromAnalysis = (analysis) => {
  const insights = [];

  // Revenue insights
  insights.push(`Total revenue: ${formatCurrency(analysis.totalRevenue)}`);
  insights.push(
    `Average transaction value: ${formatCurrency(
      analysis.averageTransactionValue
    )}`
  );

  // Monthly trends insights
  if (analysis.monthlyTrends && analysis.monthlyTrends.length > 1) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const highestMonth = analysis.monthlyTrends.reduce((max, current) =>
      current.amount > max.amount ? current : max
    );

    const monthName =
      monthNames[parseInt(highestMonth.month.split("-")[1]) - 1];
    insights.push(
      `Highest revenue month: ${monthName} (${formatCurrency(
        highestMonth.amount
      )})`
    );
  }

  // Top products insight
  if (analysis.topProducts.length > 0) {
    const topProduct = analysis.topProducts[0];
    insights.push(
      `Best-selling product: ${topProduct.product} (${formatCurrency(
        topProduct.amount
      )})`
    );
  }

  // Time-based insights
  const busyHour = analysis.timeAnalysis.hourly.indexOf(
    Math.max(...analysis.timeAnalysis.hourly)
  );
  insights.push(`Peak business hour: ${busyHour}:00`);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const busiestDay = analysis.timeAnalysis.daily.indexOf(
    Math.max(...analysis.timeAnalysis.daily)
  );
  insights.push(`Busiest day of the week: ${daysOfWeek[busiestDay]}`);

  // Growth trend insights
  if (analysis.monthlyTrends && analysis.monthlyTrends.length > 1) {
    const firstMonth = analysis.monthlyTrends[0].amount;
    const lastMonth =
      analysis.monthlyTrends[analysis.monthlyTrends.length - 1].amount;
    const growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;

    if (!isNaN(growthRate)) {
      insights.push(`Monthly growth rate: ${growthRate.toFixed(1)}%`);
    }
  }

  return insights.join("\n");
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

  async analyzeTransactionData(req, res) {
    try {
      const uploadedData = req.body;

      // Basic validation
      if (!Array.isArray(uploadedData) || uploadedData.length === 0) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      // Initialize analysis results
      const analysis = {
        totalTransactions: uploadedData.length,
        totalRevenue: 0,
        averageTransactionValue: 0,
        salesByDate: {},
        topProducts: {},
        salesTrends: [],
        timeAnalysis: {
          hourly: Array(24).fill(0),
          daily: Array(7).fill(0),
          monthly: Array(12).fill(0),
        },
      };

      // Process each transaction
      uploadedData.forEach((transaction) => {
        // Ensure proper date parsing
        const dateStr = transaction.transaction_date;
        const date = new Date(dateStr + "T00:00:00"); // Add time component for consistent parsing

        // Use the amount directly from the CSV as it's pre-calculated
        const amount = parseFloat(transaction.amount);
        const productName = transaction.product_name;

        if (isNaN(amount)) {
          console.error("Invalid amount for transaction:", transaction);
          return; // Skip this transaction
        }

        // Accumulate total revenue
        analysis.totalRevenue += amount;

        // Group by date (using YYYY-MM-DD format)
        const dateKey = dateStr; // Use the original date string from CSV
        if (!analysis.salesByDate[dateKey]) {
          analysis.salesByDate[dateKey] = 0;
        }
        analysis.salesByDate[dateKey] += amount;

        // Track product sales
        if (!analysis.topProducts[productName]) {
          analysis.topProducts[productName] = 0;
        }
        analysis.topProducts[productName] += amount;

        // Time-based analysis
        const dayOfWeek = date.getDay();
        const month = date.getMonth();

        analysis.timeAnalysis.daily[dayOfWeek]++;
        analysis.timeAnalysis.monthly[month]++;
      });

      // Calculate average transaction value
      analysis.averageTransactionValue =
        analysis.totalRevenue / analysis.totalTransactions;

      // Convert salesByDate to sorted array for trends
      analysis.salesTrends = Object.entries(analysis.salesByDate)
        .map(([date, amount]) => ({
          date,
          amount: Number(amount.toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Group by month for monthly trends
      const monthlyTrends = {};
      analysis.salesTrends.forEach(({ date, amount }) => {
        const monthKey = date.substring(0, 7); // Get YYYY-MM
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = 0;
        }
        monthlyTrends[monthKey] += amount;
      });

      // Convert monthly trends to array
      analysis.monthlyTrends = Object.entries(monthlyTrends)
        .map(([month, amount]) => ({
          month,
          amount: Number(amount.toFixed(2)),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Convert topProducts to sorted array
      analysis.topProducts = Object.entries(analysis.topProducts)
        .map(([product, amount]) => ({
          product,
          amount: Number(amount.toFixed(2)),
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10 products

      // Format numbers
      analysis.totalRevenue = Number(analysis.totalRevenue.toFixed(2));
      analysis.averageTransactionValue = Number(
        analysis.averageTransactionValue.toFixed(2)
      );

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing transaction data:", error);
      res.status(500).json({
        message: "Error analyzing transaction data",
        error: error.message,
      });
    }
  },
};

module.exports = analyticsController;
