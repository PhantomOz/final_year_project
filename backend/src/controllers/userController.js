const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database/pool");

const userController = {
  async register(req, res) {
    try {
      const { username, password, role } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
        [username, hashedPassword, role]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;

      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error during login", error: error.message });
    }
  },
};

module.exports = userController;
