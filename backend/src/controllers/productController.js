const pool = require("../database/pool");

const productController = {
  async createProduct(req, res) {
    try {
      const { name, price, stock_quantity, barcode, category_id } = req.body;
      const result = await pool.query(
        "INSERT INTO products (name, price, stock_quantity, barcode, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, price, stock_quantity, barcode, category_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating product", error: error.message });
    }
  },

  async getAllProducts(req, res) {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.name
      `);
      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching products", error: error.message });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, price, stock_quantity, barcode, category_id } = req.body;

      let updateFields = [];
      let queryParams = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        queryParams.push(name);
        paramCount++;
      }
      if (price !== undefined) {
        updateFields.push(`price = $${paramCount}`);
        queryParams.push(price);
        paramCount++;
      }
      if (stock_quantity !== undefined) {
        updateFields.push(`stock_quantity = $${paramCount}`);
        queryParams.push(stock_quantity);
        paramCount++;
      }
      if (barcode !== undefined) {
        updateFields.push(`barcode = $${paramCount}`);
        queryParams.push(barcode);
        paramCount++;
      }
      if (category_id !== undefined) {
        updateFields.push(`category_id = $${paramCount}`);
        queryParams.push(category_id);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      queryParams.push(id);
      const query = `
        UPDATE products 
        SET ${updateFields.join(", ")} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await pool.query(query, queryParams);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating product", error: error.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting product", error: error.message });
    }
  },

  async updateProductStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, type } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (type !== "increase" && type !== "decrease") {
        return res.status(400).json({
          message: "Invalid type. Type must be 'increase' or 'decrease'",
        });
      }

      let updateQuery = "";
      if (type === "increase") {
        updateQuery = `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING *`;
      } else if (type === "decrease") {
        updateQuery = `UPDATE products SET stock_quantity = GREATEST(stock_quantity - $1, 0) WHERE id = $2 AND stock_quantity >= $1 RETURNING *`;
      }

      const result = await pool.query(updateQuery, [quantity, id]);

      if (result.rows.length === 0) {
        // Check if product exists
        const productExists = await pool.query(
          "SELECT stock_quantity FROM products WHERE id = $1",
          [id]
        );

        if (productExists.rows.length === 0) {
          return res.status(404).json({ message: "Product not found" });
        } else if (type === "decrease") {
          return res.status(400).json({
            message: "Insufficient stock",
            current_stock: productExists.rows[0].stock_quantity,
          });
        }
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        message: "Error updating product stock",
        error: error.message,
      });
    }
  },

  async getCategories(req, res) {
    try {
      const result = await pool.query("SELECT * FROM categories ORDER BY name");
      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching categories", error: error.message });
    }
  },
};

module.exports = productController;
