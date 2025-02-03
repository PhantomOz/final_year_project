const pool = require("../database/pool");

const transactionController = {
  async createTransaction(req, res) {
    const client = await pool;
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

      // Fetch complete transaction details
      const completeTransaction = await client.query(
        `
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
        WHERE t.id = $1
        GROUP BY t.id, u.username
      `,
        [transaction_id]
      );

      res.status(201).json(completeTransaction.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      res
        .status(500)
        .json({ message: "Error creating transaction", error: error.message });
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

  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `
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
        WHERE t.id = $1
        GROUP BY t.id, u.username
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching transaction", error: error.message });
    }
  },

  async getTransactionsByUserId(req, res) {
    try {
      const { userId } = req.params;

      // Verify if the requesting user is admin or the owner of the transactions
      if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const result = await pool.query(
        `
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
        WHERE t.user_id = $1
        GROUP BY t.id, u.username
        ORDER BY t.created_at DESC
      `,
        [userId]
      );

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching user transactions",
        error: error.message,
      });
    }
  },
};

module.exports = transactionController;
