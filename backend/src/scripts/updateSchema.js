const { pool } = require("../database/pool");
require("dotenv").config();

async function updateSchema() {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query("BEGIN");

    console.log("Starting schema updates...");

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Categories table created");

    // Add category_id to products if it doesn't exist
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'category_id';
    `);

    if (columnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN category_id INTEGER REFERENCES categories(id);
      `);
      console.log("Category_id column added to products");
    }

    // Insert default categories
    const defaultCategories = [
      "Electronics",
      "Groceries",
      "Clothing",
      "Home & Kitchen",
      "Beverages",
      "Snacks",
      "Others",
    ];

    for (const category of defaultCategories) {
      await client.query(
        `INSERT INTO categories (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO NOTHING`,
        [category]
      );
    }
    console.log("Default categories inserted");

    // Set default category for existing products
    await client.query(`
      UPDATE products 
      SET category_id = (SELECT id FROM categories WHERE name = 'Others')
      WHERE category_id IS NULL;
    `);
    console.log("Default category set for existing products");

    // Commit transaction
    await client.query("COMMIT");
    console.log("Schema updates completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating schema:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the updates
updateSchema()
  .then(() => {
    console.log("Schema update script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Schema update failed:", error);
    process.exit(1);
  });
