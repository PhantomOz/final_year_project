const pool = require("../database/pool");

const scannerController = {
  async handleScannerInput(req, res) {
    try {
      const { barcode } = req.body;
      const result = await pool.query(
        "SELECT * FROM products WHERE barcode = $1",
        [barcode]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error processing scanner input",
          error: error.message,
        });
    }
  },
};

module.exports = scannerController;
