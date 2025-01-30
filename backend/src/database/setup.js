const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

const setupDatabase = async () => {
  try {
    // Read the schema file
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

    // Execute the schema
    await pool.query(schema);

    console.log("Database schema created successfully");

    // Optional: Add some initial data
    await pool.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', '$2b$10$your_hashed_password', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    console.log("Initial data inserted successfully");
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

setupDatabase();
