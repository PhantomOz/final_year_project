const pool = require("../database/pool");

const transactionController = {
  async createTransaction(req, res) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { user_id, items, payment_method } = req.body;

      // Calculate total amount
      const total_amount = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      // Create transaction
      const transactionResult = await client.query(
        "INSERT INTO transactions (user_id, total_amount, payment_method) VALUES ($1, $2, $3) RETURNING *",
        [user_id, total_amount, payment_method]
      );

      const transaction_id = transactionResult.rows[0].id;

      // Add transaction items and update inventory
      for (const item of items) {
        await client.query(
          "INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
          [transaction_id, item.product_id, item.quantity, item.unit_price]
        );

        // Update product stock
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
      }

      await client.query("COMMIT");
      res.status(201).json(transactionResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      res
        .status(500)
        .json({ message: "Error creating transaction", error: error.message });
    } finally {
      client.release();
    }
  },

  async getTransactions(req, res) {
    try {
      const result = await pool.query(`
        SELECT t.*, u.username, 
          json_agg(json_build_object(
            'product_id', ti.product_id,
            'quantity', ti.quantity,
            'unit_price', ti.unit_price,
            'product_name', p.name
          )) as items
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        GROUP BY t.id, u.username
        ORDER BY t.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching transactions", error: error.message });
    }
  },
};

module.exports = transactionController;
