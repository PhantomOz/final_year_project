const pool = require("../database/pool");

const productController = {
  async createProduct(req, res) {
    try {
      const { name, price, stock_quantity, barcode } = req.body;
      const result = await pool.query(
        "INSERT INTO products (name, price, stock_quantity, barcode) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, price, stock_quantity, barcode]
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
      const result = await pool.query("SELECT * FROM products ORDER BY name");
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
      const { name, price, stock_quantity, barcode } = req.body;
      const result = await pool.query(
        "UPDATE products SET name = $1, price = $2, stock_quantity = $3, barcode = $4 WHERE id = $5 RETURNING *",
        [name, price, stock_quantity, barcode, id]
      );
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
};

module.exports = productController;
